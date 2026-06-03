/**
 * User Auth
 */

export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'FINANCE' | 'OPERATIONS' | 'ANALYST' | 'VIEWER'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  clientId?: string // which SME client this user belongs to
}

export interface JwtPayload {
  sub: string       // user id
  email: string
  role: UserRole
  clientId?: string
  iat: number
  exp: number
}

/**
 * SME Client
 */

export interface SMEClient {
  id: string
  name: string
  industry: string
  country: string
  isActive: boolean
  createdAt: Date
}


/**
 * Orders
 */

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'FULFILLED'
  | 'CANCELLED'
  | 'REFUNDED'

export interface Order {
  id: string
  clientId: string
  status: OrderStatus
  amount: string        // always string for Decimal — never number
  currency: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Financial
 */

export interface FinancialSummary {
  clientId: string
  period: string        // e.g. "2024-Q1"
  totalRevenue: string  // Decimal as string
  totalExpenses: string
  netProfit: string
  orderCount: number
  generatedAt: Date
}

export interface RevenueMetric {
  date: string
  revenue: string
  expenses: string
  profit: string
}

/**
 * Dashboard
 */

export interface DashboardData {
  summary: {
    totalRevenue: string
    totalOrders: number
    activeClients: number
    pendingOrders: number
  }
  recentOrders: Order[]
  revenueChart: RevenueMetric[]
  lastUpdated: Date
}

/**
 * API Responses
 */

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

/**
 * Service Health
 */

export interface HealthCheck {
  service: string
  status: 'healthy' | 'degraded' | 'down'
  latency?: number
  timestamp: Date
}
