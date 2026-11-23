import { Banknote, Fuel, Hammer, Scissors, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Encabezado } from '../components/ui'

const OPCIONES: { to: string; icono: LucideIcon; titulo: string; texto: string }[] = [
  { to: '/cargar/corte', icono: Scissors, titulo: 'Corte de pasto', texto: 'En un lugar de un cliente, con su precio' },
  { to: '/cargar/pago', icono: Banknote, titulo: 'Pago de un cliente', texto: 'Todo lo que debe o una parte' },
  { to: '/cargar/gasto', icono: Fuel, titulo: 'Gasto', texto: 'Combustible, arreglos, empleado y otros' },
  { to: '/cargar/particular', icono: Hammer, titulo: 'Trabajo particular', texto: 'Poda, limpieza, fumigación. No cuenta como corte' },
]

export function Cargar() {
  return (
    <>
      <Encabezado titulo="¿Qué querés cargar?" />
      <ul className="flex flex-col gap-3">
        {OPCIONES.map(({ to, icono: Icono, titulo, texto }, i) => (
          <li key={to}>
            <Link
              to={to}
              className={`flex items-center gap-4 rounded-2xl border px-4 py-4 active:bg-hoja-2 ${
                i === 0 ? 'border-pasto/50 bg-pasto-osc/25' : 'border-tallo bg-hoja'
              }`}
            >
              <span className={`grid size-12 shrink-0 place-items-center rounded-xl ${i === 0 ? 'bg-pasto text-suelo' : 'bg-hoja-2 text-pasto-claro'}`}>
                <Icono className="size-6" />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-lg font-semibold">{titulo}</span>
                <span className="block text-[0.95rem] text-musgo">{texto}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
