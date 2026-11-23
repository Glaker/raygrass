import { ChevronLeft, LoaderCircle, X } from 'lucide-react'
import { useEffect, useId, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { mensajeError } from '../lib/api'
import { numero, plata } from '../lib/format'

export function Encabezado({ titulo, atras, accion }: { titulo: ReactNode; atras?: boolean; accion?: ReactNode }) {
  const nav = useNavigate()
  return (
    <header className="sticky top-0 z-20 -mx-4 mb-4 flex min-h-14 items-center gap-2 bg-suelo/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur">
      {atras && (
        <button
          onClick={() => (window.history.length > 1 ? nav(-1) : nav('/'))}
          className="-ml-2 grid size-11 place-items-center rounded-full text-musgo active:bg-hoja-2"
          aria-label="Volver"
        >
          <ChevronLeft className="size-6" />
        </button>
      )}
      <h1 className="min-w-0 flex-1 truncate font-display text-2xl font-semibold tracking-tight">{titulo}</h1>
      {accion}
    </header>
  )
}

type Variante = 'primario' | 'secundario' | 'fantasma' | 'peligro'
const VARIANTES: Record<Variante, string> = {
  primario: 'bg-pasto text-suelo font-semibold active:bg-pasto-claro',
  secundario: 'bg-hoja-2 text-rocio border border-tallo active:bg-tallo',
  fantasma: 'text-pasto-claro active:bg-hoja-2',
  peligro: 'bg-alerta/15 text-alerta border border-alerta/40 active:bg-alerta/25',
}

export function Boton({
  variante = 'primario',
  cargando,
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; cargando?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || cargando}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-base transition-colors disabled:opacity-50 ${VARIANTES[variante]} ${className}`}
    >
      {cargando && <LoaderCircle className="size-5 animate-spin" />}
      {children}
    </button>
  )
}

export function BotonLink({ to, variante = 'primario', className = '', children }: { to: string; variante?: Variante; className?: string; children: ReactNode }) {
  return (
    <Link to={to} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-base transition-colors ${VARIANTES[variante]} ${className}`}>
      {children}
    </Link>
  )
}

export function Campo({
  etiqueta,
  ayuda,
  children,
}: {
  etiqueta: string
  ayuda?: string
  children: (id: string) => ReactNode
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-musgo">
        {etiqueta}
      </label>
      {children(id)}
      {ayuda && <p className="text-sm text-musgo/80">{ayuda}</p>}
    </div>
  )
}

export const claseInput =
  'min-h-12 w-full rounded-xl border border-tallo bg-hoja px-4 text-rocio placeholder:text-musgo/60 focus:border-pasto focus:outline-none'

export function Entrada(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${claseInput} ${props.className ?? ''}`} />
}

/** Campo de plata: muestra los miles con punto mientras se escribe. */
export function EntradaPlata({
  valor,
  onChange,
  id,
  autoFocus,
}: {
  valor: number
  onChange: (n: number) => void
  id?: string
  autoFocus?: boolean
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-musgo">$</span>
      <input
        id={id}
        autoFocus={autoFocus}
        inputMode="numeric"
        autoComplete="off"
        value={valor ? numero(valor) : ''}
        placeholder="0"
        onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, '')) || 0)}
        className={`${claseInput} num pl-8 font-display text-xl font-semibold`}
      />
    </div>
  )
}

export function Segmentado<T extends string>({
  opciones,
  valor,
  onChange,
  etiqueta,
}: {
  opciones: { valor: T; texto: string }[]
  valor: T
  onChange: (v: T) => void
  etiqueta: string
}) {
  return (
    <div role="radiogroup" aria-label={etiqueta} className="flex gap-1 rounded-xl border border-tallo bg-hoja p-1">
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          role="radio"
          aria-checked={valor === o.valor}
          onClick={() => onChange(o.valor)}
          className={`min-h-10 flex-1 rounded-lg px-2 text-[0.95rem] transition-colors ${
            valor === o.valor ? 'bg-pasto-osc font-semibold text-rocio' : 'text-musgo'
          }`}
        >
          {o.texto}
        </button>
      ))}
    </div>
  )
}

/** Panel que sube desde abajo. */
export function Hoja({ abierta, onCerrar, titulo, children }: { abierta: boolean; onCerrar: () => void; titulo: string; children: ReactNode }) {
  useEffect(() => {
    if (!abierta) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', esc)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', esc)
      document.body.style.overflow = ''
    }
  }, [abierta, onCerrar])
  if (!abierta) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={titulo}>
      <button className="absolute inset-0 bg-black/60" onClick={onCerrar} aria-label="Cerrar" tabIndex={-1} />
      <div className="sheet-enter relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border-t border-tallo bg-hoja px-5 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-tallo" />
        <div className="mb-4 flex items-center gap-2">
          <h2 className="flex-1 font-display text-xl font-semibold">{titulo}</h2>
          <button onClick={onCerrar} className="grid size-10 place-items-center rounded-full text-musgo active:bg-hoja-2" aria-label="Cerrar">
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/** Botón de borrar que pide un segundo toque para confirmar. */
export function BotonBorrar({ onConfirmar, cargando, texto = 'Borrar' }: { onConfirmar: () => void; cargando?: boolean; texto?: string }) {
  const [seguro, setSeguro] = useState(false)
  useEffect(() => {
    if (!seguro) return
    const t = setTimeout(() => setSeguro(false), 4000)
    return () => clearTimeout(t)
  }, [seguro])
  return (
    <Boton variante="peligro" cargando={cargando} onClick={() => (seguro ? onConfirmar() : setSeguro(true))}>
      {seguro ? 'Tocá de nuevo para borrar' : texto}
    </Boton>
  )
}

export function Seccion({ titulo, accion, children }: { titulo: string; accion?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-7">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">{titulo}</h2>
        {accion}
      </div>
      {children}
    </section>
  )
}

export const Lista = ({ children }: { children: ReactNode }) => (
  <ul className="divide-y divide-tallo/70 overflow-hidden rounded-2xl border border-tallo bg-hoja">{children}</ul>
)

export function Vacio({ children, accion }: { children: ReactNode; accion?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-tallo px-5 py-6 text-musgo">
      <p>{children}</p>
      {accion && <div className="mt-4">{accion}</div>}
    </div>
  )
}

export function Cargando() {
  return (
    <div className="grid place-items-center py-20 text-musgo" role="status">
      <LoaderCircle className="size-7 animate-spin" />
      <span className="sr-only">Cargando</span>
    </div>
  )
}

export function Error({ error }: { error: unknown }) {
  if (!error) return null
  return <p className="rounded-xl border border-alerta/40 bg-alerta/10 px-4 py-3 text-alerta">{mensajeError(error)}</p>
}

/** Estado de cobro de un trabajo. */
export function EstadoCobro({ importe, saldo }: { importe: number; saldo: number }) {
  if (saldo <= 0) return <span className="text-sm text-musgo">Cobrado</span>
  if (saldo < importe) return <span className="num text-sm font-medium text-paja">Debe {plata(saldo)}</span>
  return <span className="text-sm font-medium text-paja">Sin cobrar</span>
}
