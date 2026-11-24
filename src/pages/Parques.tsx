import { Search, UserPlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Cargando, Encabezado, Error, Lista, Segmentado, Vacio, claseInput } from '../components/ui'
import { useDatos } from '../lib/api'
import { fechaCorta, plata } from '../lib/format'
import { useGuardado } from '../lib/guardado'
import { saldosPorCliente } from '../lib/stats'

type Orden = 'nombre' | 'viejo' | 'nuevo'

const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function Parques() {
  const { clientes, parques, trabajos, pagos, cargando, error } = useDatos()
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<'todos' | 'deben'>('todos')
  const [orden, setOrden] = useGuardado<Orden>('raygrass.orden-parques', 'nombre')

  const saldos = useMemo(() => saldosPorCliente(trabajos, pagos), [trabajos, pagos])
  // Último corte de pasto de cada cliente (los trabajos vienen del más nuevo al más viejo).
  const ultimoCorte = useMemo(() => {
    const m = new Map<string, string>()
    for (const t of trabajos) if (t.tipo === 'corte' && !m.has(t.cliente_id)) m.set(t.cliente_id, t.fecha)
    return m
  }, [trabajos])

  const lista = useMemo(() => {
    const q = normalizar(busqueda.trim())
    const xs = clientes
      .map((c) => ({
        c,
        lugares: parques.filter((p) => p.cliente_id === c.id),
        saldo: saldos.get(c.id)?.saldo ?? 0,
        ultimo: ultimoCorte.get(c.id) ?? null,
      }))
      .filter((x) => filtro === 'todos' || x.saldo > 0)
      .filter((x) => !q || normalizar(x.c.nombre + ' ' + x.lugares.map((p) => p.nombre + ' ' + (p.direccion ?? '')).join(' ')).includes(q))
    if (orden === 'nombre') return xs
    // los que nunca se cortaron van al final en los dos sentidos
    const signo = orden === 'viejo' ? 1 : -1
    return xs.sort((a, b) => {
      if (!a.ultimo || !b.ultimo) return a.ultimo ? -1 : b.ultimo ? 1 : 0
      return signo * a.ultimo.localeCompare(b.ultimo)
    })
  }, [clientes, parques, saldos, ultimoCorte, busqueda, filtro, orden])

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
      <div className="mt-3 flex flex-col gap-1.5">
        <p className="text-sm text-musgo">Ordenar por nombre o por último corte</p>
        <Segmentado<Orden>
          etiqueta="Ordenar por nombre o por último corte"
          valor={orden}
          onChange={setOrden}
          opciones={[
            { valor: 'nombre', texto: 'Nombre' },
            { valor: 'viejo', texto: 'Más viejo' },
            { valor: 'nuevo', texto: 'Más nuevo' },
          ]}
        />
      </div>
      <div className="mt-2 mb-4">
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
          {lista.map(({ c, lugares, saldo, ultimo }) => {
            const activos = lugares.filter((p) => p.activo)
            return (
              <li key={c.id}>
                <Link to={`/clientes/${c.id}`} className="flex items-center gap-3 px-4 py-3.5 active:bg-hoja-2">
                  <div className="min-w-0 flex-1">
                    <p className={`truncate font-medium ${activos.length ? '' : 'text-musgo'}`}>{c.nombre}</p>
                    <p className="truncate text-sm text-musgo">
                      {activos.length ? activos.map((p) => p.nombre).join(', ') : 'Sin lugares activos'}
                    </p>
                    {orden !== 'nombre' && (
                      <p className="text-sm text-musgo">{ultimo ? `Último corte ${fechaCorta(ultimo)}` : 'Sin cortes'}</p>
                    )}
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
