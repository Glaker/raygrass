import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Cargando, Encabezado, Error, Lista, Seccion, Vacio } from '../components/ui'
import { useGastos } from '../lib/api'
import { fechaCorta, hoy, nombreMes, plata } from '../lib/format'
import { mesDe } from '../lib/stats'
import { CATEGORIAS, type Categoria } from '../lib/types'

const mover = (ym: string, n: number) => {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function Gastos() {
  const { data = [], isPending, error } = useGastos()
  const actual = mesDe(hoy())
  const [mes, setMes] = useState(actual)

  const delMes = useMemo(() => data.filter((g) => mesDe(g.fecha) === mes), [data, mes])
  const total = delMes.reduce((s, g) => s + g.monto, 0)
  const porCategoria = useMemo(() => {
    const m = new Map<Categoria, number>()
    for (const g of delMes) m.set(g.categoria, (m.get(g.categoria) ?? 0) + g.monto)
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [delMes])

  if (isPending) return <Cargando />

  return (
    <>
      <Encabezado
        titulo="Gastos"
        accion={
          <Link to="/cargar/gasto" className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 font-medium text-pasto-claro active:bg-hoja-2">
            <Plus className="size-5" /> Nuevo gasto
          </Link>
        }
      />
      <Error error={error} />

      <div className="flex items-center justify-between rounded-2xl border border-tallo bg-hoja p-2">
        <button onClick={() => setMes(mover(mes, -1))} className="grid size-11 place-items-center rounded-xl text-musgo active:bg-hoja-2" aria-label="Mes anterior">
          <ChevronLeft className="size-6" />
        </button>
        <div className="text-center">
          <p className="text-sm text-musgo">{nombreMes(mes)}</p>
          <p className="num font-display text-3xl font-bold">{plata(total)}</p>
        </div>
        <button
          onClick={() => setMes(mover(mes, 1))}
          disabled={mes >= actual}
          className="grid size-11 place-items-center rounded-xl text-musgo active:bg-hoja-2 disabled:opacity-30"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="size-6" />
        </button>
      </div>

      {porCategoria.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2.5">
          {porCategoria.map(([cat, monto]) => (
            <li key={cat}>
              <div className="flex justify-between text-[0.95rem]">
                <span>{CATEGORIAS[cat]}</span>
                <span className="num text-musgo">{plata(monto)}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-hoja-2">
                <div className="h-full rounded-full bg-pasto" style={{ width: `${(monto / total) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <Seccion titulo="Detalle">
        {delMes.length === 0 ? (
          <Vacio
            accion={
              mes === actual && (
                <Link to="/cargar/gasto" className="font-medium text-pasto-claro">
                  Cargar un gasto
                </Link>
              )
            }
          >
            No hay gastos cargados en {nombreMes(mes).toLowerCase()}.
          </Vacio>
        ) : (
          <Lista>
            {delMes.map((g) => (
              <li key={g.id}>
                <Link to={`/gastos/${g.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-hoja-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{g.descripcion || CATEGORIAS[g.categoria]}</p>
                    <p className="text-sm text-musgo">
                      {fechaCorta(g.fecha)}
                      {g.descripcion && `, ${CATEGORIAS[g.categoria].toLowerCase()}`}
                    </p>
                  </div>
                  <span className="num shrink-0 font-medium">{plata(g.monto)}</span>
                </Link>
              </li>
            ))}
          </Lista>
        )}
      </Seccion>
    </>
  )
}
