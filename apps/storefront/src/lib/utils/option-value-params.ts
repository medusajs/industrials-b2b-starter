/**
 * Query-string key under which selected global product option-value IDs are
 * stored in the URL.
 */
export const OPTION_VALUE_QUERY_KEY = "optionValueIds"

type ServerSearchParams = Record<string, string | string[] | undefined>

/**
 * Parses selected option-value IDs from either a `URLSearchParams` instance
 * (client-side) or a plain searchParams record (server-side / loader).
 * Supports comma-separated string fallback. Returns a deduped string array.
 */
export const parseOptionValueIds = (
  input: URLSearchParams | ServerSearchParams | null | undefined
): string[] => {
  if (!input) return []

  let raw: string[] = []

  if (typeof URLSearchParams !== "undefined" && input instanceof URLSearchParams) {
    raw = input.getAll(OPTION_VALUE_QUERY_KEY)
    if (raw.length === 0) {
      const single = input.get(OPTION_VALUE_QUERY_KEY)
      if (single) raw = [single]
    }
  } else {
    const value = (input as ServerSearchParams)[OPTION_VALUE_QUERY_KEY]
    if (Array.isArray(value)) {
      raw = value
    } else if (typeof value === "string") {
      raw = [value]
    }
  }

  const flattened = raw.flatMap((part) =>
    typeof part === "string" ? part.split(",") : []
  )

  const cleaned = flattened.map((v) => v.trim()).filter(Boolean)
  return Array.from(new Set(cleaned))
}
