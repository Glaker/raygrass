import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Boton, BotonBorrar, Campo, Cargando, Encabezado, Entrada, EntradaPlata, Error, claseInput } from '../components/ui'
import { useBorrar, useGastos, useGuardar } from '../lib/api'
import { hoy } from '../lib/format'
import { CATEGORIAS, type Categoria, type Gasto } from '../lib/types'

export function FormGasto() {
  const { id } = useParams()
  const { data, isPending } = useGastos()
  if (id && isPending) return <Cargando />
  const gasto = id ? data?.find((g) => g.id === id) : undefined
  if (id && !gasto) return <Encabezado titulo="No se encontró el gasto" atras />
  return <Formulario gasto={gasto} />
}

function Formulario({ gasto }: { gasto?: Gasto }) {
  const nav = useNavigate()
  const [categoria, setCategoria] = useState<Categoria>(gasto?.categoria ?? 'combustible')
  const [monto, setMonto] = useState(gasto?.monto ?? 0)
  const [fecha, setFecha] = useState(gasto?.fecha ?? hoy())
  const [descripcion, setDescripcion] = useState(gasto?.descripcion ?? '')
  const guardar = useGuardar('gastos')
  const borrar = useBorrar('gastos')

  return (
    <>
      <Encabezado titulo={gasto ? 'Editar gasto' : 'Nuevo gasto'} atras />
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          guardar.mutate(
            { id: gasto?.id, categoria, monto, fecha, descripcion: descripcion.trim() || null },
            { onSuccess: () => nav('/gastos', { replace: true }) },
          )
        }}
      >
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-musgo">Categoría</legend>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(CATEGORIAS) as [Categoria, string][]).map(([v, t]) => (
              <button
                key={v}
                type="button"
                aria-pressed={categoria === v}
                onClick={() => setCategoria(v)}
                className={`min-h-12 rounded-xl border px-3 text-left ${
                  categoria === v ? 'border-pasto bg-pasto-osc/40 font-semibold' : 'border-tallo bg-hoja text-musgo'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </fieldset>
        <Campo etiqueta="Monto">{(id) => <EntradaPlata id={id} valor={monto} onChange={setMonto} />}</Campo>
        <Campo etiqueta="Fecha">
          {(id) => <Entrada id={id} type="date" required max={hoy()} value={fecha} onChange={(e) => setFecha(e.target.value)} />}
        </Campo>
        <Campo etiqueta="Detalle (opcional)">
          {(id) => (
            <input
              id={id}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className={claseInput}
              placeholder={categoria === 'empleado' ? 'Nombre, horas trabajadas…' : categoria === 'combustible' ? '20 litros de nafta' : ''}
            />
          )}
        </Campo>
        <Error error={guardar.error} />
        <Boton type="submit" cargando={guardar.isPending} disabled={monto <= 0}>
          {gasto ? 'Guardar cambios' : 'Guardar gasto'}
        </Boton>
      </form>
      {gasto && (
        <div className="mt-10 flex flex-col gap-2 border-t border-tallo pt-6">
          <Error error={borrar.error} />
          <BotonBorrar texto="Borrar gasto" cargando={borrar.isPending} onConfirmar={() => borrar.mutate(gasto.id, { onSuccess: () => nav('/gastos', { replace: true }) })} />
        </div>
      )}
    </>
  )
}
