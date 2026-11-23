import { useState, type FormEvent } from 'react'
import { Logo } from '../components/Logo'
import { Boton, Campo, Entrada, Error } from '../components/ui'
import { supabase } from '../lib/supabase'

export function Login() {
  const [email, setEmail] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState<unknown>(null)
  const [cargando, setCargando] = useState(false)

  async function entrar(e: FormEvent) {
    e.preventDefault()
    setCargando(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: clave })
    if (error) setError(error)
    setCargando(false)
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-10">
      <Logo className="size-20" />
      <h1 className="mt-6 font-display text-4xl font-bold tracking-tight">RayGrass</h1>
      <p className="mt-1 text-musgo">Cortes, cobros y gastos.</p>

      <form onSubmit={entrar} className="mt-10 flex flex-col gap-4">
        <Campo etiqueta="Mail">
          {(id) => (
            <Entrada id={id} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          )}
        </Campo>
        <Campo etiqueta="Contraseña">
          {(id) => (
            <Entrada
              id={id}
              type="password"
              autoComplete="current-password"
              required
              value={clave}
              onChange={(e) => setClave(e.target.value)}
            />
          )}
        </Campo>
        <Error error={error} />
        <Boton type="submit" cargando={cargando} className="mt-2">
          Entrar
        </Boton>
      </form>
    </main>
  )
}
