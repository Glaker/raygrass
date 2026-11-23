/**
 * El pasto creciendo: la altura de las hojas es cuánto pasó desde el último corte
 * respecto de la frecuencia habitual. Pasada la fecha, se pone color paja.
 */
export function Crecimiento({ avance, semilla }: { avance: number; semilla: string }) {
  const tope = 1.5
  const a = Math.min(Math.max(avance, 0.08), tope)
  const color = avance >= 1 ? 'var(--color-paja)' : avance >= 0.8 ? 'var(--color-pasto)' : 'var(--color-pasto-osc)'
  // pequeñas variaciones por parque para que no sean todas iguales
  let h = 0
  for (const c of semilla) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const alturas = [0.82, 1, 0.9, 0.97, 0.78].map((k, i) => k - ((h >> (i * 3)) & 7) * 0.015)
  const H = 34
  const base = H - 2
  return (
    <svg viewBox="0 0 40 34" className="h-9 w-11 shrink-0" aria-hidden="true">
      <line x1="2" y1={base + 0.5} x2="38" y2={base + 0.5} stroke="var(--color-tallo)" strokeWidth="2" strokeLinecap="round" />
      {alturas.map((k, i) => {
        const x = 6 + i * 7
        const alto = (base - 2) * (a / tope) * k
        const punta = base - alto
        const inclina = (i - 2) * 1.2
        return (
          <path
            key={i}
            d={`M${x - 2} ${base} Q${x - 1} ${base - alto * 0.5} ${x + inclina} ${punta} Q${x + 1} ${base - alto * 0.5} ${x + 2} ${base} Z`}
            fill={color}
          />
        )
      })}
    </svg>
  )
}
