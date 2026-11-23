import { useEffect, useState } from 'react'
import { Boton, Campo, Encabezado, Entrada, Error, Seccion } from '../components/ui'
import { supabase } from '../lib/supabase'

export function Cuenta() {
  const [email, setEmail] = useState('')
  const [clave, setClave] = useState('')
  const [repetir, setRepetir] = useState('')
  const [estado, setEstado] = useState<'listo' | 'guardando' | 'ok'>('listo')
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ''))
  }, [])

  const noCoinciden = repetir.length > 0 && clave !== repetir

  return (
    <>
      <Encabezado titulo="Mi cuenta" atras />
      <p className="text-musgo">Entraste como</p>
      <p className="text-lg">{email}</p>

      <Seccion titulo="Cambiar contraseña">
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault()
            setEstado('guardando')
            setError(null)
            const { error } = await supabase.auth.updateUser({ password: clave })
            if (error) {
              setError(error)
              setEstado('listo')
            } else {
              setEstado('ok')
              setClave('')
              setRepetir('')
            }
          }}
        >
          <Campo etiqueta="Contraseña nueva" ayuda="Al menos 6 caracteres.">
            {(id) => <Entrada id={id} type="password" autoComplete="new-password" minLength={6} required value={clave} onChange={(e) => setClave(e.target.value)} />}
          </Campo>
          <Campo etiqueta="Repetila" ayuda={noCoinciden ? 'No coinciden.' : undefined}>
            {(id) => <Entrada id={id} type="password" autoComplete="new-password" required value={repetir} onChange={(e) => setRepetir(e.target.value)} />}
          </Campo>
          <Error error={error} />
          {estado === 'ok' && <p className="text-pasto-claro">Contraseña cambiada.</p>}
          <Boton type="submit" cargando={estado === 'guardando'} disabled={clave.length < 6 || clave !== repetir}>
            Cambiar contraseña
          </Boton>
        </form>
      </Seccion>

      <div className="mt-10 border-t border-tallo pt-6">
        <Boton variante="secundario" className="w-full" onClick={() => supabase.auth.signOut()}>
          Cerrar sesión
        </Boton>
      </div>
    </>
  )
}
