import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import type { Cliente, Gasto, Pago, Parque, Trabajo } from './types'

/** Trae todas las filas paginando (PostgREST corta en 1000). */
async function todo<T>(tabla: string, orden: string, asc = true): Promise<T[]> {
  const paso = 1000
  const out: T[] = []
  for (let desde = 0; ; desde += paso) {
    const { data, error } = await supabase
      .from(tabla)
      .select('*')
      .order(orden, { ascending: asc })
      .order('id')
      .range(desde, desde + paso - 1)
    if (error) throw error
    out.push(...(data as T[]))
    if (!data || data.length < paso) return out
  }
}

const NUMERICOS = ['precio', 'importe', 'pagado', 'saldo', 'monto'] as const
function numerar<T>(filas: T[]): T[] {
  for (const f of filas as Record<string, unknown>[]) {
    for (const k of NUMERICOS) if (k in f && f[k] != null) f[k] = Number(f[k])
  }
  return filas
}

export const useClientes = () =>
  useQuery({ queryKey: ['clientes'], queryFn: () => todo<Cliente>('clientes', 'nombre') })
export const useParques = () =>
  useQuery({ queryKey: ['parques'], queryFn: async () => numerar(await todo<Parque>('parques', 'nombre')) })
export const useTrabajos = () =>
  useQuery({
    queryKey: ['trabajos'],
    queryFn: async () => numerar(await todo<Trabajo>('trabajos_estado', 'fecha', false)),
  })
export const usePagos = () =>
  useQuery({ queryKey: ['pagos'], queryFn: async () => numerar(await todo<Pago>('pagos', 'fecha', false)) })
export const useGastos = () =>
  useQuery({ queryKey: ['gastos'], queryFn: async () => numerar(await todo<Gasto>('gastos', 'fecha', false)) })

/** Todo junto, para las pantallas que cruzan datos. */
export function useDatos() {
  const c = useClientes()
  const p = useParques()
  const t = useTrabajos()
  const pg = usePagos()
  const g = useGastos()
  const qs = [c, p, t, pg, g]
  return {
    clientes: c.data ?? [],
    parques: p.data ?? [],
    trabajos: t.data ?? [],
    pagos: pg.data ?? [],
    gastos: g.data ?? [],
    cargando: qs.some((q) => q.isPending),
    error: qs.find((q) => q.error)?.error ?? null,
  }
}

type Tabla = 'clientes' | 'parques' | 'trabajos' | 'pagos' | 'gastos'

// Qué cachés hay que refrescar cuando cambia cada tabla (los pagos cambian el estado de los trabajos).
const AFECTA: Record<Tabla, string[]> = {
  clientes: ['clientes'],
  parques: ['parques'],
  trabajos: ['trabajos'],
  pagos: ['pagos', 'trabajos'],
  gastos: ['gastos'],
}

function chequear<T>(r: { data: T; error: unknown }) {
  if (r.error) throw r.error
  return r.data
}

export function useGuardar(tabla: Tabla) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (fila: Record<string, unknown> & { id?: string }) => {
      const { id, ...resto } = fila
      if (id) return chequear(await supabase.from(tabla).update(resto).eq('id', id).select().single())
      return chequear(await supabase.from(tabla).insert(resto).select().single())
    },
    onSuccess: () => AFECTA[tabla].forEach((k) => qc.invalidateQueries({ queryKey: [k] })),
  })
}

export function useBorrar(tabla: Tabla) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => chequear(await supabase.from(tabla).delete().eq('id', id)),
    onSuccess: () => {
      AFECTA[tabla].forEach((k) => qc.invalidateQueries({ queryKey: [k] }))
      // borrar un trabajo borra sus pagos ligados (cascade)
      if (tabla === 'trabajos') qc.invalidateQueries({ queryKey: ['pagos'] })
    },
  })
}

/** Registra un trabajo y, si se cobró algo en el momento, el pago ligado a ese trabajo. */
export function useRegistrarTrabajo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: {
      cliente_id: string
      parque_id: string | null
      tipo: 'corte' | 'particular'
      fecha: string
      descripcion: string | null
      importe: number
      cobrado: number
      nuevoPrecio?: number
    }) => {
      const { cobrado, nuevoPrecio, ...trabajo } = v
      const t = chequear(await supabase.from('trabajos').insert(trabajo).select().single()) as { id: string }
      if (cobrado > 0) {
        chequear(
          await supabase
            .from('pagos')
            .insert({ cliente_id: v.cliente_id, trabajo_id: t.id, fecha: v.fecha, monto: cobrado }),
        )
      }
      if (nuevoPrecio != null && v.parque_id) {
        chequear(await supabase.from('parques').update({ precio: nuevoPrecio }).eq('id', v.parque_id))
      }
      return t
    },
    onSuccess: () => ['trabajos', 'pagos', 'parques'].forEach((k) => qc.invalidateQueries({ queryKey: [k] })),
  })
}

export const mensajeError = (e: unknown) => {
  const m = (e as { message?: string })?.message ?? String(e)
  if (/invalid login credentials/i.test(m)) return 'El mail o la contraseña no coinciden.'
  if (/failed to fetch|network/i.test(m)) return 'No hay conexión. Revisá internet y probá de nuevo.'
  if (/password should be at least/i.test(m)) return 'La contraseña tiene que tener al menos 6 caracteres.'
  return m
}
