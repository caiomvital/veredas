export type ActionResult<T> = { data: T | null; error: string | null }

export function ok<T>(data: T): ActionResult<T> {
  return { data, error: null }
}

export function fail<T>(error: string): ActionResult<T> {
  return { data: null, error }
}
