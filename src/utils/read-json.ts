/**
 * Reads a response body as the given type, so tests work with typed data instead of `any`.
 * Works for API responses and for browser responses captured with page.waitForResponse.
 */
export async function readJson<T>(response: { json(): Promise<unknown> }): Promise<T> {
  return (await response.json()) as T;
}
