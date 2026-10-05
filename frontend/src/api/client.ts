/** An error response from our API, with a message that's fit to show in a toast. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type ValidationIssue = { loc?: (string | number)[]; msg?: string }

function isValidationIssue(value: unknown): value is ValidationIssue {
  return typeof value === 'object' && value !== null && 'msg' in value
}

/** FastAPI sends `{"detail": "..."}`, or a list of issues for 422 validation errors. */
function messageFromBody(body: unknown): string | null {
  if (typeof body !== 'object' || body === null || !('detail' in body)) {
    return null
  }
  const { detail } = body
  if (typeof detail === 'string') {
    return detail
  }
  if (Array.isArray(detail)) {
    const messages = detail.filter(isValidationIssue).map((issue) => {
      const field = issue.loc?.filter((part) => part !== 'body' && part !== 'query').join('.')
      return field ? `${field}: ${issue.msg}` : String(issue.msg)
    })
    return messages.length > 0 ? messages.join('; ') : null
  }
  return null
}

export type QueryParams = Record<string, string | number | boolean | null | undefined>

/** `/api/movies` + `{status: 'watchlist', genre: undefined}` → `/api/movies?status=watchlist` */
export function withQuery(path: string, params: QueryParams): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value))
    }
  }
  const query = search.toString()
  return query ? `${path}?${query}` : path
}

type ApiInit = Omit<RequestInit, 'body'> & { json?: unknown }

/** Calls a relative `/api/...` URL; sends `json` as the body and parses the JSON response. */
export async function apiFetch<T>(path: string, { json, headers, ...init }: ApiInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      ...init,
      headers: json === undefined ? headers : { 'Content-Type': 'application/json', ...headers },
      body: json === undefined ? undefined : JSON.stringify(json),
    })
  } catch {
    throw new ApiError(0, "Can't reach the server. Is the backend running?")
  }

  if (response.status === 204) {
    return undefined as T
  }

  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(response.status, messageFromBody(body) ?? `Request failed (${response.status})`)
  }
  return body as T
}
