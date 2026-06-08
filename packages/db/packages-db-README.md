# packages/db — Database Package

Manages the PostgreSQL database schema, Prisma client, migrations, and seed data for the FinMark platform.

---

## Purpose

- Single Prisma schema used by all backend services
- Manages database migrations in a controlled, versioned way
- Provides a typed Prisma client singleton imported by any service that needs DB access
- Contains seed data for local development

---

## Tech Stack

| Tool | Purpose |
|---|---|
| Prisma ORM | Schema definition, migrations, typed client |
| PostgreSQL | Relational database |
| Neon | Serverless PostgreSQL for prototype/dev |
| AWS RDS | Production PostgreSQL with read replica |

---

## Contents

```
packages/db/
├── prisma/
│   ├── schema.prisma             all models, enums, relations
│   └── migrations/
│       └── 002_materialized_views.sql   pre-computed dashboard views
├── src/
│   ├── client.ts                 Prisma singleton — import this in services
│   └── seed.ts                   sample PH SME data for local dev
├── package.json
└── tsconfig.json
```

---

## Database Models

| Model | Purpose |
|---|---|
| `SMEClient` | FinMark's SME clients across SEA |
| `User` | Platform users with roles (linked to Cognito) |
| `Order` | Order lifecycle per client |
| `Financial` | Quarterly financial records per client |
| `Product` | Product catalog |
| `Feedback` | Client feedback submissions |
| `AuditLog` | Immutable audit trail — never update or delete rows |

---

## Setup

```bash
cd packages/db

# generate Prisma client from schema
npx prisma generate

# run migrations (requires DATABASE_URL in .env)
npx prisma migrate dev --name init

# seed with sample data
npm run db:seed

# open Prisma Studio (visual DB browser)
npm run db:studio
```

---

## Using the Client in Services

```typescript
import { prisma } from '@finmark/db'

const orders = await prisma.order.findMany({
  where: { clientId: 'client-001' },
  orderBy: { createdAt: 'desc' },
  take: 10,
})
```

The client is a singleton — it reuses the same connection pool across all imports. Never instantiate `new PrismaClient()` directly in a service.

---

## Financial Amounts

All monetary fields use `Decimal @db.Decimal(18, 2)` in the schema — never `Float`. When reading from Prisma, convert to string before using:

```typescript
amount: order.amount.toString()
```

---

## Materialized Views

`migrations/002_materialized_views.sql` creates pre-computed views that power the dashboard:

| View | Purpose |
|---|---|
| `mv_financial_summary` | Per-client financial data by period |
| `mv_order_counts` | Order status counts per client |
| `mv_dashboard_summary` | Superadmin overview across all clients |

These are refreshed every 2 minutes by the `report-svc` scheduler. Run the SQL manually after your first migration:

```bash
psql $DATABASE_URL -f prisma/migrations/002_materialized_views.sql
```

---

## Schema Changes

If you need to change the schema:
1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name describe-your-change`
3. Run `npx prisma generate`
4. Update seed data in `src/seed.ts` if needed
5. Open a PR — schema changes affect all services

Do not edit migration files manually after they have been committed.
