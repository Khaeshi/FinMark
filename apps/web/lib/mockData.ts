import type { DashboardData } from '@finmark/shared'

export const MOCK_DASHBOARD: DashboardData = {
  summary: {
    totalRevenue:  '4850000.00',
    totalOrders:   284,
    activeClients: 47,
    pendingOrders: 18,
  },
  recentOrders: [
    { id: 'ord-001', clientId: 'c1', status: 'FULFILLED',  amount: '125000.00', currency: 'PHP', description: 'Q2 bulk merchandise', createdAt: new Date('2024-06-01'), updatedAt: new Date('2024-06-01') },
    { id: 'ord-002', clientId: 'c2', status: 'PROCESSING', amount: '87500.50',  currency: 'PHP', description: 'March restock',       createdAt: new Date('2024-05-28'), updatedAt: new Date('2024-05-28') },
    { id: 'ord-003', clientId: 'c3', status: 'PENDING',    amount: '230000.00', currency: 'PHP', description: 'Raw materials Q2',    createdAt: new Date('2024-05-25'), updatedAt: new Date('2024-05-25') },
    { id: 'ord-004', clientId: 'c1', status: 'FULFILLED',  amount: '55000.00',  currency: 'PHP', description: 'Office supplies',     createdAt: new Date('2024-05-20'), updatedAt: new Date('2024-05-20') },
    { id: 'ord-005', clientId: 'c4', status: 'CANCELLED',  amount: '18500.00',  currency: 'PHP', description: 'Equipment parts',     createdAt: new Date('2024-05-18'), updatedAt: new Date('2024-05-18') },
  ],
  revenueChart: [
    { date: '2023-Q3', revenue: '3200000', expenses: '2100000', profit: '1100000' },
    { date: '2023-Q4', revenue: '3800000', expenses: '2400000', profit: '1400000' },
    { date: '2024-Q1', revenue: '4100000', expenses: '2700000', profit: '1400000' },
    { date: '2024-Q2', revenue: '4850000', expenses: '3100000', profit: '1750000' },
  ],
  lastUpdated: new Date(),
}

export const MOCK_USER = {
  name: 'Michael Cruz',
  role: 'ADMIN' as const,
  email: 'mcruz@finmark.com',
}
