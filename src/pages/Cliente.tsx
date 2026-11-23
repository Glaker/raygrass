import { Pencil, Phone, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PagoHoja, TrabajoHoja } from '../components/TrabajoHoja'
import { BotonLink, Cargando, Encabezado, Error, EstadoCobro, Lista, Seccion, Vacio } from '../components/ui'
import { useDatos } from '../lib/api'
import { fechaCorta, haceDias, plata } from '../lib/format'
import { statsParque } from '../lib/stats'
import { TIPOS_PARQUE, type Pago, type Trabajo } from '../lib/types'

export function ClientePagina() {
  const { id } = useParams()
  const { clientes, parques, trabajos, pagos, cargando, error } = useDatos()
  const [trabajoAbierto, setTrabajoAbierto] = useState<Trabajo | null>(null)
  const [pagoAbierto, setPagoAbierto] = useState<Pago | null>(null)
  const [mostrar, setMostrar] = useState(25)

  const cliente = clientes.find((c) => c.id === id)
  const lugares = useMemo(() => parques.filter((p) => p.cliente_id === id), [parques, id])
  const suyos = useMemo(() => trabajos.filter((t) => t.cliente_id === id), [trabajos, id])
  const susPagos = useMemo(() => pagos.filter((p) => p.cliente_id === id), [pagos, id])
  const parqueDe = useMemo(() => new Map(parques.map((p) => [p.id, p])), [parques])

  // Pagos ligados a un trabajo se muestran dentro del trabajo; los "a cuenta" van sueltos en el historial.
  const historial = useMemo(
    () =>
      [
        ...suyos.map((t) => ({ tipo: 'trabajo' as const, fecha: t.fecha, orden: t.created_at, t })),
        ...susPagos.filter((p) => !p.trabajo_id).map((p) => ({ tipo: 'pago' as const, fecha: p.fecha, orden: p.created_at, p })),
      ].sort((a, b) => (a.fecha === b.fecha ? b.orden.localeCompare(a.orden) : b.fecha.localeCompare(a.fecha))),
    [suyos, susPagos],
  )

  if (cargando) return <Cargando />
  if (!cliente) return <Encabezado titulo="No se encontró el cliente" atras />

  const facturado = suyos.reduce((s, t) => s + t.importe, 0)
  const pagado = susPagos.reduce((s, p) => s + p.monto, 0)
  const saldo = facturado - pagado

  return (
    <>
      <Encabezado
        titulo={cliente.nombre}
        atras
        accion={
          <Link to={`/clientes/${cliente.id}/editar`} className="grid size-11 place-items-center rounded-full text-musgo active:bg-hoja-2" aria-label="Editar cliente">
            <Pencil className="size-5" />
          </Link>
        }
      />
      <Error error={error} />

      <div className="rounded-2xl border border-tallo bg-hoja p-4">
        {saldo > 0 ? (
          <>
            <p className="text-musgo">Te debe</p>
            <p className="num font-display text-4xl font-bold text-paja">{plata(saldo)}</p>
          </>
        ) : (
          <>
            <p className="text-musgo">{saldo < 0 ? 'Tiene a favor' : 'Está al día'}</p>
            <p className="num font-display text-4xl font-bold">{plata(Math.abs(saldo))}</p>
          </>
        )}
        <p className="mt-1 text-sm text-musgo">
          {plata(facturado)} trabajado en total, {suyos.length} trabajos
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <BotonLink to={`/cargar/pago?cliente=${cliente.id}`} variante={saldo > 0 ? 'primario' : 'secundario'}>
            Registrar pago
          </BotonLink>
          <BotonLink to={`/cargar/particular?cliente=${cliente.id}`} variante="secundario">
            Trabajo particular
          </BotonLink>
        </div>
        {cliente.telefono && (
          <a href={`tel:${cliente.telefono}`} className="mt-3 flex min-h-11 items-center gap-2 text-pasto-claro">
            <Phone className="size-5" /> {cliente.telefono}
          </a>
        )}
        {cliente.notas && <p className="mt-2 whitespace-pre-line text-musgo">{cliente.notas}</p>}
      </div>

      <Seccion
        titulo={lugares.length === 1 ? 'Lugar' : 'Lugares'}
        accion={
          <Link to={`/parques/nuevo?cliente=${cliente.id}`} className="inline-flex min-h-11 items-center gap-1 text-pasto-claro">
            <Plus className="size-5" /> Agregar lugar
          </Link>
        }
      >
        {lugares.length === 0 ? (
          <Vacio>Agregá el lugar donde cortás, con su precio, para poder registrar cortes.</Vacio>
        ) : (
          <Lista>
            {lugares.map((p) => {
              const s = statsParque(p, trabajos)
              return (
                <li key={p.id}>
                  <Link to={`/parques/${p.id}`} className="flex items-center gap-3 px-4 py-3.5 active:bg-hoja-2">
                    <div className="min-w-0 flex-1">
                      <p className={`truncate font-medium ${p.activo ? '' : 'text-musgo'}`}>
                        {p.nombre}
                        {!p.activo && ' (no se corta más)'}
                      </p>
                      <p className="truncate text-sm text-musgo">
                        {TIPOS_PARQUE[p.tipo]}
                        {s.ultimo && `, último corte ${haceDias(s.ultimo)}`}
                        {s.frecuencia && `, cada ${s.frecuencia} días`}
                      </p>
                    </div>
                    <span className="num shrink-0 font-medium">{plata(p.precio)}</span>
                  </Link>
                </li>
              )
            })}
          </Lista>
        )}
      </Seccion>

      <Seccion titulo="Historial">
        {historial.length === 0 ? (
          <Vacio>Sin trabajos ni pagos todavía.</Vacio>
        ) : (
          <>
            <Lista>
              {historial.slice(0, mostrar).map((h) =>
                h.tipo === 'trabajo' ? (
                  <li key={h.t.id}>
                    <button onClick={() => setTrabajoAbierto(h.t)} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-hoja-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate">
                          {h.t.tipo === 'corte' ? `Corte en ${parqueDe.get(h.t.parque_id!)?.nombre ?? 'lugar'}` : (h.t.descripcion || 'Trabajo particular')}
                        </p>
                        <p className="text-sm text-musgo">
                          {fechaCorta(h.t.fecha)}
                          {h.t.tipo === 'particular' && ', particular'}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="num">{plata(h.t.importe)}</p>
                        <EstadoCobro importe={h.t.importe} saldo={h.t.saldo} />
                      </div>
                    </button>
                  </li>
                ) : (
                  <li key={h.p.id}>
                    <button onClick={() => setPagoAbierto(h.p)} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-hoja-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-pasto-claro">Pago a cuenta</p>
                        <p className="text-sm text-musgo">{fechaCorta(h.p.fecha)}</p>
                      </div>
                      <p className="num shrink-0 font-medium text-pasto-claro">+{plata(h.p.monto)}</p>
                    </button>
                  </li>
                ),
              )}
            </Lista>
            {historial.length > mostrar && (
              <button onClick={() => setMostrar(mostrar + 50)} className="mt-2 min-h-11 w-full text-pasto-claro">
                Ver más
              </button>
            )}
          </>
        )}
      </Seccion>

      <TrabajoHoja trabajo={trabajoAbierto} titulo={cliente.nombre} onCerrar={() => setTrabajoAbierto(null)} />
      <PagoHoja pago={pagoAbierto} onCerrar={() => setPagoAbierto(null)} />
    </>
  )
}
