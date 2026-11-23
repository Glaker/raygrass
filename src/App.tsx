import type { Session } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Cargando } from './components/ui'
import { supabase } from './lib/supabase'
import { Cargar } from './pages/Cargar'
import { ClientePagina } from './pages/Cliente'
import { Cuenta } from './pages/Cuenta'
import { FormCliente } from './pages/FormCliente'
import { FormGasto } from './pages/FormGasto'
import { FormPago } from './pages/FormPago'
import { FormParque } from './pages/FormParque'
import { FormTrabajo } from './pages/FormTrabajo'
import { Gastos } from './pages/Gastos'
import { Inicio } from './pages/Inicio'
import { Login } from './pages/Login'
import { ParquePagina } from './pages/Parque'
import { Parques } from './pages/Parques'
import { Resumen } from './pages/Resumen'

export function App() {
  const [sesion, setSesion] = useState<Session | null | undefined>(undefined)
  const qc = useQueryClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSesion(data.session))
    const { data } = supabase.auth.onAuthStateChange((evento, s) => {
      setSesion(s)
      if (evento === 'SIGNED_OUT') qc.clear()
    })
    return () => data.subscription.unsubscribe()
  }, [qc])

  if (sesion === undefined) return <Cargando />
  if (!sesion) return <Login />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Inicio />} />
        <Route path="parques" element={<Parques />} />
        <Route path="clientes/nuevo" element={<FormCliente />} />
        <Route path="clientes/:id" element={<ClientePagina />} />
        <Route path="clientes/:id/editar" element={<FormCliente />} />
        <Route path="parques/nuevo" element={<FormParque />} />
        <Route path="parques/:id" element={<ParquePagina />} />
        <Route path="parques/:id/editar" element={<FormParque />} />
        <Route path="cargar" element={<Cargar />} />
        <Route path="cargar/corte" element={<FormTrabajo tipo="corte" />} />
        <Route path="cargar/particular" element={<FormTrabajo tipo="particular" />} />
        <Route path="cargar/pago" element={<FormPago />} />
        <Route path="cargar/gasto" element={<FormGasto />} />
        <Route path="gastos" element={<Gastos />} />
        <Route path="gastos/:id" element={<FormGasto />} />
        <Route path="resumen" element={<Resumen />} />
        <Route path="cuenta" element={<Cuenta />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
