import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CorteForm } from '../components/CorteForm'
import { Selector } from '../components/Selector'
import { Boton, Campo, Cargando, Encabezado, Entrada, EntradaPlata, Error, Segmentado, claseInput } from '../components/ui'
import { useDatos, useRegistrarTrabajo } from '../lib/api'
import { hoy, plata } from '../lib/format'
import { statsParque } from '../lib/stats'
import type { Cliente, Parque } from '../lib/types'

export function FormTrabajo({ tipo }: { tipo: 'corte' | 'particular' }) {
  const [params, setParams] = useSearchParams()
  const nav = useNavigate()
  const { clientes, parques, trabajos, cargando } = useDatos()
  const nombre = useMemo(() => new Map(clientes.map((c) => [c.id, c.nombre])), [clientes])

  // Lugares activos, primero los que más se acercan a su próximo corte
  const lugares = useMemo(
    () =>
      parques
        .filter((p) => p.activo)
        .map((p) => ({ p, a: statsParque(p, trabajos).avance ?? -1 }))
        .sort((x, y) => y.a - x.a)
        .map((x) => x.p),
    [parques, trabajos],
  )

  if (cargando) return <Cargando />

  if (tipo === 'corte') {
    const parque = parques.find((p) => p.id === params.get('parque'))
    return (
      <>
        <Encabezado titulo={parque ? `Corte en ${nombre.get(parque.cliente_id)}` : '¿Dónde cortaste?'} atras />
        {parque ? (
          <>
            <p className="-mt-3 mb-5 text-musgo">{parque.nombre}</p>
            <CorteForm parque={parque} onListo={() => nav(`/clientes/${parque.cliente_id}`, { replace: true })} />
          </>
        ) : (
          <Selector<Parque>
            items={lugares}
            placeholder="Buscar cliente o lugar"
            texto={(p) => `${nombre.get(p.cliente_id)} ${p.nombre}`}
            onElegir={(p) => setParams({ parque: p.id })}
            render={(p) => (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{nombre.get(p.cliente_id)}</span>
                  <span className="block truncate text-sm text-musgo">{p.nombre}</span>
                </span>
                <span className="num shrink-0">{plata(p.precio)}</span>
              </>
            )}
          />
        )}
      </>
    )
  }

  const cliente = clientes.find((c) => c.id === params.get('cliente'))
  return (
    <>
      <Encabezado titulo={cliente ? `Trabajo para ${cliente.nombre}` : '¿Para qué cliente?'} atras />
      {cliente ? (
        <Particular cliente={cliente} lugares={parques.filter((p) => p.cliente_id === cliente.id)} />
      ) : (
        <Selector<Cliente>
          items={clientes}
          placeholder="Buscar cliente"
          texto={(c) => c.nombre}
          onElegir={(c) => setParams({ cliente: c.id })}
          render={(c) => <span className="font-medium">{c.nombre}</span>}
        />
      )}
    </>
  )
}

type Cobro = 'no' | 'todo' | 'parte'

function Particular({ cliente, lugares }: { cliente: Cliente; lugares: Parque[] }) {
  const nav = useNavigate()
  const [descripcion, setDescripcion] = useState('')
  const [lugar, setLugar] = useState(lugares.length === 1 ? lugares[0].id : '')
  const [fecha, setFecha] = useState(hoy())
  const [importe, setImporte] = useState(0)
  const [cobro, setCobro] = useState<Cobro>('no')
  const [parte, setParte] = useState(0)
  const registrar = useRegistrarTrabajo()
  const cobrado = cobro === 'todo' ? importe : cobro === 'parte' ? Math.min(parte, importe) : 0

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        registrar.mutate(
          { cliente_id: cliente.id, parque_id: lugar || null, tipo: 'particular', fecha, descripcion: descripcion.trim(), importe, cobrado },
          { onSuccess: () => nav(`/clientes/${cliente.id}`, { replace: true }) },
        )
      }}
    >
      <Campo etiqueta="¿Qué hiciste?">
        {(id) => (
          <textarea
            id={id}
            required
            rows={2}
            autoFocus
            placeholder="Poda de árboles y retiro de ramas"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className={`${claseInput} py-3`}
          />
        )}
      </Campo>
      {lugares.length > 1 && (
        <Campo etiqueta="Lugar (opcional)">
          {(id) => (
            <select id={id} value={lugar} onChange={(e) => setLugar(e.target.value)} className={claseInput}>
              <option value="">Sin especificar</option>
              {lugares.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          )}
        </Campo>
      )}
      <Campo etiqueta="Fecha">
        {(id) => <Entrada id={id} type="date" required max={hoy()} value={fecha} onChange={(e) => setFecha(e.target.value)} />}
      </Campo>
      <Campo etiqueta="Importe">{(id) => <EntradaPlata id={id} valor={importe} onChange={setImporte} />}</Campo>
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
        <Campo etiqueta="¿Cuánto te pagaron?">{(id) => <EntradaPlata id={id} valor={parte} onChange={setParte} />}</Campo>
      )}
      <Error error={registrar.error} />
      <Boton type="submit" cargando={registrar.isPending} disabled={!descripcion.trim() || importe <= 0}>
        Guardar trabajo
      </Boton>
    </form>
  )
}
