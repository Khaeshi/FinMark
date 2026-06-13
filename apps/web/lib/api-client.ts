import type { ApiResponse, DashboardData, Order, PaginatedResponse } from '@finmark/shared'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true'

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${res.status}`)
  }

  return res.json()
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function loginRequest(email: string, password: string) {
  // use dev-login endpoint in development — no Cognito needed
  const endpoint = process.env.NODE_ENV !== 'production'
    ? '/auth/dev-login'
    : '/auth/login'

  const res = await apiFetch<ApiResponse<{
    accessToken:  string
    idToken:      string
    refreshToken: string
    expiresIn:    number
    user: {
      id:        string
      email:     string
      name:      string
      role:      string
      clientId?: string
    }
  }>>(endpoint, {
    method: 'POST',
    body:   JSON.stringify({ email, password }),
  })

  return res.data!
}

export async function refreshTokenRequest(refreshToken: string) {
  const res = await apiFetch<ApiResponse<{
    accessToken: string
    idToken:     string
    expiresIn:   number
  }>>('/auth/refresh', {
    method: 'POST',
    body:   JSON.stringify({ refreshToken }),
  })
  return res.data!
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function fetchDashboard(token: string): Promise<DashboardData> {
  const res = await apiFetch<ApiResponse<DashboardData>>('/dashboard', {}, token)
  if (!res.data) throw new Error('No dashboard data returned')
  return res.data
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function fetchOrders(
  token: string,
  params?: { page?: number; limit?: number; status?: string }
): Promise<PaginatedResponse<Order>> {
  const query = new URLSearchParams()
  if (params?.page)   query.set('page',   String(params.page))
  if (params?.limit)  query.set('limit',  String(params.limit))
  if (params?.status) query.set('status', params.status)

  const res = await apiFetch<ApiResponse<PaginatedResponse<Order>>>(
    `/orders?${query.toString()}`, {}, token
  )
  if (!res.data) throw new Error('No orders data returned')
  return res.data
}
