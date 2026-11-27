import { FileDown, Share2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { inicioDeEsteMes, RangoFechas } from '../components/RangoFechas'
import { Boton, Cargando, Encabezado, Error, EstadoCobro, Lista, Seccion, Vacio } from '../components/ui'
import { useDatos } from '../lib/api'
import { fechaCorta, hoy, plata } from '../lib/format'
import { entregarPdf, generarInforme, puedeCompartirArchivos, type FilaInforme } from '../lib/informe'
import type { Parque, Trabajo } from '../lib/types'

const textoTrabajo = (t: Trabajo, parque?: Parque) =>
  t.descripcion?.trim() || (t.tipo === 'corte' ? `Corte en ${parque?.nombre ?? 'el lugar'}` : 'Trabajo particular')

export function Informe() {
  const { id } = useParams()
  const { clientes, parques, trabajos, cargando, error } = useDatos()
  const [desde, setDesde] = useState(inicioDeEsteMes)
  const [hasta, setHasta] = useState(hoy)
  const [lugar, setLugar] = useState<string | null>(null)
  const [generando, setGenerando] = useState(false)
  const [falla, setFalla] = useState<unknown>(null)
  const compartible = useMemo(puedeCompartirArchivos, [])

  const cliente = clientes.find((c) => c.id === id)
  const lugares = useMemo(() => parques.filter((p) => p.cliente_id === id), [parques, id])
  const parqueDe = useMemo(() => new Map(parques.map((p) => [p.id, p])), [parques])

  const elegidos = useMemo(
    () =>
      trabajos
        .filter((t) => t.cliente_id === id && t.fecha >= desde && t.fecha <= hasta && (!lugar || t.parque_id === lugar))
        .sort((a, b) => (a.fecha === b.fecha ? a.created_at.localeCompare(b.created_at) : a.fecha.localeCompare(b.fecha))),
    [trabajos, id, desde, hasta, lugar],
  )

  if (cargando) return <Cargando />
  if (!cliente) return <Encabezado titulo="No se encontró el cliente" atras />

  const total = elegidos.reduce((s, t) => s + t.importe, 0)
  const debe = elegidos.reduce((s, t) => s + Math.max(0, t.saldo), 0)
  const rangoMal = desde > hasta

  const generar = async (compartir: boolean) => {
    setGenerando(true)
    setFalla(null)
    try {
      const usados = lugar ? lugares.filter((p) => p.id === lugar) : lugares
      const detalle = usados.map((p) => p.direccion?.trim()).filter(Boolean).join(' / ') || null
      const filas: FilaInforme[] = elegidos.map((t) => ({
        fecha: t.fecha,
        trabajo: textoTrabajo(t, parqueDe.get(t.parque_id ?? '')),
        importe: t.importe,
        saldo: t.saldo,
      }))
      const blob = await generarInforme({ cliente: cliente.nombre, detalle, desde, hasta, filas })
      await entregarPdf(blob, `Informe ${cliente.nombre} ${desde} a ${hasta}.pdf`, compartir)
    } catch (e) {
      setFalla(e)
    } finally {
      setGenerando(false)
    }
  }

  return (
    <>
      <Encabezado titulo={`Informe de ${cliente.nombre}`} atras />
      <Error error={error} />

      <RangoFechas
        desde={desde}
        hasta={hasta}
        onChange={(d, h) => {
          setDesde(d)
          setHasta(h)
        }}
      />

      {lugares.length > 1 && (
        <fieldset className="mt-4">
          <legend className="mb-1.5 text-sm font-medium text-musgo">Lugar</legend>
          <div className="flex flex-wrap gap-2">
            {[{ id: null, nombre: 'Todos' }, ...lugares].map((p) => (
              <button
                key={p.id ?? 'todos'}
                type="button"
                aria-pressed={lugar === p.id}
                onClick={() => setLugar(p.id)}
                className={`min-h-10 rounded-full border px-4 ${lugar === p.id ? 'border-pasto bg-pasto-osc/40 font-semibold' : 'border-tallo bg-hoja text-musgo'}`}
              >
                {p.nombre}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="mt-5 rounded-2xl border border-tallo bg-hoja p-4">
        <p className="text-musgo">
          {elegidos.length === 1 ? '1 trabajo' : `${elegidos.length} trabajos`} en el período
        </p>
        <p className="num font-display text-4xl font-bold">{plata(total)}</p>
        {debe > 0 && <p className="num mt-1 text-sm text-paja">De eso falta cobrar {plata(debe)}</p>}
        <div className={`mt-4 grid gap-2 ${compartible ? 'grid-cols-2' : ''}`}>
          {compartible && (
            <Boton onClick={() => generar(true)} cargando={generando} disabled={rangoMal}>
              <Share2 className="size-5" /> Compartir PDF
            </Boton>
          )}
          <Boton variante={compartible ? 'secundario' : 'primario'} onClick={() => generar(false)} cargando={generando} disabled={rangoMal}>
            <FileDown className="size-5" /> Descargar PDF
          </Boton>
        </div>
        <div className="mt-2">
          <Error error={falla} />
        </div>
      </div>

      <Seccion titulo="Lo que va en el informe">
        {elegidos.length === 0 ? (
          <Vacio>No hay trabajos entre esas fechas.</Vacio>
        ) : (
          <Lista>
            {elegidos.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate">{textoTrabajo(t, parqueDe.get(t.parque_id ?? ''))}</p>
                  <p className="text-sm text-musgo">{fechaCorta(t.fecha)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="num">{plata(t.importe)}</p>
                  <EstadoCobro importe={t.importe} saldo={t.saldo} />
                </div>
              </li>
            ))}
          </Lista>
        )}
      </Seccion>
    </>
  )
}
