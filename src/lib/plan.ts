import { useMemo } from 'react'
import { useGuardado } from './guardado'
import type { Trabajo } from './types'

/** Un parque en el plan y desde cuándo (ISO), para sacarlo cuando se registre su corte. */
interface EnPlan {
  id: string
  desde: string
}

/** Plan de corte: los parques que hay que ir a cortar. Se guarda en el teléfono. */
export function usePlan(trabajos: Trabajo[]) {
  const [guardado, setGuardado] = useGuardado<EnPlan[]>('raygrass.plan', [])

  // Un parque sale del plan cuando se registra un corte suyo después de haberlo agregado.
  const ids = useMemo(() => {
    const cortadoDesde = (e: EnPlan) => trabajos.some((t) => t.parque_id === e.id && t.tipo === 'corte' && t.created_at > e.desde)
    return new Set(guardado.filter((e) => !cortadoDesde(e)).map((e) => e.id))
  }, [guardado, trabajos])

  /** Reemplaza el plan; los que ya estaban conservan su fecha. */
  const fijar = (nuevos: Iterable<string>) => {
    const ahora = new Date().toISOString()
    const previos = new Map(guardado.filter((e) => ids.has(e.id)).map((e) => [e.id, e.desde]))
    setGuardado([...new Set(nuevos)].map((id) => ({ id, desde: previos.get(id) ?? ahora })))
  }

  return {
    ids,
    fijar,
    agregar: (xs: string[]) => fijar([...ids, ...xs]),
    quitar: (xs: string[]) => fijar([...ids].filter((id) => !xs.includes(id))),
  }
}
