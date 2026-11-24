import { CircleUser, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CorteForm } from '../components/CorteForm'
import { Crecimiento } from '../components/Crecimiento'
import { ElegirPlan } from '../components/ElegirPlan'
import { Marca } from '../components/Logo'
import { Boton, Cargando, Error, EstadoCobro, Hoja, Lista, Seccion, Vacio } from '../components/ui'
import { useDatos } from '../lib/api'
import { useGuardado } from '../lib/guardado'
import { fechaCorta, hoy, nombreMes, plata } from '../lib/format'
import { mesDe, saldosPorCliente, statsParque } from '../lib/stats'
import type { Parque } from '../lib/types'

/** Un parque en el plan y desde cuándo (ISO), para sacarlo cuando se registre su corte. */
interface EnPlan {
  id: string
  desde: string
}

export function Inicio() {
  const { clientes, parques, trabajos, pagos, gastos, cargando, error } = useDatos()
  const [cortando, setCortando] = useState<Parque | null>(null)
  const [verTodos, setVerTodos] = useState(false)
  const [eligiendo, setEligiendo] = useState(false)
  const [guardado, setGuardado] = useGuardado<EnPlan[]>('raygrass.plan', [])

  const nombreCliente = useMemo(() => new Map(clientes.map((c) => [c.id, c.nombre])), [clientes])
  const nombreParque = useMemo(() => new Map(parques.map((p) => [p.id, p])), [parques])

  const activos = useMemo(
    () =>
      parques
        .filter((p) => p.activo)
        .map((p) => ({ p, s: statsParque(p, trabajos), cliente: nombreCliente.get(p.cliente_id) ?? '' }))
        // los que más pasados están primero; los que no tienen frecuencia, al final
        .sort((a, b) => (b.s.avance ?? -1) - (a.s.avance ?? -1) || a.cliente.localeCompare(b.cliente)),
    [parques, trabajos, nombreCliente],
  )

  // Más de 3 veces su frecuencia sin cortar: probablemente ya no es cliente; va aparte.
  const tocan = activos.filter((x) => x.s.avance != null && x.s.avance >= 1 && x.s.avance <= 3)
  const olvidados = activos.filter((x) => x.s.avance != null && x.s.avance > 3)

  // Un parque sale del plan cuando se registra un corte suyo después de haberlo agregado.
  const plan = useMemo(() => {
    const cortadoDesde = (id: string, desde: string) =>
      trabajos.some((t) => t.parque_id === id && t.tipo === 'corte' && t.created_at > desde)
    const vigentes = new Map(guardado.filter((e) => !cortadoDesde(e.id, e.desde)).map((e) => [e.id, e]))
    return activos.filter((x) => vigentes.has(x.p.id))
  }, [guardado, activos, trabajos])

  const guardarPlan = (ids: string[]) => {
    const ahora = new Date().toISOString()
    const previos = new Map(guardado.map((e) => [e.id, e.desde]))
    setGuardado(ids.map((id) => ({ id, desde: previos.get(id) ?? ahora })))
    setEligiendo(false)
  }

  const mes = mesDe(hoy())
  const resumen = useMemo(() => {
    const deMes = <T extends { fecha: string }>(xs: T[]) => xs.filter((x) => mesDe(x.fecha) === mes)
    const saldos = [...saldosPorCliente(trabajos, pagos).values()]
    return {
      trabajado: deMes(trabajos).reduce((s, t) => s + t.importe, 0),
      cortes: deMes(trabajos).filter((t) => t.tipo === 'corte').length,
      cobrado: deMes(pagos).reduce((s, p) => s + p.monto, 0),
      gastado: deMes(gastos).reduce((s, g) => s + g.monto, 0),
      porCobrar: saldos.reduce((s, x) => s + Math.max(x.saldo, 0), 0),
    }
  }, [trabajos, pagos, gastos, mes])

  if (cargando) return <Cargando />

  return (
    <>
      <header className="flex items-center justify-between pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-2">
        <Marca />
        <Link to="/cuenta" className="grid size-11 place-items-center rounded-full text-musgo active:bg-hoja-2" aria-label="Mi cuenta">
          <CircleUser className="size-7" />
        </Link>
      </header>
      <Error error={error} />

      <Seccion
        titulo="Para cortar"
        accion={plan.length > 0 && <span className="text-sm text-musgo">{plan.length} en el plan</span>}
      >
        {plan.length === 0 ? (
          <Vacio>
            Elegí qué parques vas a cortar.
            {tocan.length > 0 && ` Ya ${tocan.length === 1 ? 'toca 1' : `tocan ${tocan.length}`} según cada cuánto se cortan.`}
          </Vacio>
        ) : (
          <Lista>
            {(verTodos ? plan : plan.slice(0, 3)).map(({ p, s }) => (
              <li key={p.id} className="flex items-center gap-3 py-3 pr-3 pl-3">
                <Crecimiento avance={s.avance ?? 0} semilla={p.id} />
                <Link to={`/parques/${p.id}`} className="min-w-0 flex-1">
                  <p className="truncate font-medium">{nombreCliente.get(p.cliente_id)}</p>
                  <p className="truncate text-sm text-musgo">
                    {p.nombre}, {s.ultimo ? `último corte ${fechaCorta(s.ultimo)}` : 'sin cortes'}
                  </p>
                  <p className="num text-sm font-medium">{plata(p.precio)}</p>
                </Link>
                <button
                  onClick={() => setCortando(p)}
                  className="min-h-11 shrink-0 rounded-xl border border-pasto/50 px-3.5 text-[0.95rem] font-semibold text-pasto-claro active:bg-pasto-osc"
                >
                  Cortado
                </button>
              </li>
            ))}
          </Lista>
        )}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Boton variante="secundario" disabled={plan.length <= 3} onClick={() => setVerTodos(!verTodos)}>
            {verTodos ? 'Ver menos' : plan.length > 3 ? `Ver todos (${plan.length})` : 'Ver todos'}
          </Boton>
          <Boton variante="secundario" onClick={() => setEligiendo(true)}>
            <Plus className="size-5" /> Agregar más
          </Boton>
        </div>
        {olvidados.length > 0 && (
          <details className="mt-3 rounded-2xl border border-tallo px-4 py-3 text-musgo">
            <summary className="min-h-8 cursor-pointer">
              {olvidados.length} {olvidados.length === 1 ? 'lugar' : 'lugares'} sin cortar hace mucho. ¿Ya no se cortan?
            </summary>
            <p className="mt-2 text-sm">Si ya no se cortan, entrá y marcalos así para que no aparezcan más.</p>
            <ul className="mt-2">
              {olvidados.map(({ p, s }) => (
                <li key={p.id}>
                  <Link to={`/parques/${p.id}/editar`} className="flex min-h-11 items-center justify-between gap-3 text-rocio">
                    <span className="truncate">
                      {nombreCliente.get(p.cliente_id)}, {p.nombre.toLowerCase()}
                    </span>
                    <span className="shrink-0 text-sm text-musgo">último {fechaCorta(s.ultimo!)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        )}
      </Seccion>

      <Seccion titulo={nombreMes(mes)}>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-tallo bg-tallo">
          <Cifra etiqueta={`Trabajado (${resumen.cortes} cortes)`} valor={resumen.trabajado} />
          <Cifra etiqueta="Cobrado" valor={resumen.cobrado} />
          <Cifra etiqueta="Gastos" valor={resumen.gastado} />
          <Link to="/resumen" className="bg-hoja px-4 py-3 active:bg-hoja-2">
            <p className="text-sm text-musgo">Te deben en total</p>
            <p className="num font-display text-xl font-semibold text-paja">{plata(resumen.porCobrar)}</p>
          </Link>
        </div>
      </Seccion>

      <Seccion
        titulo="Últimos trabajos"
        accion={
          <Link to="/parques" className="text-pasto-claro">
            Ver parques
          </Link>
        }
      >
        {trabajos.length === 0 ? (
          <Vacio>Todavía no cargaste trabajos.</Vacio>
        ) : (
          <Lista>
            {trabajos.slice(0, 8).map((t) => (
              <li key={t.id}>
                <Link to={`/clientes/${t.cliente_id}`} className="flex items-center gap-3 px-4 py-3 active:bg-hoja-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{nombreCliente.get(t.cliente_id)}</p>
                    <p className="truncate text-sm text-musgo">
                      {fechaCorta(t.fecha)}, {t.tipo === 'corte' ? nombreParque.get(t.parque_id!)?.nombre : (t.descripcion ?? 'Trabajo particular')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="num font-medium">{plata(t.importe)}</p>
                    <EstadoCobro importe={t.importe} saldo={t.saldo} />
                  </div>
                </Link>
              </li>
            ))}
          </Lista>
        )}
      </Seccion>

      <Hoja abierta={eligiendo} onCerrar={() => setEligiendo(false)} titulo="Plan de corte">
        {eligiendo && <ElegirPlan opciones={activos} elegidos={plan.map((x) => x.p.id)} onListo={guardarPlan} />}
      </Hoja>

      <Hoja abierta={!!cortando} onCerrar={() => setCortando(null)} titulo={cortando ? `Corte en ${nombreCliente.get(cortando.cliente_id)}` : ''}>
        {cortando && <CorteForm parque={cortando} onListo={() => setCortando(null)} />}
      </Hoja>
    </>
  )
}

function Cifra({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  return (
    <div className="bg-hoja px-4 py-3">
      <p className="text-sm text-musgo">{etiqueta}</p>
      <p className="num font-display text-xl font-semibold">{plata(valor)}</p>
    </div>
  )
}
