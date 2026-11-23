import { Search, UserPlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Cargando, Encabezado, Error, Lista, Segmentado, Vacio, claseInput } from '../components/ui'
import { useDatos } from '../lib/api'
import { plata } from '../lib/format'
import { saldosPorCliente } from '../lib/stats'

const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function Parques() {
  const { clientes, parques, trabajos, pagos, cargando, error } = useDatos()
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<'todos' | 'deben'>('todos')

  const saldos = useMemo(() => saldosPorCliente(trabajos, pagos), [trabajos, pagos])
  const lista = useMemo(() => {
    const q = normalizar(busqueda.trim())
    return clientes
      .map((c) => ({ c, lugares: parques.filter((p) => p.cliente_id === c.id), saldo: saldos.get(c.id)?.saldo ?? 0 }))
      .filter((x) => filtro === 'todos' || x.saldo > 0)
      .filter((x) => !q || normalizar(x.c.nombre + ' ' + x.lugares.map((p) => p.nombre + ' ' + (p.direccion ?? '')).join(' ')).includes(q))
  }, [clientes, parques, saldos, busqueda, filtro])

  if (cargando) return <Cargando />

  return (
    <>
      <Encabezado
        titulo="Parques"
        accion={
          <Link to="/clientes/nuevo" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 font-medium text-pasto-claro active:bg-hoja-2">
            <UserPlus className="size-5" /> Nuevo cliente
          </Link>
        }
      />
      <Error error={error} />
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-musgo" />
        <input
          type="search"
          placeholder="Buscar cliente o lugar"
          aria-label="Buscar cliente o lugar"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className={`${claseInput} pl-11`}
        />
      </div>
      <div className="mt-3 mb-4">
        <Segmentado
          etiqueta="Filtrar"
          valor={filtro}
          onChange={setFiltro}
          opciones={[
            { valor: 'todos', texto: `Todos (${clientes.length})` },
            { valor: 'deben', texto: 'Con deuda' },
          ]}
        />
      </div>

      {lista.length === 0 ? (
        <Vacio
          accion={
            clientes.length === 0 && (
              <Link to="/clientes/nuevo" className="font-medium text-pasto-claro">
                Cargar el primer cliente
              </Link>
            )
          }
        >
          {clientes.length === 0 ? 'Todavía no hay clientes.' : 'No hay clientes que coincidan.'}
        </Vacio>
      ) : (
        <Lista>
          {lista.map(({ c, lugares, saldo }) => {
            const activos = lugares.filter((p) => p.activo)
            return (
              <li key={c.id}>
                <Link to={`/clientes/${c.id}`} className="flex items-center gap-3 px-4 py-3.5 active:bg-hoja-2">
                  <div className="min-w-0 flex-1">
                    <p className={`truncate font-medium ${activos.length ? '' : 'text-musgo'}`}>{c.nombre}</p>
                    <p className="truncate text-sm text-musgo">
                      {activos.length ? activos.map((p) => p.nombre).join(', ') : 'Sin lugares activos'}
                    </p>
                  </div>
                  {saldo > 0 && <span className="num shrink-0 text-[0.95rem] font-medium text-paja">{plata(saldo)}</span>}
                </Link>
              </li>
            )
          })}
        </Lista>
      )}
    </>
  )
}
