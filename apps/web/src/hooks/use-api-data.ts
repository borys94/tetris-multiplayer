import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { errorMessage } from '../core/api/errors'

export interface ApiDataOptions {
  /** Pobieramy tylko, gdy widok jest widoczny; każde ponowne wejście pobiera od nowa. */
  enabled?: boolean
  /** Zmiana klucza (np. id konta) pobiera dane od nowa. */
  key?: unknown
  /** Odpytywanie co tyle ms, póki `enabled`. */
  refreshMs?: number
}

export interface ApiData<T> {
  data: T | null
  error: string | null
  setData: Dispatch<SetStateAction<T | null>>
  setError: Dispatch<SetStateAction<string | null>>
}

/**
 * Dane z API dla widoku: pobranie przy wejściu (i opcjonalnie co `refreshMs`), komunikat
 * błędu dla gracza i ignorowanie odpowiedzi, które przyszły po opuszczeniu widoku.
 */
export const useApiData = <T>(
  load: () => Promise<T>,
  { enabled = true, key, refreshMs }: ApiDataOptions = {},
): ApiData<T> => {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const latest = useRef(load)
  useLayoutEffect(() => {
    latest.current = load
  })

  useEffect(() => {
    if (!enabled) {
      return
    }
    let cancelled = false
    const fetchData = () =>
      latest.current().then(
        (value) => {
          if (cancelled) {
            return
          }
          setData(value)
          setError(null)
        },
        (err: unknown) => !cancelled && setError(errorMessage(err)),
      )
    void fetchData()
    const timer = refreshMs ? window.setInterval(() => void fetchData(), refreshMs) : undefined
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [enabled, key, refreshMs])

  return { data, error, setData, setError }
}
