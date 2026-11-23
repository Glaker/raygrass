import { diasEntre, hoy } from './format'
import type { Parque, Trabajo } from './types'

export interface StatsParque {
  cortes: number
  generado: number
  saldo: number
  ultimo: string | null
  diasDesde: number | null
  /** Cada cuántos días se corta, según los últimos cortes (null si hay menos de 2). */
  frecuencia: number | null
  /** Promedio de todo el historial. */
  frecuenciaHistorica: number | null
  /** diasDesde / frecuencia: 1 = ya toca cortar. */
  avance: number | null
}

const mediana = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/** Solo cuentan los cortes de pasto; los trabajos particulares quedan afuera. */
export function statsParque(parque: Parque, trabajos: Trabajo[]): StatsParque {
  const propios = trabajos.filter((t) => t.parque_id === parque.id)
  const cortes = propios.filter((t) => t.tipo === 'corte')
  const fechas = [...new Set(cortes.map((t) => t.fecha))].sort()
  const intervalos = fechas.slice(1).map((f, i) => diasEntre(fechas[i], f))
  // La frecuencia cambia con la estación: miramos los últimos 4 intervalos.
  const recientes = intervalos.slice(-4)
  const frecuencia = recientes.length ? Math.round(mediana(recientes)) : null
  const ultimo = fechas.at(-1) ?? null
  const diasDesde = ultimo ? diasEntre(ultimo, hoy()) : null
  return {
    cortes: cortes.length,
    generado: cortes.reduce((s, t) => s + t.importe, 0),
    saldo: propios.reduce((s, t) => s + t.saldo, 0),
    ultimo,
    diasDesde,
    frecuencia,
    frecuenciaHistorica:
      fechas.length > 1 ? Math.round(diasEntre(fechas[0], fechas.at(-1)!) / (fechas.length - 1)) : null,
    avance: frecuencia && diasDesde != null ? diasDesde / Math.max(frecuencia, 1) : null,
  }
}

export interface SaldoCliente {
  facturado: number
  pagado: number
  saldo: number
}

export function saldosPorCliente(trabajos: Trabajo[], pagos: { cliente_id: string; monto: number }[]) {
  const m = new Map<string, SaldoCliente>()
  const get = (id: string) => {
    let s = m.get(id)
    if (!s) m.set(id, (s = { facturado: 0, pagado: 0, saldo: 0 }))
    return s
  }
  for (const t of trabajos) get(t.cliente_id).facturado += t.importe
  for (const p of pagos) get(p.cliente_id).pagado += p.monto
  for (const s of m.values()) s.saldo = s.facturado - s.pagado
  return m
}

export const mesDe = (fecha: string) => fecha.slice(0, 7)

/** Últimos n meses 'YYYY-MM', del más viejo al actual. */
export function ultimosMeses(n: number) {
  const d = new Date()
  const out: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1)
    out.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`)
  }
  return out
}
