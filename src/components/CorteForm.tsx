import { useState } from 'react'
import { useRegistrarTrabajo } from '../lib/api'
import { hoy, plata } from '../lib/format'
import type { Parque } from '../lib/types'
import { Boton, Campo, Entrada, EntradaPlata, Error, Segmentado } from './ui'

type Cobro = 'no' | 'todo' | 'parte'

/** Campos para registrar un corte en un parque ya elegido. */
export function CorteForm({ parque, onListo }: { parque: Parque; onListo: () => void }) {
  const [fecha, setFecha] = useState(hoy())
  const [importe, setImporte] = useState(parque.precio)
  const [cobro, setCobro] = useState<Cobro>('no')
  const [parte, setParte] = useState(0)
  const [actualizarPrecio, setActualizarPrecio] = useState(false)
  const registrar = useRegistrarTrabajo()

  const cobrado = cobro === 'todo' ? importe : cobro === 'parte' ? Math.min(parte, importe) : 0
  const cambioPrecio = importe > 0 && importe !== parque.precio

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        registrar.mutate(
          {
            cliente_id: parque.cliente_id,
            parque_id: parque.id,
            tipo: 'corte',
            fecha,
            descripcion: null,
            importe,
            cobrado,
            nuevoPrecio: cambioPrecio && actualizarPrecio ? importe : undefined,
          },
          { onSuccess: onListo },
        )
      }}
    >
      <Campo etiqueta="Fecha">
        {(id) => <Entrada id={id} type="date" required max={hoy()} value={fecha} onChange={(e) => setFecha(e.target.value)} />}
      </Campo>
      <Campo etiqueta="Importe">{(id) => <EntradaPlata id={id} valor={importe} onChange={setImporte} />}</Campo>
      {cambioPrecio && (
        <label className="flex items-start gap-3 rounded-xl bg-hoja-2 px-4 py-3 text-[0.95rem]">
          <input
            type="checkbox"
            className="mt-1 size-5 accent-[var(--color-pasto)]"
            checked={actualizarPrecio}
            onChange={(e) => setActualizarPrecio(e.target.checked)}
          />
          <span>
            Usar {plata(importe)} como precio de ahora en adelante
            <span className="block text-sm text-musgo">Hoy el precio es {plata(parque.precio)}</span>
          </span>
        </label>
      )}
      <Campo etiqueta="¿Cobraste?">
        {() => (
          <Segmentado<Cobro>
            etiqueta="¿Cobraste?"
            valor={cobro}
            onChange={setCobro}
            opciones={[
              { valor: 'no', texto: 'Todavía no' },
              { valor: 'todo', texto: 'Todo' },
              { valor: 'parte', texto: 'Una parte' },
            ]}
          />
        )}
      </Campo>
      {cobro === 'parte' && (
        <Campo etiqueta="¿Cuánto te pagaron?" ayuda={parte > 0 && parte < importe ? `Queda debiendo ${plata(importe - parte)}` : undefined}>
          {(id) => <EntradaPlata id={id} valor={parte} onChange={setParte} autoFocus />}
        </Campo>
      )}
      <Error error={registrar.error} />
      <Boton type="submit" cargando={registrar.isPending} disabled={importe <= 0 || (cobro === 'parte' && parte <= 0)}>
        Guardar corte
      </Boton>
    </form>
  )
}
