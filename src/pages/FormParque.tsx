import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Boton, BotonBorrar, Campo, Cargando, Encabezado, Entrada, EntradaPlata, Error, claseInput } from '../components/ui'
import { useBorrar, useDatos, useGuardar } from '../lib/api'
import { TIPOS_PARQUE, type Parque, type TipoParque } from '../lib/types'

export function FormParque() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const { clientes, parques, trabajos, cargando } = useDatos()
  if (cargando) return <Cargando />
  const parque = id ? parques.find((p) => p.id === id) : undefined
  const clienteId = parque?.cliente_id ?? params.get('cliente')
  const cliente = clientes.find((c) => c.id === clienteId)
  if (!cliente) return <Encabezado titulo="No se encontró el cliente" atras />
  return (
    <Formulario
      parque={parque}
      clienteId={cliente.id}
      clienteNombre={cliente.nombre}
      primero={!parques.some((p) => p.cliente_id === cliente.id)}
      tieneTrabajos={!!parque && trabajos.some((t) => t.parque_id === parque.id)}
    />
  )
}

function Formulario({
  parque,
  clienteId,
  clienteNombre,
  primero,
  tieneTrabajos,
}: {
  parque?: Parque
  clienteId: string
  clienteNombre: string
  primero: boolean
  tieneTrabajos: boolean
}) {
  const nav = useNavigate()
  const [nombre, setNombre] = useState(parque?.nombre ?? (primero ? 'Quinta' : ''))
  const [tipo, setTipo] = useState<TipoParque>(parque?.tipo ?? 'quinta')
  const [precio, setPrecio] = useState(parque?.precio ?? 0)
  const [m2, setM2] = useState(parque?.tamano_m2 ? String(parque.tamano_m2) : '')
  const [horas, setHoras] = useState(parque?.tiempo_min ? String(Math.floor(parque.tiempo_min / 60)) : '')
  const [minutos, setMinutos] = useState(parque?.tiempo_min ? String(parque.tiempo_min % 60) : '')
  const [direccion, setDireccion] = useState(parque?.direccion ?? '')
  const [notas, setNotas] = useState(parque?.notas ?? '')
  const [activo, setActivo] = useState(parque?.activo ?? true)
  const guardar = useGuardar('parques')
  const borrar = useBorrar('parques')

  const tiempo = (Number(horas) || 0) * 60 + (Number(minutos) || 0)

  return (
    <>
      <Encabezado titulo={parque ? 'Editar lugar' : 'Nuevo lugar'} atras />
      <p className="-mt-3 mb-5 text-musgo">{clienteNombre}</p>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          guardar.mutate(
            {
              id: parque?.id,
              cliente_id: clienteId,
              nombre: nombre.trim(),
              tipo,
              precio,
              tamano_m2: Number(m2.replace(/\D/g, '')) || null,
              tiempo_min: tiempo || null,
              direccion: direccion.trim() || null,
              notas: notas.trim() || null,
              activo,
            },
            { onSuccess: (p) => nav(`/parques/${(p as Parque).id}`, { replace: true }) },
          )
        }}
      >
        <Campo etiqueta="Nombre del lugar" ayuda="Por ejemplo: Quinta, Cancha, Predio calle 37">
          {(id) => <Entrada id={id} required value={nombre} onChange={(e) => setNombre(e.target.value)} />}
        </Campo>
        <Campo etiqueta="Tipo">
          {(id) => (
            <select id={id} value={tipo} onChange={(e) => setTipo(e.target.value as TipoParque)} className={claseInput}>
              {Object.entries(TIPOS_PARQUE).map(([v, t]) => (
                <option key={v} value={v}>
                  {t}
                </option>
              ))}
            </select>
          )}
        </Campo>
        <Campo etiqueta="Precio por corte" ayuda="Se usa al registrar cada corte. Se puede cambiar en el momento.">
          {(id) => <EntradaPlata id={id} valor={precio} onChange={setPrecio} />}
        </Campo>
        <Campo etiqueta="Tamaño aproximado (m²)">
          {(id) => <Entrada id={id} inputMode="numeric" value={m2} onChange={(e) => setM2(e.target.value.replace(/\D/g, ''))} placeholder="Opcional" />}
        </Campo>
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-sm font-medium text-musgo">Tiempo aproximado de corte</legend>
          <div className="grid grid-cols-2 gap-3">
            <label className="relative">
              <Entrada inputMode="numeric" value={horas} onChange={(e) => setHoras(e.target.value.replace(/\D/g, ''))} placeholder="0" aria-label="Horas" />
              <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-musgo">horas</span>
            </label>
            <label className="relative">
              <Entrada
                inputMode="numeric"
                value={minutos}
                onChange={(e) => setMinutos(String(Math.min(59, Number(e.target.value.replace(/\D/g, '')) || 0) || ''))}
                placeholder="0"
                aria-label="Minutos"
              />
              <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-musgo">min</span>
            </label>
          </div>
        </fieldset>
        <Campo etiqueta="Dirección (opcional)">
          {(id) => <Entrada id={id} value={direccion} onChange={(e) => setDireccion(e.target.value)} />}
        </Campo>
        <Campo etiqueta="Notas (opcional)">
          {(id) => <textarea id={id} rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} className={`${claseInput} py-3`} />}
        </Campo>
        {parque && (
          <label className="flex items-start gap-3 rounded-xl bg-hoja px-4 py-3">
            <input type="checkbox" className="mt-1 size-5 accent-[var(--color-pasto)]" checked={!activo} onChange={(e) => setActivo(!e.target.checked)} />
            <span>
              Ya no se corta más
              <span className="block text-sm text-musgo">Deja de aparecer en “Para cortar”. El historial se conserva.</span>
            </span>
          </label>
        )}
        <Error error={guardar.error} />
        <Boton type="submit" cargando={guardar.isPending} disabled={!nombre.trim()}>
          {parque ? 'Guardar cambios' : 'Guardar lugar'}
        </Boton>
      </form>

      {parque && !tieneTrabajos && (
        <div className="mt-10 flex flex-col gap-2 border-t border-tallo pt-6">
          <Error error={borrar.error} />
          <BotonBorrar
            texto="Borrar lugar"
            cargando={borrar.isPending}
            onConfirmar={() => borrar.mutate(parque.id, { onSuccess: () => nav(`/clientes/${clienteId}`, { replace: true }) })}
          />
        </div>
      )}
    </>
  )
}
