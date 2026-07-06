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

/**
 * Auth
 * @param email 
 * @param password 
 * @returns 
 */

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

/**
 * Dashboard
 * @param token 
 * @returns 
 */

export async function fetchDashboard(token: string): Promise<DashboardData> {
  const res = await apiFetch<ApiResponse<DashboardData>>('/dashboard', {}, token)
  if (!res.data) throw new Error('No dashboard data returned')
  return res.data
}

/**
 * Orders
 * @param token 
 * @param params 
 * @returns 
 */

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

/**
 * Clients
 * @param token
 * @returns
 */

export interface SMEClient {
  id:               string
  name:             string
  industry:         string
  country:          string
  subscriptionTier: string
  isActive:         boolean
  createdAt:        string
  _count?: { users: number; orders: number }
}

export async function fetchClients(token: string): Promise<{ data: SMEClient[]; total: number }> {
  const res = await apiFetch<ApiResponse<SMEClient[]> & { total?: number }>('/admin/clients', {}, token)
  return { data: res.data || [], total: res.total ?? (res.data?.length || 0) }
}

/**
 * Reports
 * @param token
 * @returns
 */

export interface FinancialRecord {
  id:          string
  clientId:    string
  period:      string
  revenue:     string
  expenses:    string
  netProfit:   string
  orderCount:  number
  client?:     { name: string; industry: string }
}

export async function fetchFinancialReports(token: string): Promise<FinancialRecord[]> {
  const res = await apiFetch<ApiResponse<FinancialRecord[]>>('/reports/financials', {}, token)
  return res.data || []
}
