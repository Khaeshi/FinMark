import type { UserRole } from '../types/index.ts'

export const ROLES = {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  FINANCE: 'FINANCE',
  OPERATIONS: 'OPERATIONS',
  ANALYST: 'ANALYST',
  VIEWER: 'VIEWER',
} as const

// what each role can access on the dashboard
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPERADMIN:  ['*'],  // everything
  ADMIN:       ['dashboard', 'orders', 'reports', 'analytics', 'users'],
  FINANCE:     ['dashboard', 'reports', 'analytics'],
  OPERATIONS:  ['dashboard', 'orders'],
  ANALYST:     ['dashboard', 'analytics', 'reports'],
  VIEWER:      ['dashboard'],
}

export function hasPermission(role: UserRole, resource: string): boolean {
  const permissions = ROLE_PERMISSIONS[role]
  return permissions.includes('*') || permissions.includes(resource)
}

export function canAccessFinancials(role: UserRole): boolean {
  return ['SUPERADMIN', 'ADMIN', 'FINANCE', 'ANALYST'].includes(role)
}

export function canManageUsers(role: UserRole): boolean {
  return ['SUPERADMIN', 'ADMIN'].includes(role)
}

export function canViewOrders(role: UserRole): boolean {
  return ['SUPERADMIN', 'ADMIN', 'OPERATIONS'].includes(role)
}
