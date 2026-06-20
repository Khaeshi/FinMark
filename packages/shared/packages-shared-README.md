# packages/shared — Shared Package

Contains all TypeScript types, utility functions, and constants shared across the entire FinMark platform. Both the frontend (`apps/web`) and all backend services import from here.

---

## Purpose

A single source of truth for:
- TypeScript interfaces and types
- Financial math utilities
- Structured logging
- Role and permission constants

If a type or utility is used in more than one place, it belongs here.

---

## Contents

```
packages/shared/src/
├── types/
│   └── index.ts      Order, User, DashboardData, ApiResponse, etc.
├── utils/
│   ├── decimal.ts    Financial math — BigInt cents, no floats
│   └── logger.ts     Structured JSON logger for all services
├── constants/
│   └── roles.ts      ROLE_PERMISSIONS, hasPermission(), canAccessFinancials()
└── index.ts          Barrel export — import everything from '@finmark/shared'
```

---

## Usage

```typescript
import type { Order, DashboardData, UserRole } from '@finmark/shared'
import { addAmounts, formatCurrency } from '@finmark/shared'
import { createLogger } from '@finmark/shared'
import { hasPermission, ROLES } from '@finmark/shared'
```

---

## Financial Math — Critical Rule

Never use JavaScript floating point for money. Use the `decimal.ts` utilities:

```typescript
import { addAmounts, subtractAmounts, formatCurrency } from '@finmark/shared'

// correct — uses BigInt cents internally
const total = addAmounts('1250.50', '340.20')  // → '1590.70'

// wrong — float precision errors
const total = 1250.50 + 340.20  // → 1590.6999999999998
```

---

## Logger

Every service should create a logger scoped to its name:

```typescript
import { createLogger } from '@finmark/shared'

const logger = createLogger('order-svc')

logger.info('Order created', { orderId, clientId })
logger.error('DB query failed', error)
logger.warn('Cache miss', { key })
```

Output is structured JSON — parseable by AWS CloudWatch automatically.

---

## Role Permissions

```typescript
import { hasPermission, canAccessFinancials, ROLES } from '@finmark/shared'

hasPermission('FINANCE', 'reports')       // true
hasPermission('VIEWER', 'orders')         // false
canAccessFinancials('ANALYST')            // true
```

---

## Adding New Types

If you need a new shared type:
1. Add it to `src/types/index.ts`
2. Export it from `src/index.ts` if not already covered by the wildcard
3. Run `npm run build` in `packages/shared/` to verify no errors
4. Open a PR — type changes affect the whole platform
