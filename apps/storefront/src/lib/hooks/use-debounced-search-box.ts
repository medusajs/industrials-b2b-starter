import { useCallback, useEffect, useRef, useState } from "react"
import { useSearchBox } from "react-instantsearch"

const DEBOUNCE_MS = 250

export const useDebouncedSearchBox = () => {
  const timer = useRef<number | undefined>(undefined)

  const queryHook = useCallback(
    (nextQuery: string, search: (value: string) => void) => {
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => search(nextQuery), DEBOUNCE_MS)
    },
    []
  )

  const { query, refine, clear } = useSearchBox({ queryHook })
  const [inputValue, setInputValue] = useState(query)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const setValue = useCallback(
    (nextValue: string) => {
      setInputValue(nextValue)
      refine(nextValue)
    },
    [refine]
  )

  const reset = useCallback(() => {
    window.clearTimeout(timer.current)
    setInputValue("")
    clear()
  }, [clear])

  const trimmedInput = inputValue.trim()
  const trimmedQuery = query.trim()

  return {
    inputValue,
    setValue,
    reset,
    query: trimmedQuery,
    hasInput: Boolean(trimmedInput),
    isPending: trimmedInput !== trimmedQuery,
  }
}

export default useDebouncedSearchBox
