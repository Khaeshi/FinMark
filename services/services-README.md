# services/ — FinMark Microservices

This folder contains all backend microservices for the FinMark platform. Each service is an independent Node.js + Express application with its own dependencies, port, and responsibility.

---

## Overview

| Service | Port | Responsibility |
|---|---|---|
| `api-gateway` | 4000 | Entry point for all API traffic — auth, rate limiting, proxy |
| `user-auth-svc` | 4001 | AWS Cognito integration, session management |
| `order-svc` | 4002 | Order lifecycle, SQS message producer |
| `report-svc` | 4003 | Dashboard data, Redis cache, materialized view refresh |
| `product-svc` | 4004 | Product catalog, SQS message consumer |
| `admin-svc` | 4005 | User management, permissions, config |
| `feedback-svc` | 4006 | SME client feedback collection |

All external requests enter through `api-gateway` only. Services never communicate directly with each other — they use the SQS message queue for async operations.

---

## Architecture

```
Frontend (Next.js)
      ↓
api-gateway :4000      ← validates JWT, applies rate limits, routes to service
      ↓
┌─────────────────────────────────────┐
│user-auth-svc  order-svc  report-svc │
└─────────────────────────────────────┘
      ↓                    ↓
   PostgreSQL          Redis Cache
   (AWS RDS)           (ElastiCache)
```

---

## Each Service Structure

```
service-name/
├── src/
│   ├── controllers/    request handlers — thin, delegate to services
│   ├── services/       business logic
│   ├── routes/         Express route definitions
│   ├── middleware/     service-specific middleware
│   └── index.ts        Express entry point
├── package.json
└── tsconfig.json
```

---

## Shared Packages

All services import from the shared monorepo packages:

```typescript
import { createLogger } from '@finmark/shared'       // structured logging
import type { Order, UserRole } from '@finmark/shared' // shared types
import { prisma } from '@finmark/db'                   // database client
import { sqsClient } from '@finmark/aws'               // AWS SDK wrappers
```

Never redefine types or utilities that already exist in `@finmark/shared`.

---

## Key Rules

- Every route must be authenticated via the API gateway — services trust the `x-user-*` headers injected by the gateway
- Financial amounts are always `Decimal` (string), never JavaScript `number`
- Every service must implement a `/health` endpoint
- Use `createLogger` from `@finmark/shared` for all logging — structured JSON for CloudWatch
- Async operations between services (e.g. order created → update product stock) go through SQS, never direct HTTP calls

---

## Running Services Locally

```bash
# from repo root — starts all services
npm run dev

# or individually
cd services/report-svc
npm run dev
```

---

## report-svc — The Critical Service

The `report-svc` is the most important service for performance. It directly solves the 20-second dashboard problem through:

1. **Cache-first strategy** — checks Redis before querying the database
2. **Materialized views** — pre-computed PostgreSQL views refresh every 2 minutes
3. **Parallel queries** — `Promise.all()` for simultaneous data fetching
4. **Role-aware data** — returns only what the user's role needs

Response time targets:
- Cache hit: `< 50ms`
- Cache miss (materialized view): `< 500ms`
- Full rebuild: `< 2000ms`
