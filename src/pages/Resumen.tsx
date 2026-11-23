import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Cargando, Encabezado, Error, Lista, Seccion, Segmentado, Vacio } from '../components/ui'
import { useDatos } from '../lib/api'
import { mesAbrev, nombreMes, plata } from '../lib/format'
import { mesDe, saldosPorCliente, statsParque, ultimosMeses } from '../lib/stats'

type Rango = '6' | '12'

export function Resumen() {
  const { clientes, parques, trabajos, pagos, gastos, cargando, error } = useDatos()
  const [rango, setRango] = useState<Rango>('6')
  const meses = useMemo(() => ultimosMeses(Number(rango)), [rango])
  const [elegido, setElegido] = useState<string | null>(null)

  const porMes = useMemo(() => {
    const vacio = () => ({ trabajado: 0, cobrado: 0, gastos: 0, cortes: 0 })
    const m = new Map(meses.map((x) => [x, vacio()]))
    for (const t of trabajos) {
      const r = m.get(mesDe(t.fecha))
      if (r) {
        r.trabajado += t.importe
        if (t.tipo === 'corte') r.cortes++
      }
    }
    for (const p of pagos) {
      const r = m.get(mesDe(p.fecha))
      if (r) r.cobrado += p.monto
    }
    for (const g of gastos) {
      const r = m.get(mesDe(g.fecha))
      if (r) r.gastos += g.monto
    }
    return meses.map((mes) => ({ mes, ...m.get(mes)! }))
  }, [meses, trabajos, pagos, gastos])

  const deudores = useMemo(() => {
    const s = saldosPorCliente(trabajos, pagos)
    return clientes
      .map((c) => ({ c, saldo: s.get(c.id)?.saldo ?? 0 }))
      .filter((x) => x.saldo > 0)
      .sort((a, b) => b.saldo - a.saldo)
  }, [clientes, trabajos, pagos])

  const mejores = useMemo(() => {
    const nombre = new Map(clientes.map((c) => [c.id, c.nombre]))
    const desde = meses[0]
    return parques
      .map((p) => {
        const s = statsParque(p, trabajos)
        const enRango = trabajos.filter((t) => t.parque_id === p.id && t.tipo === 'corte' && mesDe(t.fecha) >= desde)
        return { p, cliente: nombre.get(p.cliente_id), s, total: enRango.reduce((a, t) => a + t.importe, 0), cortes: enRango.length }
      })
      .filter((x) => x.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
  }, [clientes, parques, trabajos, meses])

  if (cargando) return <Cargando />

  const max = Math.max(1, ...porMes.flatMap((m) => [m.trabajado, m.gastos]))
  const totales = porMes.reduce(
    (a, m) => ({ trabajado: a.trabajado + m.trabajado, cobrado: a.cobrado + m.cobrado, gastos: a.gastos + m.gastos, cortes: a.cortes + m.cortes }),
    { trabajado: 0, cobrado: 0, gastos: 0, cortes: 0 },
  )
  const sel = porMes.find((m) => m.mes === elegido) ?? null
  const mostrado = sel ?? totales
  const totalDeuda = deudores.reduce((s, d) => s + d.saldo, 0)

  return (
    <>
      <Encabezado titulo="Resumen" />
      <Error error={error} />
      <Segmentado
        etiqueta="Período"
        valor={rango}
        onChange={(r) => {
          setRango(r)
          setElegido(null)
        }}
        opciones={[
          { valor: '6', texto: 'Últimos 6 meses' },
          { valor: '12', texto: 'Últimos 12 meses' },
        ]}
      />

      <div className="mt-4 rounded-2xl border border-tallo bg-hoja p-4">
        <div className="flex h-40 items-end gap-1.5" role="group" aria-label="Trabajado y gastos por mes">
          {porMes.map((m) => {
            const activo = elegido === m.mes
            return (
              <button
                key={m.mes}
                onClick={() => setElegido(activo ? null : m.mes)}
                aria-pressed={activo}
                aria-label={`${nombreMes(m.mes)}: trabajado ${plata(m.trabajado)}, gastos ${plata(m.gastos)}`}
                className={`flex h-full flex-1 flex-col justify-end rounded-lg pt-1 ${activo ? 'bg-hoja-2' : ''} ${elegido && !activo ? 'opacity-45' : ''}`}
              >
                <div className="flex flex-1 items-end justify-center gap-0.5 px-0.5">
                  <div className="w-full max-w-4 rounded-t-[3px] bg-pasto" style={{ height: `${(m.trabajado / max) * 100}%` }} />
                  <div className="w-full max-w-4 rounded-t-[3px] bg-alerta/70" style={{ height: `${(m.gastos / max) * 100}%` }} />
                </div>
                <span className="mt-1.5 text-center text-xs text-musgo">{mesAbrev(m.mes)}</span>
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex gap-4 text-sm text-musgo">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-pasto" /> Trabajado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-alerta/70" /> Gastos
          </span>
        </div>

        <p className="mt-4 font-display text-lg font-semibold">{sel ? nombreMes(sel.mes) : `Total de ${rango} meses`}</p>
        <dl className="mt-2 grid grid-cols-2 gap-y-1.5">
          <dt className="text-musgo">Trabajado</dt>
          <dd className="num text-right">{plata(mostrado.trabajado)}</dd>
          <dt className="text-musgo">Cobrado</dt>
          <dd className="num text-right">{plata(mostrado.cobrado)}</dd>
          <dt className="text-musgo">Gastos</dt>
          <dd className="num text-right">{plata(mostrado.gastos)}</dd>
          <dt className="border-t border-tallo pt-1.5 font-medium">Ganancia</dt>
          <dd className={`num border-t border-tallo pt-1.5 text-right font-display text-lg font-semibold ${mostrado.trabajado - mostrado.gastos < 0 ? 'text-alerta' : 'text-pasto-claro'}`}>
            {plata(mostrado.trabajado - mostrado.gastos)}
          </dd>
          <dt className="text-musgo">Cortes</dt>
          <dd className="num text-right">{mostrado.cortes}</dd>
        </dl>
        {!sel && <p className="mt-2 text-sm text-musgo">Tocá un mes para ver su detalle.</p>}
      </div>

      <Seccion titulo="Quiénes deben" accion={<span className="num font-medium text-paja">{plata(totalDeuda)}</span>}>
        {deudores.length === 0 ? (
          <Vacio>Nadie debe nada.</Vacio>
        ) : (
          <Lista>
            {deudores.map(({ c, saldo }) => (
              <li key={c.id}>
                <Link to={`/clientes/${c.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-hoja-2">
                  <span className="min-w-0 flex-1 truncate">{c.nombre}</span>
                  <span className="num shrink-0 font-medium text-paja">{plata(saldo)}</span>
                </Link>
              </li>
            ))}
          </Lista>
        )}
      </Seccion>

      <Seccion titulo={`Lugares que más generaron (${rango} meses)`}>
        {mejores.length === 0 ? (
          <Vacio>Todavía no hay cortes en este período.</Vacio>
        ) : (
          <Lista>
            {mejores.map(({ p, cliente, s, total, cortes }) => (
              <li key={p.id}>
                <Link to={`/parques/${p.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-hoja-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{cliente}</p>
                    <p className="truncate text-sm text-musgo">
                      {p.nombre}, {cortes} cortes{s.frecuencia ? `, cada ${s.frecuencia} días` : ''}
                    </p>
                  </div>
                  <span className="num shrink-0 font-medium">{plata(total)}</span>
                </Link>
              </li>
            ))}
          </Lista>
        )}
      </Seccion>
    </>
  )
}
