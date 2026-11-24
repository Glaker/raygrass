import { Check, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { fechaCorta } from '../lib/format'
import type { StatsParque } from '../lib/stats'
import type { Parque } from '../lib/types'
import { Boton, claseInput } from './ui'

const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export interface Opcion {
  p: Parque
  s: StatsParque
  cliente: string
}

/** Lista con tildes para elegir qué parques entran en el plan de corte. */
export function ElegirPlan({ opciones, elegidos, onListo }: { opciones: Opcion[]; elegidos: string[]; onListo: (ids: string[]) => void }) {
  const [marcados, setMarcados] = useState(() => new Set(elegidos))
  const [q, setQ] = useState('')

  const filtradas = useMemo(() => {
    const n = normalizar(q.trim())
    return n ? opciones.filter((o) => normalizar(`${o.cliente} ${o.p.nombre} ${o.p.direccion ?? ''}`).includes(n)) : opciones
  }, [opciones, q])

  const alternar = (id: string) => {
    const s = new Set(marcados)
    if (s.has(id)) s.delete(id)
    else s.add(id)
    setMarcados(s)
  }

  return (
    <div className="flex flex-col gap-3">
      {opciones.length > 6 && (
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-musgo" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar cliente o lugar"
            aria-label="Buscar cliente o lugar"
            className={`${claseInput} pl-11`}
          />
        </div>
      )}
      <ul className="divide-y divide-tallo/70 overflow-hidden rounded-2xl border border-tallo bg-suelo">
        {filtradas.map(({ p, s, cliente }) => {
          const marcado = marcados.has(p.id)
          return (
            <li key={p.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={marcado}
                onClick={() => alternar(p.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-hoja-2"
              >
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-md border-2 ${marcado ? 'border-pasto bg-pasto text-suelo' : 'border-tallo'}`}
                >
                  {marcado && <Check className="size-4" strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{cliente}</span>
                  <span className="block truncate text-sm text-musgo">
                    {p.nombre}, {s.ultimo ? `último corte ${fechaCorta(s.ultimo)}` : 'sin cortes'}
                  </span>
                </span>
                <Estado s={s} />
              </button>
            </li>
          )
        })}
        {filtradas.length === 0 && <li className="px-4 py-4 text-musgo">No hay resultados.</li>}
      </ul>
      <div className="sticky bottom-0 -mx-5 bg-hoja px-5 pt-2">
        <Boton className="w-full" onClick={() => onListo([...marcados])}>
          {opciones.length > 6 ? `Guardar plan (${marcados.size})` : 'Listo'}
        </Boton>
      </div>
    </div>
  )
}

function Estado({ s }: { s: StatsParque }) {
  if (s.diasDesde == null || s.frecuencia == null) return null
  const atraso = s.diasDesde - s.frecuencia
  if (atraso < 0) return <span className="shrink-0 text-sm text-musgo">en {-atraso} d</span>
  return <span className="shrink-0 text-sm font-medium text-paja">{atraso === 0 ? 'toca hoy' : `+${atraso} d`}</span>
}
