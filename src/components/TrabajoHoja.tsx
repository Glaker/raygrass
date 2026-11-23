import { useState } from 'react'
import { useBorrar, useGuardar } from '../lib/api'
import { fechaConDia, hoy, plata } from '../lib/format'
import type { Pago, Trabajo } from '../lib/types'
import { Boton, BotonBorrar, Campo, Entrada, EntradaPlata, Error, Hoja } from './ui'

/** Detalle de un trabajo: cobrarlo (todo o una parte) o borrarlo. */
export function TrabajoHoja({ trabajo, titulo, onCerrar }: { trabajo: Trabajo | null; titulo: string; onCerrar: () => void }) {
  return (
    <Hoja abierta={!!trabajo} onCerrar={onCerrar} titulo={titulo}>
      {trabajo && <Detalle key={trabajo.id} t={trabajo} onCerrar={onCerrar} />}
    </Hoja>
  )
}

function Detalle({ t, onCerrar }: { t: Trabajo; onCerrar: () => void }) {
  const [monto, setMonto] = useState(t.saldo)
  const [fecha, setFecha] = useState(hoy())
  const pagar = useGuardar('pagos')
  const borrar = useBorrar('trabajos')

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-2 gap-y-2 rounded-xl bg-hoja-2 px-4 py-3">
        <dt className="text-musgo">Fecha</dt>
        <dd className="text-right">{fechaConDia(t.fecha)}</dd>
        <dt className="text-musgo">Importe</dt>
        <dd className="num text-right">{plata(t.importe)}</dd>
        <dt className="text-musgo">Pagado</dt>
        <dd className="num text-right">{plata(t.pagado)}</dd>
        <dt className="text-musgo">Falta</dt>
        <dd className={`num text-right font-semibold ${t.saldo > 0 ? 'text-paja' : ''}`}>{plata(t.saldo)}</dd>
      </dl>
      {t.descripcion && <p className="text-musgo">{t.descripcion}</p>}

      {t.saldo > 0 && (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            pagar.mutate({ cliente_id: t.cliente_id, trabajo_id: t.id, fecha, monto: Math.min(monto, t.saldo) }, { onSuccess: onCerrar })
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Cobrar">{(id) => <EntradaPlata id={id} valor={monto} onChange={setMonto} />}</Campo>
            <Campo etiqueta="Fecha">
              {(id) => <Entrada id={id} type="date" max={hoy()} value={fecha} onChange={(e) => setFecha(e.target.value)} />}
            </Campo>
          </div>
          <Error error={pagar.error} />
          <Boton type="submit" cargando={pagar.isPending} disabled={monto <= 0}>
            {monto >= t.saldo ? 'Marcar como cobrado' : `Cobrar ${plata(monto)}`}
          </Boton>
        </form>
      )}

      <Error error={borrar.error} />
      <BotonBorrar texto="Borrar este trabajo" cargando={borrar.isPending} onConfirmar={() => borrar.mutate(t.id, { onSuccess: onCerrar })} />
    </div>
  )
}

export function PagoHoja({ pago, onCerrar }: { pago: Pago | null; onCerrar: () => void }) {
  const borrar = useBorrar('pagos')
  return (
    <Hoja abierta={!!pago} onCerrar={onCerrar} titulo="Pago">
      {pago && (
        <div className="flex flex-col gap-4">
          <dl className="grid grid-cols-2 gap-y-2 rounded-xl bg-hoja-2 px-4 py-3">
            <dt className="text-musgo">Fecha</dt>
            <dd className="text-right">{fechaConDia(pago.fecha)}</dd>
            <dt className="text-musgo">Monto</dt>
            <dd className="num text-right font-semibold">{plata(pago.monto)}</dd>
          </dl>
          {pago.notas && <p className="text-musgo">{pago.notas}</p>}
          <Error error={borrar.error} />
          <BotonBorrar texto="Borrar este pago" cargando={borrar.isPending} onConfirmar={() => borrar.mutate(pago.id, { onSuccess: onCerrar })} />
        </div>
      )}
    </Hoja>
  )
}
