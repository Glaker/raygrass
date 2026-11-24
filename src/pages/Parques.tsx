import { CalendarCheck, CalendarPlus, Search, UserPlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ElegirPlan } from '../components/ElegirPlan'
import { Cargando, Encabezado, Error, Hoja, Lista, Segmentado, Vacio, claseInput } from '../components/ui'
import { useDatos } from '../lib/api'
import { fechaCorta, plata } from '../lib/format'
import { useGuardado } from '../lib/guardado'
import { usePlan } from '../lib/plan'
import { saldosPorCliente, statsParque } from '../lib/stats'
import type { Cliente } from '../lib/types'

type Orden = 'nombre' | 'viejo' | 'nuevo'
type Filtro = 'activos' | 'inactivos' | 'deben' | 'todos'

const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function Parques() {
  const { clientes, parques, trabajos, pagos, cargando, error } = useDatos()
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useGuardado<Filtro>('raygrass.filtro-parques', 'activos')
  const [eligiendo, setEligiendo] = useState<Cliente | null>(null)
  const plan = usePlan(trabajos)
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
      .filter((x) => {
        const activo = x.lugares.some((p) => p.activo)
        if (filtro === 'activos') return activo
        if (filtro === 'inactivos') return !activo
        if (filtro === 'deben') return x.saldo > 0
        return true
      })
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

  const BotonPlan = ({ cliente, activos }: { cliente: Cliente; activos: string[] }) => {
    const enPlan = activos.filter((id) => plan.ids.has(id)).length
    const todos = enPlan === activos.length
    const Icono = enPlan ? CalendarCheck : CalendarPlus
    return (
      <button
        onClick={() => {
          if (activos.length > 1) setEligiendo(cliente)
          else if (todos) plan.quitar(activos)
          else plan.agregar(activos)
        }}
        aria-label={todos ? `Quitar a ${cliente.nombre} del plan de corte` : `Agregar a ${cliente.nombre} al plan de corte`}
        aria-pressed={activos.length === 1 ? todos : undefined}
        className={`mr-2 grid size-11 shrink-0 place-items-center rounded-xl active:bg-hoja-2 ${enPlan ? 'text-pasto-claro' : 'text-musgo'}`}
      >
        <Icono className="size-5" />
      </button>
    )
  }

  const opcionesCliente = eligiendo
    ? parques
        .filter((p) => p.cliente_id === eligiendo.id && p.activo)
        .map((p) => ({ p, s: statsParque(p, trabajos), cliente: eligiendo.nombre }))
    : []

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
            { valor: 'activos', texto: 'Activos' },
            { valor: 'inactivos', texto: 'Inactivos' },
            { valor: 'deben', texto: 'Deben' },
            { valor: 'todos', texto: 'Todos' },
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
              <li key={c.id} className="flex items-center">
                <Link to={`/clientes/${c.id}`} className="flex min-w-0 flex-1 items-center gap-3 py-3.5 pr-2 pl-4 active:bg-hoja-2">
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
                {activos.length > 0 && <BotonPlan cliente={c} activos={activos.map((p) => p.id)} />}
              </li>
            )
          })}
        </Lista>
      )}

      <Hoja abierta={!!eligiendo} onCerrar={() => setEligiendo(null)} titulo={eligiendo ? `Plan de corte: ${eligiendo.nombre}` : ''}>
        {eligiendo && (
          <ElegirPlan
            opciones={opcionesCliente}
            elegidos={opcionesCliente.filter((o) => plan.ids.has(o.p.id)).map((o) => o.p.id)}
            onListo={(ids) => {
              const deEste = new Set(opcionesCliente.map((o) => o.p.id))
              plan.fijar([...[...plan.ids].filter((id) => !deEste.has(id)), ...ids])
              setEligiendo(null)
            }}
          />
        )}
      </Hoja>
    </>
  )
}
