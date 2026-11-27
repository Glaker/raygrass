import { plata } from './format'

export interface FilaInforme {
  fecha: string
  trabajo: string
  importe: number
  saldo: number
}

export interface DatosInforme {
  cliente: string
  /** Debajo del nombre (direcciones de los lugares). */
  detalle: string | null
  desde: string
  hasta: string
  filas: FilaInforme[]
}

const ddmmaaaa = (s: string) => s.split('-').reverse().join('/')
const AZUL: [number, number, number] = [31, 45, 110]
const VERDE: [number, number, number] = [30, 120, 60]
const ROJO: [number, number, number] = [175, 40, 40]

const estadoCobro = (importe: number, saldo: number) =>
  saldo <= 0 ? 'Cobrado' : saldo < importe ? `Debe ${plata(saldo)}` : 'Sin cobrar'

/** Arma el PDF con el formato de los informes que se le mandan a los clientes. */
export async function generarInforme(d: DatosInforme): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const izq = 20
  const der = W - 20
  const colTrabajo = izq + 30
  const colImporte = der - 36
  const anchoTrabajo = colImporte - 30 - colTrabajo

  let y = 22
  doc.setFont('helvetica', 'bold').setFontSize(16).setTextColor(0)
  doc.text(d.cliente.toUpperCase(), izq, y)
  doc.setFont('helvetica', 'normal').setFontSize(9)
  if (d.detalle) doc.text(doc.splitTextToSize(d.detalle, 70), der, y - 3, { align: 'right' })
  y += 6
  doc.setFontSize(10).setTextColor(90)
  doc.text(`Del ${ddmmaaaa(d.desde)} al ${ddmmaaaa(d.hasta)}`, izq, y)

  const encabezado = () => {
    y += 5
    doc.setDrawColor(...AZUL).setLineWidth(0.5)
    doc.line(izq, y, der, y)
    doc.line(izq, y + 1, der, y + 1)
    y += 6
    doc.setFont('times', 'bolditalic').setFontSize(13).setTextColor(...AZUL)
    doc.text('Fecha', izq + 2, y)
    doc.text('Trabajo', colTrabajo + anchoTrabajo / 2, y, { align: 'center' })
    doc.text('Importe', colImporte, y, { align: 'right' })
    doc.text('Estado', der - 2, y, { align: 'right' })
    y += 2.5
    doc.line(izq, y, der, y)
    doc.line(izq, y + 1, der, y + 1)
    y += 10
    doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(0)
  }
  encabezado()

  for (const f of d.filas) {
    const lineas: string[] = doc.splitTextToSize(f.trabajo, anchoTrabajo)
    if (y + lineas.length * 5 > H - 30) {
      doc.addPage()
      y = 15
      encabezado()
    }
    doc.text(ddmmaaaa(f.fecha), izq + 2, y)
    doc.text(lineas, colTrabajo, y)
    doc.text(plata(f.importe), colImporte, y, { align: 'right' })
    const cobrado = f.saldo <= 0
    doc.setFont('helvetica', cobrado ? 'normal' : 'bold').setTextColor(...(cobrado ? VERDE : ROJO))
    doc.text(estadoCobro(f.importe, f.saldo), der - 2, y, { align: 'right' })
    doc.setFont('helvetica', 'normal').setTextColor(0)
    y += Math.max(1, lineas.length) * 5 + 6
  }

  if (d.filas.length === 0) {
    doc.setTextColor(120).text('No hay trabajos en este período.', izq + 2, y)
    y += 11
  }

  pieTotales(doc, y, d.filas, 'Total a pagar')
  return doc.output('blob')
}

type Pdf = InstanceType<(typeof import('jspdf'))['jsPDF']>

/**
 * Totales al pie: lo trabajado, lo cobrado y, en el recuadro, lo que falta pagar
 * (suma de los saldos pendientes, no de los importes).
 */
function pieTotales(doc: Pdf, y: number, filas: { importe: number; saldo: number }[], etiquetaFalta: string) {
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const izq = 16
  const der = W - 15.5
  if (y > H - 40) {
    doc.addPage()
    y = 20
  }
  const total = filas.reduce((s, f) => s + f.importe, 0)
  const falta = filas.reduce((s, f) => s + Math.max(0, f.saldo), 0)

  y -= 2
  doc.setDrawColor(160).setLineWidth(0.3).line(izq, y, der + 1.5, y)
  y += 6
  const renglon = (texto: string, monto: number, color: [number, number, number] | number) => {
    doc.setFont('times', 'bolditalic').setFontSize(11).setTextColor(0)
    doc.text(texto, izq, y)
    doc.setFont('times', 'bold')
    if (typeof color === 'number') doc.setTextColor(color)
    else doc.setTextColor(...color)
    doc.text(plata(monto), der, y, { align: 'right' })
    y += 6
  }
  renglon('Total trabajos', total, 0)
  renglon('Cobrado', total - falta, VERDE)
  y += 2

  const textoFalta = plata(falta)
  doc.setFont('times', 'bolditalic').setFontSize(12).setTextColor(0)
  doc.text(etiquetaFalta, izq, y)
  doc.setFont('times', 'bold').setFontSize(13).setTextColor(...(falta > 0 ? ROJO : VERDE))
  const ancho = doc.getTextWidth(textoFalta) + 3
  doc.text(textoFalta, der, y, { align: 'right' })
  doc.setDrawColor(0).setLineWidth(0.4).rect(der + 1.5 - ancho - 0.5, y - 4.8, ancho, 6.5)
}

export interface FilaCorte {
  fecha: string
  cliente: string
  /** Lugar o descripción del trabajo. */
  lugar: string
  importe: number
  saldo: number
}

export interface DatosInformeCortes {
  titulo: string
  /** Arriba a la derecha (ej. "Solo sin cobrar"). */
  detalle: string | null
  desde: string
  hasta: string
  filas: FilaCorte[]
}

/** Lista de trabajos hechos con su estado de cobro, con el mismo formato que el informe del cliente. */
export async function generarInformeCortes(d: DatosInformeCortes): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const izq = 20
  const der = W - 20
  const colTrabajo = izq + 28
  const colImporte = der - 36
  const anchoTrabajo = colImporte - 30 - colTrabajo

  let y = 22
  doc.setFont('helvetica', 'bold').setFontSize(16).setTextColor(0)
  doc.text(d.titulo.toUpperCase(), izq, y)
  doc.setFont('helvetica', 'normal').setFontSize(9)
  if (d.detalle) doc.text(doc.splitTextToSize(d.detalle, 70), der, y - 3, { align: 'right' })
  y += 6
  doc.setFontSize(10).setTextColor(90)
  doc.text(`Del ${ddmmaaaa(d.desde)} al ${ddmmaaaa(d.hasta)}`, izq, y)

  const encabezado = () => {
    y += 5
    doc.setDrawColor(...AZUL).setLineWidth(0.5)
    doc.line(izq, y, der, y)
    doc.line(izq, y + 1, der, y + 1)
    y += 6
    doc.setFont('times', 'bolditalic').setFontSize(13).setTextColor(...AZUL)
    doc.text('Fecha', izq + 2, y)
    doc.text('Trabajo', colTrabajo + anchoTrabajo / 2, y, { align: 'center' })
    doc.text('Importe', colImporte, y, { align: 'right' })
    doc.text('Estado', der - 2, y, { align: 'right' })
    y += 2.5
    doc.line(izq, y, der, y)
    doc.line(izq, y + 1, der, y + 1)
    y += 10
  }
  encabezado()

  for (const f of d.filas) {
    doc.setFont('helvetica', 'bold').setFontSize(10)
    const lineasCliente: string[] = doc.splitTextToSize(f.cliente, anchoTrabajo)
    doc.setFont('helvetica', 'normal').setFontSize(9)
    const lineasLugar: string[] = f.lugar ? doc.splitTextToSize(f.lugar, anchoTrabajo) : []
    const alto = lineasCliente.length * 5 + lineasLugar.length * 4.5
    if (y + alto > H - 30) {
      doc.addPage()
      y = 15
      encabezado()
    }
    doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(0)
    doc.text(ddmmaaaa(f.fecha), izq + 2, y)
    doc.text(plata(f.importe), colImporte, y, { align: 'right' })
    const cobrado = f.saldo <= 0
    doc.setFont('helvetica', cobrado ? 'normal' : 'bold').setTextColor(...(cobrado ? VERDE : ROJO))
    doc.text(estadoCobro(f.importe, f.saldo), der - 2, y, { align: 'right' })
    doc.setFont('helvetica', 'bold').setTextColor(0)
    doc.text(lineasCliente, colTrabajo, y)
    if (lineasLugar.length) {
      doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(90)
      doc.text(lineasLugar, colTrabajo, y + lineasCliente.length * 5 - 0.5)
    }
    y += alto + 6
  }

  if (d.filas.length === 0) {
    doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(120).text('No hay trabajos en este período.', izq + 2, y)
    y += 11
  }

  pieTotales(doc, y, d.filas, 'Falta cobrar')
  return doc.output('blob')
}

/** Comparte el PDF (WhatsApp, mail…) si el teléfono lo permite; si no, lo descarga. */
export async function entregarPdf(blob: Blob, nombre: string, compartir: boolean) {
  const archivo = new File([blob], nombre, { type: 'application/pdf' })
  if (compartir && navigator.canShare?.({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo], title: nombre })
      return
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export const puedeCompartirArchivos = () =>
  typeof navigator !== 'undefined' &&
  !!navigator.canShare?.({ files: [new File([''], 'x.pdf', { type: 'application/pdf' })] })
