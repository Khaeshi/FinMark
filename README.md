# FinMark — Project Finer

> A scalable, cloud-native SaaS platform built for FinMark, a data-driven financial services company supporting small and medium enterprises (SMEs) across Southeast Asia. Developed as a team academic project for the Platform Technologies course, demonstrating modern microservice architecture, collaborative Git workflows, and AWS-integrated backend design.

---

## Background

FinMark's existing dashboard takes **20 seconds to load** when accessed by all 200 employees simultaneously — causing reporting delays, workflow bottlenecks, and missed intervention opportunities. Project Finer is the solution: a fast, scalable, and role-aware platform targeting **sub-3-second dashboard load times** even under peak concurrency.

---

## Project Objectives

- Design and implement a production-grade microservice architecture on AWS
- Solve the 20-second dashboard problem using Redis caching and PostgreSQL materialized views
- Apply role-based access control so each user only fetches data relevant to their role
- Demonstrate service-oriented development with shared packages across all services
- Practice collaborative Git workflows within a multidisciplinary team
- Implement testing across unit, integration, E2E, and network simulation layers

---

## System Architecture

The platform follows a layered microservice architecture:

```
Customers/Users
      ↓
    CDN (CloudFront)          — edge caching, DDoS protection
      ↓
    WAF                       — OWASP rules, bot detection
      ↓
  Frontend Cluster            — Next.js, auto-scaled (3 replicas)
      ↓
  Load Balancer               — backend traffic distribution
      ↓
  API Gateway                 — authentication, rate limiting, validation
      ↓
  Microservices Layer         — UserAuth, Order, Report, Product, Admin, Feedback
      ↓
  Redis Cache Layer           — AdminSvc + ReportSvc cache (ElastiCache)
      ↓
  Database Cluster            — Primary SQL, Read Replica, Backup (AWS RDS)
      ↓
  Monitoring & Logging        — Alerts, Metrics, Error Tracking
```

### Architecture Diagram

> See `/docs/images/system-architecture.png`

---

## Repository Structure

```
finmark/
├── apps/
│   └── web/                  Next.js frontend (dashboard UI)
│
├── services/
│   ├── api-gateway/          Authentication, rate limiting, service proxy
│   ├── user-auth-svc/        AWS Cognito auth + session management
│   ├── order-svc/            Order lifecycle + SQS producer
│   ├── report-svc/           Dashboard data, Redis cache, materialized views
│   ├── product-svc/          Product catalog + SQS consumer
│   ├── admin-svc/            User management, config, permissions
│   └── feedback-svc/         SME client feedback
│
├── packages/
│   ├── shared/               Shared TypeScript types, utilities, logger
│   ├── db/                   Prisma schema, migrations, seed data
│   └── aws/                  AWS SDK wrappers (Cognito, SQS, KMS, Secrets)
│
├── infra/
│   ├── aws/                  Terraform configs (RDS, ElastiCache, Cognito, WAF)
│   └── docker/               Docker Compose for local development
│
├── tests/
│   ├── unit/                 Jest unit tests
│   ├── integration/          API + cache integration tests
│   ├── e2e/                  Playwright tests (4G/5G network simulation)
│   └── load/                 k6 load tests (200 concurrent users)
│
├── .env.example              Environment variable template
├── package.json              Monorepo root (npm workspaces)
├── turbo.json                Turborepo build pipeline
├── CONTRIBUTING.md
└── README.md
```

---

## Technology Stack

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 16 | React framework, SSR, App Router |
| TypeScript | Type safety across all components |
| Tailwind CSS 4 | Utility-first styling |
| Recharts | Dashboard data visualizations |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | Microservice runtime |
| TypeScript | End-to-end type safety |
| Prisma ORM | PostgreSQL client + migrations |
| Zod | Runtime schema validation |
| ioredis | Redis cache client |

### Database & Caching
| Technology | Purpose |
|---|---|
| PostgreSQL (AWS RDS) | Primary relational database |
| Neon | Serverless PostgreSQL for prototype |
| Redis (AWS ElastiCache) | Dashboard and report caching |
| Materialized Views | Pre-computed dashboard queries |

### AWS Services
| Service | Purpose |
|---|---|
| Cognito | User authentication + MFA |
| CloudFront | CDN + edge caching |
| WAF | Web application firewall |
| SQS | Async message queue between services |
| KMS | Encryption key management |
| Secrets Manager | Secure credential storage |
| RDS PostgreSQL | Managed database with read replica |
| ElastiCache | Managed Redis |

### Tooling
| Tool | Purpose |
|---|---|
| Turborepo | Monorepo build orchestration |
| npm Workspaces | Package linking across monorepo |
| Jest | Unit and integration testing |
| Playwright | E2E and network simulation testing |
| k6 | Load testing (200 concurrent users) |
| Docker Compose | Local development environment |

---

## Team Roles

| Role | Responsibility | Primary Area |
|---|---|---|
| **Khael** (Lead) | Architecture, backend services, AWS wiring, monorepo setup | `services/`, `packages/`, `infra/` |
| **Frontend 1** | Dashboard UI, component design, layout | `apps/web/components/` |
| **Frontend 2** | Page routes, data integration, responsive design | `apps/web/app/` |
| **Frontend 3** | Styling system, design tokens, UX polish | `apps/web/` (CSS, Tailwind) |
| **Frontend 4** | Testing, Playwright E2E specs, UI bug fixes | `tests/e2e/` |

> Frontend contributors — read `apps/web/README.md` before starting.

---

## Getting Started

### Prerequisites

```bash
Node.js >= 20
npm >= 10
Git >= 2.40
Docker >= 24 (optional, for local Redis/Postgres)
```

### Clone and Install

```bash
git clone <repository-url>
cd finmark
npm install
```

> `npm install` at the root installs all workspace packages at once due to npm workspaces.

### Environment Setup

```bash
cp .env.example .env
```

Fill in the required values. At minimum for local development:
- `DATABASE_URL` — your Neon or local PostgreSQL connection string
- `REDIS_URL` — local Redis (default: `redis://localhost:6379`)
- `NEXTAUTH_SECRET` — any random string locally

### Database Setup

```bash
cd packages/db
npx prisma generate       # generate Prisma client
npx prisma migrate dev    # run migrations
npm run db:seed           # seed sample data
```

### Start Development

```bash
# from root — starts all apps and services in parallel
npm run dev
```

Or run individually:
```bash
cd apps/web && npm run dev          # frontend at localhost:3000
cd services/api-gateway && npm run dev   # gateway at localhost:4000
cd services/report-svc && npm run dev    # report service at localhost:4003
```

---

## Development Workflow

### Branch Strategy

```
main                    — stable, protected
└── feature/[name]      — all development work
└── fix/[name]          — bug fixes
```

### Step-by-Step

```bash
# 1. always start from latest main
git checkout main
git pull origin main

# 2. create your branch
git checkout -b feature/your-feature-name

# 3. make changes, commit often
git add .
git commit -m "feat(dashboard): add revenue chart component"

# 4. push and open pull request
git push origin feature/your-feature-name
```

### Commit Message Format

```
feat(scope):    new feature
fix(scope):     bug fix
style(scope):   styling only, no logic change
refactor(scope): code restructure
test(scope):    adding or updating tests
docs(scope):    documentation only
chore(scope):   config, deps, tooling
```

Examples:
```bash
feat(dashboard): add MetricCard component with trend indicator
fix(report-svc): resolve null description type error
style(sidebar): update active nav item highlight color
docs(web): add component contribution guide
```

---

## Running Tests

```bash
npm run test              # all unit + integration tests
npm run test:e2e          # Playwright E2E tests
npm run lint              # ESLint across all packages
```

Load test (requires k6 installed):
```bash
k6 run tests/load/k6/dashboard.js
```

---

## Coding Standards

### Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Components | PascalCase | `MetricCard.tsx` |
| Functions | camelCase | `getDashboardData()` |
| Variables | camelCase | `totalRevenue` |
| Constants | UPPER_CASE | `CACHE_KEYS` |
| Folders | kebab-case | `report-svc/` |
| Branches | kebab-case | `feature/order-table` |
| CSS classes | Tailwind utilities | `bg-emerald-400` |

### TypeScript Rules

- Never use `any` — use `unknown` and narrow the type, the specific is better
- Always use `Decimal` (never `number` or `float`) for financial amounts
- Import shared types from `@finmark/shared`, never redefine them locally
- Enable strict mode — it is already configured in all `tsconfig.json` files

### Financial Data Rule

```typescript
// NEVER do this with money
const total = 1250.50 + 340.20  // float precision errors

// ALWAYS use the shared decimal utility
import { addAmounts } from '@finmark/shared'
const total = addAmounts('1250.50', '340.20')
```

---

## Documentation

Each major folder has its own README:

| File | Covers |
|---|---|
| `apps/web/README.md` | Frontend setup, components, design system, contribution guide for UI team |
| `services/README.md` | Microservice overview, ports, inter-service communication |
| `packages/shared/README.md` | Shared types, utilities, how to extend |
| `packages/db/README.md` | Schema, migrations, seeding, Prisma usage |
| `infra/README.md` | AWS setup, Terraform, Docker Compose |

---

## Academic Information

| | |
|---|---|
| **Course** | Platform Technologies |
| **Project** | Project Finer — FinMark Platform |
| **Team Size** | 5 members |
| **Architecture** | Microservices, Cloud-Native, MonoRepo |
| **Methodology** | Git-Based Collaborative Development |

## 👥 Team Members & Roles

This project is a collaborative effort by the following team members:


| Name | Role | Core Responsibilities | GitHub / Contact |
| :--- | :--- | :--- | :--- |
| **Khaesey Angel Tablante** | Backend / <br>MS2 Build Lead | Sprint planning, timeline tracking (Gantt), and integration review | [@Khaeshi](https://github.com/Khaeshi) |
| **Dorin Castillo** | QA Engineer / <br>MS3 Lead | Day-to-day test automation, bug tracking, and final deployment verification. **Milestone 3 Lead which evaluate, audit, and sign off on the entire project build.** | [@grahamcrackers123](https://github/Denise) |
| **Mikko Jerome Bautista** | Lead UX Designer | User research, journey mapping, wireframing, and accessibility compliance (WCAG) | [@](https://github) |
| **Denise Claire Monghit** | Software Documentor / Presenter | Technical documentation, API reference guides, user manuals, and final project presentations. | [@](https://github) |
| **Christian John Batuigas** | Lead AWS Architecture / MS1 Lead | High-fidelity mockups, Design System management, component styling, and asset export. | [@](https://github) |
| **John Wilberth Botin** | Network/Cyber Security Specialist | | [@](https://github.com) |

---

## License

This project is for **academic and educational purposes only**. See `LICENSE` for details.
