import { FileDown, Share2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { inicioDeEsteMes, RangoFechas } from '../components/RangoFechas'
import { TrabajoHoja } from '../components/TrabajoHoja'
import { Boton, Cargando, Encabezado, Error, EstadoCobro, Lista, Seccion, Segmentado, Vacio } from '../components/ui'
import { useDatos } from '../lib/api'
import { fechaCorta, hoy, plata } from '../lib/format'
import { entregarPdf, generarInformeCortes, puedeCompartirArchivos, type FilaCorte } from '../lib/informe'
import type { Parque, Trabajo } from '../lib/types'

type Estado = 'todos' | 'debe' | 'cobrado'
type Tipo = 'corte' | 'todos'

const lugarDe = (t: Trabajo, parque?: Parque) =>
  t.tipo === 'corte' ? (parque?.nombre ?? t.descripcion?.trim() ?? 'Corte') : t.descripcion?.trim() || 'Trabajo particular'

export function InformeCortes() {
  const { clientes, parques, trabajos, cargando, error } = useDatos()
  const [desde, setDesde] = useState(inicioDeEsteMes)
  const [hasta, setHasta] = useState(hoy)
  const [estado, setEstado] = useState<Estado>('todos')
  const [tipo, setTipo] = useState<Tipo>('corte')
  const [abierto, setAbierto] = useState<Trabajo | null>(null)
  const [generando, setGenerando] = useState(false)
  const [falla, setFalla] = useState<unknown>(null)
  const compartible = useMemo(puedeCompartirArchivos, [])

  const nombreCliente = useMemo(() => new Map(clientes.map((c) => [c.id, c.nombre])), [clientes])
  const parqueDe = useMemo(() => new Map(parques.map((p) => [p.id, p])), [parques])

  const enRango = useMemo(
    () =>
      trabajos
        .filter((t) => t.fecha >= desde && t.fecha <= hasta && (tipo === 'todos' || t.tipo === 'corte'))
        .sort((a, b) => (a.fecha === b.fecha ? b.created_at.localeCompare(a.created_at) : b.fecha.localeCompare(a.fecha))),
    [trabajos, desde, hasta, tipo],
  )
  const elegidos = useMemo(
    () => enRango.filter((t) => estado === 'todos' || (estado === 'debe' ? t.saldo > 0 : t.saldo <= 0)),
    [enRango, estado],
  )

  if (cargando) return <Cargando />

  const total = elegidos.reduce((s, t) => s + t.importe, 0)
  const falta = elegidos.reduce((s, t) => s + Math.max(0, t.saldo), 0)
  const sinCobrar = elegidos.filter((t) => t.saldo > 0).length
  const rangoMal = desde > hasta
  const nombreTipo = tipo === 'corte' ? 'cortes' : 'trabajos'

  const generar = async (compartir: boolean) => {
    setGenerando(true)
    setFalla(null)
    try {
      const filas: FilaCorte[] = elegidos.map((t) => ({
        fecha: t.fecha,
        cliente: nombreCliente.get(t.cliente_id) ?? 'Cliente',
        lugar: lugarDe(t, parqueDe.get(t.parque_id ?? '')),
        importe: t.importe,
        saldo: t.saldo,
      }))
      const detalle = estado === 'debe' ? 'Solo sin cobrar' : estado === 'cobrado' ? 'Solo cobrados' : null
      const titulo = tipo === 'corte' ? 'Cortes realizados' : 'Trabajos realizados'
      const blob = await generarInformeCortes({ titulo, detalle, desde, hasta, filas })
      await entregarPdf(blob, `${titulo} ${desde} a ${hasta}.pdf`, compartir)
    } catch (e) {
      setFalla(e)
    } finally {
      setGenerando(false)
    }
  }

  return (
    <>
      <Encabezado titulo="Cortes y cobros" atras />
      <Error error={error} />

      <RangoFechas
        desde={desde}
        hasta={hasta}
        onChange={(d, h) => {
          setDesde(d)
          setHasta(h)
        }}
      />

      <div className="mt-4 space-y-2">
        <Segmentado
          etiqueta="Cobro"
          valor={estado}
          onChange={setEstado}
          opciones={[
            { valor: 'todos', texto: 'Todos' },
            { valor: 'debe', texto: 'Sin cobrar' },
            { valor: 'cobrado', texto: 'Cobrados' },
          ]}
        />
        <Segmentado
          etiqueta="Qué trabajos"
          valor={tipo}
          onChange={setTipo}
          opciones={[
            { valor: 'corte', texto: 'Solo cortes' },
            { valor: 'todos', texto: 'Con particulares' },
          ]}
        />
      </div>

      <div className="mt-5 rounded-2xl border border-tallo bg-hoja p-4">
        <p className="text-musgo">
          {elegidos.length === 1 ? `1 ${nombreTipo.slice(0, -1)}` : `${elegidos.length} ${nombreTipo}`} en el período
        </p>
        <p className="num font-display text-4xl font-bold">{plata(total)}</p>
        {falta > 0 ? (
          <p className="num mt-1 text-sm text-paja">
            Falta cobrar {plata(falta)} ({sinCobrar === 1 ? '1 sin cobrar' : `${sinCobrar} sin cobrar`})
          </p>
        ) : (
          elegidos.length > 0 && <p className="mt-1 text-sm text-pasto-claro">Todo cobrado</p>
        )}
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
          <Vacio>No hay {nombreTipo} con ese filtro entre esas fechas.</Vacio>
        ) : (
          <Lista>
            {elegidos.map((t) => (
              <li key={t.id}>
                <button type="button" onClick={() => setAbierto(t)} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-hoja-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{nombreCliente.get(t.cliente_id)}</p>
                    <p className="truncate text-sm text-musgo">
                      {lugarDe(t, parqueDe.get(t.parque_id ?? ''))}, {fechaCorta(t.fecha)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="num">{plata(t.importe)}</p>
                    <EstadoCobro importe={t.importe} saldo={t.saldo} />
                  </div>
                </button>
              </li>
            ))}
          </Lista>
        )}
      </Seccion>

      <TrabajoHoja
        trabajo={abierto}
        titulo={abierto ? `${nombreCliente.get(abierto.cliente_id) ?? ''}, ${lugarDe(abierto, parqueDe.get(abierto.parque_id ?? '')).toLowerCase()}` : ''}
        onCerrar={() => setAbierto(null)}
      />
    </>
  )
}
