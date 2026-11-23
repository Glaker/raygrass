import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Boton, BotonBorrar, Campo, Cargando, Encabezado, Entrada, Error, claseInput } from '../components/ui'
import { useBorrar, useDatos, useGuardar } from '../lib/api'
import type { Cliente } from '../lib/types'

export function FormCliente() {
  const { id } = useParams()
  const { clientes, trabajos, cargando } = useDatos()
  if (cargando) return <Cargando />
  const cliente = id ? clientes.find((c) => c.id === id) : undefined
  if (id && !cliente) return <Encabezado titulo="No se encontró el cliente" atras />
  return <Formulario cliente={cliente} tieneTrabajos={trabajos.some((t) => t.cliente_id === id)} />
}

function Formulario({ cliente, tieneTrabajos }: { cliente?: Cliente; tieneTrabajos: boolean }) {
  const nav = useNavigate()
  const [nombre, setNombre] = useState(cliente?.nombre ?? '')
  const [telefono, setTelefono] = useState(cliente?.telefono ?? '')
  const [notas, setNotas] = useState(cliente?.notas ?? '')
  const guardar = useGuardar('clientes')
  const borrar = useBorrar('clientes')

  return (
    <>
      <Encabezado titulo={cliente ? 'Editar cliente' : 'Nuevo cliente'} atras />
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          guardar.mutate(
            { id: cliente?.id, nombre: nombre.trim(), telefono: telefono.trim() || null, notas: notas.trim() || null },
            {
              onSuccess: (c) => {
                const nuevo = c as Cliente
                // Un cliente nuevo necesita un lugar para poder cargarle cortes
                nav(cliente ? `/clientes/${nuevo.id}` : `/parques/nuevo?cliente=${nuevo.id}`, { replace: true })
              },
            },
          )
        }}
      >
        <Campo etiqueta="Nombre">
          {(id) => <Entrada id={id} required autoFocus={!cliente} value={nombre} onChange={(e) => setNombre(e.target.value)} />}
        </Campo>
        <Campo etiqueta="Teléfono (opcional)">
          {(id) => <Entrada id={id} type="tel" inputMode="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} />}
        </Campo>
        <Campo etiqueta="Notas (opcional)">
          {(id) => <textarea id={id} rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} className={`${claseInput} py-3`} />}
        </Campo>
        <Error error={guardar.error} />
        <Boton type="submit" cargando={guardar.isPending} disabled={!nombre.trim()}>
          {cliente ? 'Guardar cambios' : 'Crear cliente y agregar lugar'}
        </Boton>
      </form>

      {cliente && (
        <div className="mt-10 flex flex-col gap-2 border-t border-tallo pt-6">
          {tieneTrabajos ? (
            <p className="text-sm text-musgo">
              Este cliente tiene trabajos cargados, por eso no se puede borrar. Si ya no le cortás, entrá a cada lugar y marcalo como que no se corta más.
            </p>
          ) : (
            <>
              <Error error={borrar.error} />
              <BotonBorrar texto="Borrar cliente" cargando={borrar.isPending} onConfirmar={() => borrar.mutate(cliente.id, { onSuccess: () => nav('/parques', { replace: true }) })} />
            </>
          )}
        </div>
      )}
    </>
  )
}
