import { plata } from './format'

export interface FilaInforme {
  fecha: string
  trabajo: string
  importe: number
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

/** Arma el PDF con el formato de los informes que se le mandan a los clientes. */
export async function generarInforme(d: DatosInforme): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const izq = 20
  const der = W - 20
  const colTrabajo = izq + 30
  const anchoTrabajo = der - 40 - colTrabajo

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
    doc.text('Importe', der - 2, y, { align: 'right' })
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
    doc.text(plata(f.importe), der - 2, y, { align: 'right' })
    y += Math.max(1, lineas.length) * 5 + 6
  }

  if (d.filas.length === 0) {
    doc.setTextColor(120).text('No hay trabajos en este período.', izq + 2, y)
    y += 11
  }

  if (y > H - 25) {
    doc.addPage()
    y = 20
  }
  y -= 2
  doc.setDrawColor(160).setLineWidth(0.3).line(izq - 4, y, der + 6, y)
  y += 6
  const total = plata(d.filas.reduce((s, f) => s + f.importe, 0))
  doc.setFont('times', 'bolditalic').setFontSize(11).setTextColor(0)
  doc.text('Suma total', izq - 4, y)
  doc.setFont('times', 'bold').setFontSize(13)
  const ancho = doc.getTextWidth(total) + 3
  doc.text(total, der + 4.5, y, { align: 'right' })
  doc.setDrawColor(0).setLineWidth(0.4).rect(der + 6 - ancho - 0.5, y - 4.8, ancho, 6.5)

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
