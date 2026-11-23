import { ChartColumn, House, Plus, Receipt, Trees } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

const item = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[0.72rem] font-medium ${
    isActive ? 'text-pasto-claro' : 'text-musgo'
  }`

export function Layout() {
  return (
    <div className="mx-auto max-w-lg px-4 pb-nav">
      <Outlet />
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-tallo bg-hoja/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
        aria-label="Principal"
      >
        <div className="mx-auto flex max-w-lg items-stretch px-2">
          <NavLink to="/" end className={item}>
            <House className="size-6" />
            Inicio
          </NavLink>
          <NavLink to="/parques" className={item}>
            <Trees className="size-6" />
            Parques
          </NavLink>
          <NavLink to="/cargar" className="flex flex-1 items-center justify-center" aria-label="Cargar">
            {({ isActive }) => (
              <span
                className={`-mt-6 grid size-16 place-items-center rounded-2xl border-4 border-suelo shadow-lg shadow-black/40 ${
                  isActive ? 'bg-pasto-claro' : 'bg-pasto'
                } text-suelo`}
              >
                <Plus className="size-8" strokeWidth={2.6} />
              </span>
            )}
          </NavLink>
          <NavLink to="/gastos" className={item}>
            <Receipt className="size-6" />
            Gastos
          </NavLink>
          <NavLink to="/resumen" className={item}>
            <ChartColumn className="size-6" />
            Resumen
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
