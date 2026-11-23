import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Selector } from '../components/Selector'
import { Boton, Campo, Cargando, Encabezado, Entrada, EntradaPlata, Error, Segmentado, claseInput } from '../components/ui'
import { useDatos, useGuardar } from '../lib/api'
import { hoy, plata } from '../lib/format'
import { saldosPorCliente } from '../lib/stats'
import type { Cliente } from '../lib/types'

export function FormPago() {
  const [params, setParams] = useSearchParams()
  const { clientes, trabajos, pagos, cargando } = useDatos()
  const saldos = useMemo(() => saldosPorCliente(trabajos, pagos), [trabajos, pagos])
  // Primero los que deben, de mayor a menor deuda
  const ordenados = useMemo(
    () => [...clientes].sort((a, b) => (saldos.get(b.id)?.saldo ?? 0) - (saldos.get(a.id)?.saldo ?? 0) || a.nombre.localeCompare(b.nombre)),
    [clientes, saldos],
  )

  if (cargando) return <Cargando />
  const cliente = clientes.find((c) => c.id === params.get('cliente'))

  return (
    <>
      <Encabezado titulo={cliente ? `Pago de ${cliente.nombre}` : '¿Quién te pagó?'} atras />
      {cliente ? (
        <Formulario key={cliente.id} cliente={cliente} saldo={saldos.get(cliente.id)?.saldo ?? 0} />
      ) : (
        <Selector<Cliente>
          items={ordenados}
          placeholder="Buscar cliente"
          texto={(c) => c.nombre}
          onElegir={(c) => setParams({ cliente: c.id })}
          render={(c) => {
            const s = saldos.get(c.id)?.saldo ?? 0
            return (
              <>
                <span className="min-w-0 flex-1 truncate font-medium">{c.nombre}</span>
                {s > 0 && <span className="num shrink-0 text-paja">debe {plata(s)}</span>}
              </>
            )
          }}
        />
      )}
    </>
  )
}

function Formulario({ cliente, saldo }: { cliente: Cliente; saldo: number }) {
  const nav = useNavigate()
  const [modo, setModo] = useState<'todo' | 'parte'>(saldo > 0 ? 'todo' : 'parte')
  const [monto, setMonto] = useState(0)
  const [fecha, setFecha] = useState(hoy())
  const [notas, setNotas] = useState('')
  const guardar = useGuardar('pagos')
  const final = modo === 'todo' ? saldo : monto

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        guardar.mutate(
          { cliente_id: cliente.id, trabajo_id: null, fecha, monto: final, notas: notas.trim() || null },
          { onSuccess: () => nav(`/clientes/${cliente.id}`, { replace: true }) },
        )
      }}
    >
      <div className="rounded-2xl border border-tallo bg-hoja px-4 py-3">
        <p className="text-musgo">{saldo > 0 ? 'Debe' : 'No tiene deuda'}</p>
        <p className={`num font-display text-3xl font-bold ${saldo > 0 ? 'text-paja' : ''}`}>{plata(Math.max(saldo, 0))}</p>
      </div>
      {saldo > 0 && (
        <Segmentado
          etiqueta="Cuánto pagó"
          valor={modo}
          onChange={setModo}
          opciones={[
            { valor: 'todo', texto: 'Pagó todo' },
            { valor: 'parte', texto: 'Pagó una parte' },
          ]}
        />
      )}
      {modo === 'parte' && (
        <Campo
          etiqueta="Monto"
          ayuda={saldo > 0 && monto > 0 && monto < saldo ? `Va a quedar debiendo ${plata(saldo - monto)}` : 'Se descuenta de los trabajos más viejos primero.'}
        >
          {(id) => <EntradaPlata id={id} valor={monto} onChange={setMonto} autoFocus />}
        </Campo>
      )}
      <Campo etiqueta="Fecha">
        {(id) => <Entrada id={id} type="date" required max={hoy()} value={fecha} onChange={(e) => setFecha(e.target.value)} />}
      </Campo>
      <Campo etiqueta="Nota (opcional)">
        {(id) => <input id={id} value={notas} onChange={(e) => setNotas(e.target.value)} className={claseInput} placeholder="Transferencia, efectivo…" />}
      </Campo>
      <Error error={guardar.error} />
      <Boton type="submit" cargando={guardar.isPending} disabled={final <= 0}>
        Registrar pago de {plata(final)}
      </Boton>
    </form>
  )
}
