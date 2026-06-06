# Contributing to FinMark — Project Finer

Thank you for being part of the team. This guide covers everything you need to contribute correctly, avoid breaking other people's work, and keep the codebase consistent.

Read this fully before making your first commit.

---

## Table of Contents

- [Who Does What](#who-does-what)
- [Before You Start](#before-you-start)
- [Git Workflow](#git-workflow)
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)
- [Frontend Contribution Guide](#frontend-contribution-guide)
- [Backend Contribution Guide](#backend-contribution-guide)
- [Coding Standards](#coding-standards)
- [What Not to Do](#what-not-to-do)

---

## Who Does What

| Member | Area | Folders |
|---|---|---|
| **Khael** | Architecture, backend, AWS, DB | `services/`, `packages/`, `infra/` |
| **Frontend 1** | Dashboard components, UI design | `apps/web/components/` |
| **Frontend 2** | Page routes, data wiring | `apps/web/app/` |
| **Frontend 3** | Styling, design tokens, polish | `apps/web/` (CSS, Tailwind config) |
| **Frontend 4** | Testing, E2E specs, bug fixes | `tests/e2e/`, `apps/web/` |

If you are unsure whether something falls in your area, ask Khael before creating a branch.

---

## Before You Start

### 1. Clone and install

```bash
git clone <repository-url>
cd finmark
npm install
```

### 2. Copy environment file

```bash
cp .env.example .env
```

Ask Khael for the actual values for `DATABASE_URL`, `REDIS_URL`, and any AWS keys needed locally.

### 3. Verify your setup works

```bash
npm run dev
```

The frontend should be running at `http://localhost:3000` before you write any code.

---

## Git Workflow

### Branch from main every time

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

Never branch from someone else's feature branch unless explicitly told to.

### Branch naming

```
feature/[what-you-are-building]
fix/[what-you-are-fixing]
style/[visual-change-description]
docs/[documentation-update]
```

Examples:
```
feature/metric-card-component
feature/orders-page-layout
fix/sidebar-active-link-highlight
style/dashboard-dark-theme-polish
docs/web-component-guide
```

### Keep branches small and focused

One branch = one task. Do not bundle multiple unrelated changes into one branch. If you are building a chart component and also fixing a button color, those are two separate branches.

### Sync with main regularly

If your branch is open for more than a day, pull the latest main into it:

```bash
git checkout feature/your-branch
git fetch origin
git merge origin/main
```

Resolve any conflicts before opening your pull request.

---

## Commit Messages

Follow this format exactly:

```
type(scope): short description
```

### Types

| Type | When to use |
|---|---|
| `feat` | Adding something new |
| `fix` | Fixing a bug |
| `style` | CSS, layout, visual changes only — no logic |
| `refactor` | Restructuring code without changing behavior |
| `test` | Adding or updating tests |
| `docs` | Documentation only |
| `chore` | Config, dependencies, tooling |

### Scope

Use the area of the codebase you touched:

```
dashboard, sidebar, orders, reports, analytics, clients,
auth, api-gateway, report-svc, shared, db, infra
```

### Examples

```bash
feat(dashboard): add MetricCard component with trend percentage
feat(sidebar): add active route highlight using usePathname
fix(orders): resolve null status display on pending orders
style(dashboard): adjust card spacing and glow opacity
docs(web): add component guide for frontend contributors
chore(deps): update recharts to 2.15.3
```

### Rules

- Use present tense: "add component" not "added component"
- Keep the description under 72 characters
- Do not end with a period
- Do not use vague messages like "fix stuff", "update", "changes", "wip"

---

## Pull Requests

### When to open a PR

Open a pull request when your feature or fix is complete and working locally. Do not open draft PRs just to show progress — use commits for that.

### PR title format

Same as commit message format:
```
feat(dashboard): add revenue area chart with quarterly data
```

### PR description template

```
## What this does
Brief description of what was built or fixed.

## How to test
Steps to verify the changes work correctly.

## Screenshots (frontend changes only)
Attach before/after screenshots for any UI changes.

## Checklist
- [ ] Works on localhost
- [ ] No console errors
- [ ] Follows naming conventions
- [ ] Types are correct (no `any`)
- [ ] Tested on mobile viewport (frontend only)
```

### Review rules

- At minimum, Khael must approve before merging
- Address all review comments before merging
- Do not merge your own PR without at least one approval
- Do not push additional commits to a PR after approval — open a new PR instead

---

## Frontend Contribution Guide

This section is specifically for the four frontend contributors.

### Setup

The frontend lives in `apps/web/`. Navigate there for all UI work:

```bash
cd apps/web
npm run dev     # starts Next.js at localhost:3000
```

### Folder structure you will work in

```
apps/web/
├── app/
│   └── (dashboard)/
│       ├── page.tsx          main dashboard
│       ├── orders/page.tsx
│       ├── reports/page.tsx
│       ├── analytics/page.tsx
│       └── clients/page.tsx
├── components/
│   ├── dashboard/            dashboard-specific components
│   └── ui/                   reusable generic components
├── lib/
│   ├── format.ts             currency and date formatters
│   └── mockData.ts           prototype data (replace with real API later)
└── hooks/                    custom React hooks
```

### Design system

The platform uses a **dark navy theme**:

```
Background:   #0B0F1A
Surface:      rgba(255,255,255,0.03) with border rgba(255,255,255,0.05)
Primary text: #ffffff
Secondary:    #94a3b8 (slate-400)
Accent green: #10B981 (emerald-400)  — revenue, positive trends
Accent blue:  #3B82F6 (blue-500)    — orders, info
Accent amber: #F59E0B                — warnings, pending
Accent red:   #EF4444                — errors, cancelled
```

Every new component must follow this palette. Do not introduce new colors without checking with Khael.

### Tailwind usage rules

- Use Tailwind utility classes for all styling
- Do not write custom CSS unless Tailwind cannot achieve it
- For dark backgrounds use `bg-[#0B0F1A]` or `rgba` via `style` prop
- Use `rounded-2xl` for all cards and panels — keep the rounded style consistent
- Use `border border-white/5` for card borders — subtle, not harsh

### Component rules

- Every component file = one component, named the same as the file
- All components must be TypeScript with explicit prop interfaces:

```tsx
// ✅ correct
interface Props {
  label: string
  value: number
  trend?: number
}

export function MetricCard({ label, value, trend }: Props) { ... }

// ❌ wrong
export function MetricCard(props: any) { ... }
```

- Use `'use client'` only when the component uses browser APIs, state, or event handlers
- Server components (no `'use client'`) are preferred for data display

### Importing shared types

Always import types from `@finmark/shared`, never redefine them:

```tsx
// ✅ correct
import type { Order, DashboardData } from '@finmark/shared'

// ❌ wrong — do not copy-paste type definitions
interface Order { ... }
```

### Working with mock data

During prototype, all data comes from `lib/mockData.ts`. Do not fetch from the API yet — that wiring happens after the UI is complete.

```tsx
import { MOCK_DASHBOARD } from '@/lib/mockData'
```

When the API is ready, Khael will update the data source. Your components do not need to change.

### Responsive design

All pages must work on:
- Desktop (1280px+)
- Tablet (768px–1279px)
- Mobile (375px–767px)

Use Tailwind responsive prefixes:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
```

Test your work at all three breakpoints before opening a PR.

### Screenshots required

Every frontend PR must include before/after screenshots in the PR description. This is not optional.

---

## Backend Contribution Guide

Backend contributors work in `services/` and `packages/`.

### Key rules

- Every service runs independently on its own port
- Never import directly from another service — use the API Gateway
- Always use `@finmark/shared` types, never redefine them
- Financial amounts are always `string` (Decimal), never `number` or `float`
- Every new endpoint must be logged using `createLogger` from `@finmark/shared`

### Adding a new endpoint

1. Add the route in `src/routes/index.ts`
2. Add the controller function in `src/controllers/`
3. Add the business logic in `src/services/`
4. Export the types used in `@finmark/shared` if other services need them

---

## Coding Standards

### Naming

| Item | Convention |
|---|---|
| Components | PascalCase — `MetricCard.tsx` |
| Functions | camelCase — `getDashboardData()` |
| Variables | camelCase — `totalRevenue` |
| Constants | UPPER_CASE — `CACHE_KEYS` |
| Folders | kebab-case — `report-svc/` |
| Branches | kebab-case — `feature/order-table` |

### TypeScript

- Never use `any` — use `unknown` or proper types
- Never use `// @ts-ignore` — fix the type error properly
- All props interfaces must be explicit
- Use `type` for object shapes, `interface` for component props

---

## What Not to Do

These will get your PR rejected immediately:

```
❌ Commit .env files or any file with real credentials
❌ Push directly to main
❌ Use `any` type without a comment explaining why
❌ Copy-paste type definitions that already exist in @finmark/shared
❌ Use float arithmetic for financial amounts
❌ Commit node_modules/
❌ Open a PR with console.log() statements left in the code
❌ Use vague commit messages like "fix", "update", "changes"
❌ Introduce new npm packages without checking with Khael first
```

---

## Questions

If you are unsure about anything:

1. Check the relevant `README.md` in the folder you are working in
2. Check this file again
3. Ask Khael directly

Do not guess and push — it creates more work for everyone.
