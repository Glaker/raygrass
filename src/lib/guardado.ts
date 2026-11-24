import { useCallback, useState } from 'react'

/** Estado que se guarda en el teléfono y sobrevive a cerrar la app. */
export function useGuardado<T>(clave: string, inicial: T) {
  const [valor, setValor] = useState<T>(() => {
    try {
      const s = localStorage.getItem(clave)
      return s ? (JSON.parse(s) as T) : inicial
    } catch {
      return inicial
    }
  })
  const guardar = useCallback(
    (v: T) => {
      setValor(v)
      try {
        localStorage.setItem(clave, JSON.stringify(v))
      } catch {
        // sin lugar o modo privado: queda solo en memoria
      }
    },
    [clave],
  )
  return [valor, guardar] as const
}
