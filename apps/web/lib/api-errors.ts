export const PERMISSION_DENIED_MESSAGE =
  'You do not have admin clearance.'

export function getApiErrorMessage(
  status: number,
  body?: { error?: string }
): string {
  if (status === 403) return PERMISSION_DENIED_MESSAGE

  const serverError = body?.error?.trim()
  if (serverError?.toLowerCase().includes('insufficient permissions')) {
    return PERMISSION_DENIED_MESSAGE
  }

  if (serverError) return serverError
  if (status === 401) return 'Your session has expired. Please sign in again.'
  return `Request failed (HTTP ${status})`
}

export async function parseApiResponseError(res: Response): Promise<string> {
  const body = await res.json().catch(() => ({} as { error?: string }))
  return getApiErrorMessage(res.status, body)
}

export function isPermissionDenied(error: string | null | undefined): boolean {
  return error === PERMISSION_DENIED_MESSAGE
}
