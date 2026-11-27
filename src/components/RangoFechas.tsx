import { hoy, isoLocal } from '../lib/format'
import { Campo, Entrada } from './ui'

const inicioMes = (desplazar = 0) => {
  const d = new Date()
  return isoLocal(new Date(d.getFullYear(), d.getMonth() + desplazar, 1))
}
const finMes = (desplazar = 0) => {
  const d = new Date()
  return isoLocal(new Date(d.getFullYear(), d.getMonth() + desplazar + 1, 0))
}

export const inicioDeEsteMes = () => inicioMes()

const ATAJOS = [
  { texto: 'Este mes', desde: () => inicioMes(), hasta: () => hoy() },
  { texto: 'Mes pasado', desde: () => inicioMes(-1), hasta: () => finMes(-1) },
  { texto: 'Este año', desde: () => `${new Date().getFullYear()}-01-01`, hasta: () => hoy() },
]

/** Atajos (este mes, mes pasado…) más los campos Desde / Hasta. */
export function RangoFechas({
  desde,
  hasta,
  onChange,
}: {
  desde: string
  hasta: string
  onChange: (desde: string, hasta: string) => void
}) {
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {ATAJOS.map((a) => {
          const activo = desde === a.desde() && hasta === a.hasta()
          return (
            <button
              key={a.texto}
              type="button"
              aria-pressed={activo}
              onClick={() => onChange(a.desde(), a.hasta())}
              className={`min-h-10 whitespace-nowrap rounded-full border px-2 ${activo ? 'border-pasto bg-pasto-osc/40 font-semibold' : 'border-tallo bg-hoja text-musgo'}`}
            >
              {a.texto}
            </button>
          )
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Campo etiqueta="Desde">
          {(i) => <Entrada id={i} type="date" required value={desde} max={hasta} onChange={(e) => e.target.value && onChange(e.target.value, hasta)} />}
        </Campo>
        <Campo etiqueta="Hasta">
          {(i) => <Entrada id={i} type="date" required value={hasta} min={desde} onChange={(e) => e.target.value && onChange(desde, e.target.value)} />}
        </Campo>
      </div>
    </>
  )
}
