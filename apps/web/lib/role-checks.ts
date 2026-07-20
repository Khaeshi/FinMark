import type { UserRole } from '@finmark/shared'
import {
  canManageUsers,
  canViewOrders,
  canAccessFinancials,
} from '@finmark/shared'

export function canCreateOrders(role?: UserRole | null): boolean {
  return !!role && canViewOrders(role)
}

export function canManageClients(role?: UserRole | null): boolean {
  return !!role && canManageUsers(role)
}

export function canManageFinancials(role?: UserRole | null): boolean {
  return !!role && (role === 'SUPERADMIN' || role === 'ADMIN' || role === 'FINANCE')
}

export function canViewFinancialColumns(role?: UserRole | null): boolean {
  return !!role && canAccessFinancials(role)
}

export function canAccessUsersPage(role?: UserRole | null): boolean {
  return !!role && canManageUsers(role)
}

export function isSuperAdmin(role?: UserRole | null): boolean {
  return role === 'SUPERADMIN'
}

export const INDUSTRIES = [
  'Retail',
  'Manufacturing',
  'Logistics',
  'Technology',
  'Healthcare',
  'Hospitality',
  'Agriculture',
  'Finance',
  'Other',
] as const

export const SUBSCRIPTION_TIERS = ['FREE', 'STARTER', 'GROWTH', 'ENTERPRISE'] as const

export const USER_ROLES: UserRole[] = [
  'SUPERADMIN',
  'ADMIN',
  'FINANCE',
  'OPERATIONS',
  'ANALYST',
  'VIEWER',
]

export const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING:    ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:  ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['FULFILLED', 'CANCELLED'],
  FULFILLED:  ['REFUNDED'],
  CANCELLED:  [],
  REFUNDED:   [],
}
