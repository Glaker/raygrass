import { Search } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { claseInput } from './ui'

const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Lista con buscador para elegir un cliente o un lugar. */
export function Selector<T extends { id: string }>({
  items,
  texto,
  render,
  onElegir,
  placeholder,
}: {
  items: T[]
  texto: (x: T) => string
  render: (x: T) => ReactNode
  onElegir: (x: T) => void
  placeholder: string
}) {
  const [q, setQ] = useState('')
  const n = normalizar(q.trim())
  const filtrados = n ? items.filter((x) => normalizar(texto(x)).includes(n)) : items
  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-musgo" />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} aria-label={placeholder} className={`${claseInput} pl-11`} />
      </div>
      <ul className="mt-3 divide-y divide-tallo/70 overflow-hidden rounded-2xl border border-tallo bg-hoja">
        {filtrados.map((x) => (
          <li key={x.id}>
            <button type="button" onClick={() => onElegir(x)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-hoja-2">
              {render(x)}
            </button>
          </li>
        ))}
        {filtrados.length === 0 && <li className="px-4 py-4 text-musgo">No hay resultados.</li>}
      </ul>
    </div>
  )
}
