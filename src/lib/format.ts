const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
const miles = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 })

export const plata = (n: number) => pesos.format(Math.round(n)).replace(/ /g, ' ')
export const numero = (n: number) => miles.format(n)

/** Fecha local de hoy como 'YYYY-MM-DD'. */
export const hoy = () => isoLocal(new Date())
export const isoLocal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** 'YYYY-MM-DD' -> Date local (sin corrimiento por zona horaria). */
export const aFecha = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const diasEntre = (a: string, b: string) => Math.round((aFecha(b).getTime() - aFecha(a).getTime()) / 86_400_000)

const corta = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' })
const conDia = new Intl.DateTimeFormat('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
const conAnio = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
const mesLargo = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' })
const mesCorto = new Intl.DateTimeFormat('es-AR', { month: 'short' })

const limpiar = (s: string) => s.replace(/\./g, '')

export const fechaCorta = (s: string) => {
  const d = aFecha(s)
  return limpiar(d.getFullYear() === new Date().getFullYear() ? corta.format(d) : conAnio.format(d))
}
export const fechaConDia = (s: string) => limpiar(conDia.format(aFecha(s)))
export const nombreMes = (ym: string) => {
  const t = mesLargo.format(aFecha(ym + '-01'))
  return t.charAt(0).toUpperCase() + t.slice(1)
}
export const mesAbrev = (ym: string) => limpiar(mesCorto.format(aFecha(ym + '-01')))

export const haceDias = (s: string) => {
  const n = diasEntre(s, hoy())
  if (n <= 0) return 'hoy'
  if (n === 1) return 'ayer'
  return `hace ${n} días`
}

export const duracion = (min: number | null) => {
  if (!min) return null
  const h = Math.floor(min / 60)
  const m = min % 60
  if (!h) return `${m} min`
  return m ? `${h} h ${m} min` : `${h} h`
}

/** Convierte lo que escribe el usuario ('270.000', '270000') en número. */
export const leerPlata = (s: string) => Number(s.replace(/\D/g, '')) || 0
