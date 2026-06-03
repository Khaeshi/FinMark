import { PrismaClient, UserRole, OrderStatus, SubscriptionTier } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Finmark database...')

  // seed SME clients
  const clientA = await prisma.sMEClient.upsert({
    where: { id: 'client-001' },
    update: {},
    create: {
      id: 'client-001',
      name: 'Reyes Trading Co.',
      industry: 'Retail',
      country: 'PH',
      subscriptionTier: SubscriptionTier.GROWTH,
    },
  })

  const clientB = await prisma.sMEClient.upsert({
    where: { id: 'client-002' },
    update: {},
    create: {
      id: 'client-002',
      name: 'Santos Manufacturing',
      industry: 'Manufacturing',
      country: 'PH',
      subscriptionTier: SubscriptionTier.STARTER,
    },
  })

  // seed users
  await prisma.user.upsert({
    where: { email: 'admin@finmark.com' },
    update: {},
    create: {
      cognitoId: 'cognito-superadmin-001',
      email: 'admin@finmark.com',
      name: 'Michael Cruz',
      role: UserRole.SUPERADMIN,
    },
  })

  await prisma.user.upsert({
    where: { email: 'finance@reyestrading.com' },
    update: {},
    create: {
      cognitoId: 'cognito-finance-001',
      email: 'finance@reyestrading.com',
      name: 'Ana Reyes',
      role: UserRole.FINANCE,
      clientId: clientA.id,
    },
  })

  // seed sample orders
  await prisma.order.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'order-001',
        clientId: clientA.id,
        status: OrderStatus.FULFILLED,
        amount: '125000.00',
        currency: 'PHP',
        description: 'Q1 bulk merchandise order',
      },
      {
        id: 'order-002',
        clientId: clientA.id,
        status: OrderStatus.PROCESSING,
        amount: '87500.50',
        currency: 'PHP',
        description: 'March restock',
      },
      {
        id: 'order-003',
        clientId: clientB.id,
        status: OrderStatus.PENDING,
        amount: '230000.00',
        currency: 'PHP',
        description: 'Raw materials Q2',
      },
    ],
  })

  // seed financial records
  await prisma.financial.upsert({
    where: { clientId_period: { clientId: clientA.id, period: '2024-Q1' } },
    update: {},
    create: {
      clientId: clientA.id,
      period: '2024-Q1',
      revenue: '450000.00',
      expenses: '310000.00',
      netProfit: '140000.00',
      orderCount: 18,
    },
  })

  console.log('✅ Seed complete')
  console.log(`   Clients: ${clientA.name}, ${clientB.name}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
