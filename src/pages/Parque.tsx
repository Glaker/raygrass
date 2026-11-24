import { CalendarCheck, CalendarPlus, Pencil } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CorteForm } from '../components/CorteForm'
import { Crecimiento } from '../components/Crecimiento'
import { TrabajoHoja } from '../components/TrabajoHoja'
import { Boton, Cargando, Encabezado, Error, EstadoCobro, Hoja, Lista, Seccion, Vacio } from '../components/ui'
import { useDatos } from '../lib/api'
import { duracion, fechaCorta, haceDias, numero, plata } from '../lib/format'
import { usePlan } from '../lib/plan'
import { statsParque } from '../lib/stats'
import type { Trabajo } from '../lib/types'

export function ParquePagina() {
  const { id } = useParams()
  const { clientes, parques, trabajos, cargando, error } = useDatos()
  const [cortando, setCortando] = useState(false)
  const [abierto, setAbierto] = useState<Trabajo | null>(null)
  const [mostrar, setMostrar] = useState(20)
  const plan = usePlan(trabajos)

  const parque = parques.find((p) => p.id === id)
  const cliente = clientes.find((c) => c.id === parque?.cliente_id)
  const s = useMemo(() => (parque ? statsParque(parque, trabajos) : null), [parque, trabajos])
  const cortes = useMemo(() => trabajos.filter((t) => t.parque_id === id), [trabajos, id])

  if (cargando) return <Cargando />
  if (!parque || !s) return <Encabezado titulo="No se encontró el lugar" atras />

  const atraso = s.frecuencia != null && s.diasDesde != null ? s.diasDesde - s.frecuencia : null

  return (
    <>
      <Encabezado
        titulo={cliente?.nombre ?? parque.nombre}
        atras
        accion={
          <Link to={`/parques/${parque.id}/editar`} className="grid size-11 place-items-center rounded-full text-musgo active:bg-hoja-2" aria-label="Editar lugar">
            <Pencil className="size-5" />
          </Link>
        }
      />
      <Error error={error} />
      <p className="-mt-3 mb-4 flex items-baseline justify-between gap-3">
        <span className="truncate text-musgo">{parque.nombre}</span>
        <Link to={`/clientes/${parque.cliente_id}`} className="shrink-0 text-pasto-claro">
          Ver cliente
        </Link>
      </p>

      <div className="rounded-2xl border border-tallo bg-hoja p-4">
        <div className="flex items-center gap-4">
          {s.avance != null && <Crecimiento avance={s.avance} semilla={parque.id} />}
          <div className="min-w-0 flex-1">
            {s.ultimo ? (
              <>
                <p className="font-display text-xl font-semibold">Último corte {haceDias(s.ultimo)}</p>
                {atraso != null && (
                  <p className={atraso >= 0 ? 'text-paja' : 'text-musgo'}>
                    {atraso > 0 ? `Pasado ${atraso} días de lo habitual` : atraso === 0 ? 'Toca hoy' : `Toca en ${-atraso} días`}
                  </p>
                )}
              </>
            ) : (
              <p className="font-display text-xl font-semibold">Sin cortes todavía</p>
            )}
          </div>
        </div>
        {parque.activo ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {plan.ids.has(parque.id) ? (
              <Boton variante="secundario" onClick={() => plan.quitar([parque.id])} aria-label="Quitar del plan de corte">
                <CalendarCheck className="size-5 text-pasto-claro" /> En el plan
              </Boton>
            ) : (
              <Boton variante="secundario" onClick={() => plan.agregar([parque.id])}>
                <CalendarPlus className="size-5" /> Al plan
              </Boton>
            )}
            <Boton onClick={() => setCortando(true)}>Registrar corte</Boton>
          </div>
        ) : (
          <p className="mt-3 text-musgo">Este lugar está marcado como que ya no se corta.</p>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-tallo bg-tallo">
        <Dato etiqueta="Precio por corte" valor={plata(parque.precio)} />
        <Dato
          etiqueta="Se corta cada"
          valor={s.frecuencia ? `${s.frecuencia} días` : 'Falta historial'}
          nota={s.frecuenciaHistorica && s.frecuenciaHistorica !== s.frecuencia ? `${s.frecuenciaHistorica} en promedio` : undefined}
        />
        <Dato etiqueta="Cortes" valor={String(s.cortes)} />
        <Dato etiqueta="Generado" valor={plata(s.generado)} />
        <Dato etiqueta="Tamaño" valor={parque.tamano_m2 ? `${numero(parque.tamano_m2)} m²` : 'Sin cargar'} />
        <Dato etiqueta="Tiempo de corte" valor={duracion(parque.tiempo_min) ?? 'Sin cargar'} />
      </dl>
      {s.saldo > 0 && (
        <p className="mt-3 rounded-xl bg-paja/10 px-4 py-3 text-paja">
          Debe {plata(s.saldo)} de cortes en este lugar.
        </p>
      )}
      {(parque.direccion || parque.notas) && (
        <div className="mt-3 rounded-2xl border border-tallo bg-hoja px-4 py-3">
          {parque.direccion && <p>{parque.direccion}</p>}
          {parque.notas && <p className="mt-1 whitespace-pre-line text-musgo">{parque.notas}</p>}
        </div>
      )}

      <Seccion titulo="Cortes">
        {cortes.length === 0 ? (
          <Vacio>Cuando registres un corte va a aparecer acá.</Vacio>
        ) : (
          <>
            <Lista>
              {cortes.slice(0, mostrar).map((t, i) => {
                const anterior = cortes.slice(i + 1).find((x) => x.tipo === 'corte' && x.fecha !== t.fecha)
                const dias = anterior ? Math.round((Date.parse(t.fecha) - Date.parse(anterior.fecha)) / 86_400_000) : null
                return (
                  <li key={t.id}>
                    <button onClick={() => setAbierto(t)} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-hoja-2">
                      <div className="min-w-0 flex-1">
                        <p>{fechaCorta(t.fecha)}</p>
                        <p className="text-sm text-musgo">
                          {t.tipo === 'particular' ? (t.descripcion ?? 'Trabajo particular') : dias != null ? `${dias} días después del anterior` : 'Primer corte registrado'}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="num">{plata(t.importe)}</p>
                        <EstadoCobro importe={t.importe} saldo={t.saldo} />
                      </div>
                    </button>
                  </li>
                )
              })}
            </Lista>
            {cortes.length > mostrar && (
              <button onClick={() => setMostrar(mostrar + 50)} className="mt-2 min-h-11 w-full text-pasto-claro">
                Ver más
              </button>
            )}
          </>
        )}
      </Seccion>

      <Hoja abierta={cortando} onCerrar={() => setCortando(false)} titulo={`Corte en ${cliente?.nombre ?? parque.nombre}`}>
        <CorteForm parque={parque} onListo={() => setCortando(false)} />
      </Hoja>
      <TrabajoHoja trabajo={abierto} titulo={`${cliente?.nombre ?? ''}, ${parque.nombre.toLowerCase()}`} onCerrar={() => setAbierto(null)} />
    </>
  )
}

function Dato({ etiqueta, valor, nota }: { etiqueta: string; valor: string; nota?: string }) {
  return (
    <div className="bg-hoja px-4 py-3">
      <dt className="text-sm text-musgo">{etiqueta}</dt>
      <dd className="num font-display text-lg font-semibold">{valor}</dd>
      {nota && <dd className="text-sm text-musgo">{nota}</dd>}
    </div>
  )
}
