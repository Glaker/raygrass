export type TipoParque = 'quinta' | 'cancha' | 'parque' | 'terreno' | 'otro'
export type TipoTrabajo = 'corte' | 'particular'
export type Categoria = 'combustible' | 'reparacion' | 'repuestos' | 'empleado' | 'otros'

export interface Cliente {
  id: string
  nombre: string
  telefono: string | null
  notas: string | null
  created_at: string
}

export interface Parque {
  id: string
  cliente_id: string
  nombre: string
  tipo: TipoParque
  direccion: string | null
  precio: number
  tamano_m2: number | null
  tiempo_min: number | null
  notas: string | null
  activo: boolean
  created_at: string
}

/** Fila de la vista trabajos_estado: el trabajo con lo pagado y el saldo calculados. */
export interface Trabajo {
  id: string
  cliente_id: string
  parque_id: string | null
  tipo: TipoTrabajo
  fecha: string
  descripcion: string | null
  importe: number
  created_at: string
  pagado: number
  saldo: number
}

export interface Pago {
  id: string
  cliente_id: string
  trabajo_id: string | null
  fecha: string
  monto: number
  notas: string | null
  created_at: string
}

export interface Gasto {
  id: string
  fecha: string
  categoria: Categoria
  monto: number
  descripcion: string | null
  created_at: string
}

export const TIPOS_PARQUE: Record<TipoParque, string> = {
  quinta: 'Quinta',
  cancha: 'Cancha',
  parque: 'Parque',
  terreno: 'Terreno',
  otro: 'Otro',
}

export const CATEGORIAS: Record<Categoria, string> = {
  combustible: 'Combustible',
  reparacion: 'Reparación',
  repuestos: 'Repuestos e insumos',
  empleado: 'Empleado',
  otros: 'Otros',
}
