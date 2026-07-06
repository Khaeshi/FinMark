# apps/web — FinMark Frontend

The Next.js frontend for the FinMark Project Finer platform. Primary workspace documentation for designer and UI/UX.

**Read this entire file before making any changes.**
| **Mikko Jerome Bautista** | [@](https://github) |
| **Christian John Batuigas** | [@](https://github) |

---

## What This App Does

This is the dashboard interface that FinMark's 200 employees use to monitor real-time financial performance, order status, and business intelligence. The core requirement is that it loads in **under 3 seconds** even under peak concurrency and low inter of 4G.

---

## Getting Started

```bash
# from the repo root
npm install

# start the frontend
cd apps/web
npm run dev
```

Open `http://localhost:3000` — you should see the dark Finmark dashboard.

---

## Folder Structure

```
apps/web/
├── app/
│   ├── layout.tsx              root HTML/body wrapper, fonts
│   ├── globals.css             dark theme base styles(starting)
│   └── (dashboard)/            route group — no URL segment
│       ├── layout.tsx          sidebar layout wrapper
│       ├── page.tsx            "/" — main dashboard
│       ├── orders/page.tsx     "/orders"
│       ├── reports/page.tsx    "/reports"
│       ├── analytics/page.tsx  "/analytics"
│       └── clients/page.tsx    "/clients"
│
├── components/
│   ├── dashboard/              dashboard-specific components
│   │   ├── DashboardHeader.tsx
│   │   ├── MetricCard.tsx
│   │   ├── OrderTable.tsx
│   │   ├── RevenueChart.tsx
│   │   └── Sidebar.tsx
│   └── ui/                     reusable generic components (buttons, inputs)
│
├── hooks/                      custom React hooks
├── lib/
│   ├── format.ts               formatPHP(), formatNumber(), timeAgo()
│   └── mockData.ts             prototype mock data — replaced later by API(Khaesey)
│
├── public/                     static assets
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json               Defining modules(Khaesey)
└── package.json
```

---

## Design System

### Color Palette

| Token | Value | Usage |
|---|---|---|
| Background | `#0B0F1A` | Page background |
| Surface | `rgba(255,255,255,0.03)` | Cards, panels |
| Border | `rgba(255,255,255,0.05)` | Card borders |
| Text primary | `#ffffff` | Headings, values |
| Text secondary | `#94a3b8` | Labels, subtitles |
| Text muted | `#475569` | Timestamps, hints |
| Accent emerald | `#10B981` | Revenue, positive, live |
| Accent blue | `#3B82F6` | Orders, info |
| Accent amber | `#F59E0B` | Pending, warnings |
| Accent red | `#EF4444` | Errors, cancelled |
| Accent purple | `#8B5CF6` | Clients, misc |

### Typography

The app uses **Geist Sans** and **Geist Mono** (already configured in `layout.tsx`).

- Headings: `font-bold text-white`
- Body: `text-slate-400`
- Labels: `text-xs font-medium tracking-wide uppercase text-slate-400`
- Values/numbers: `font-bold text-white tracking-tight`

### Card Pattern

All cards and panels follow this pattern:
```tsx
<div
  className="rounded-2xl border border-white/5 p-5"
  style={{ background: 'rgba(255,255,255,0.03)' }}
>
  ...
</div>
```

Do not deviate from `rounded-2xl` for cards. Keep borders subtle (`border-white/5`).

### Hover States

Use `hover:bg-white/5` and `hover:border-white/10` for interactive elements. Keep transitions at `duration-200` or `duration-300`.

---

## Component Guidelines

### File structure

One component per file. The file name must match the component name exactly:

```
MetricCard.tsx → export function MetricCard() { ... }
```

### TypeScript props

Every component must have an explicit props interface:

```tsx
interface Props {
  label: string
  value: number
  trend?: number  // optional props use ?
}

export function MetricCard({ label, value, trend }: Props) {
  ...
}
```

### `'use client'` directive

Only add `'use client'` when your component uses:
- `useState`, `useEffect`, `useReducer` or any React hook
- Browser event handlers (`onClick`, `onChange`)
- `usePathname`, `useRouter` from Next.js navigation
- Third-party client-only libraries (e.g. Recharts)

If your component only displays data passed as props, it does not need `'use client'`.

### Importing types

Always import shared types from `@finmark/shared`:

```tsx
import type { Order, DashboardData, UserRole } from '@finmark/shared'
```

Never redefine types that already exist in the shared package.

### Using mock data

During prototype phase, import from `lib/mockData.ts`:

```tsx
import { MOCK_DASHBOARD, MOCK_USER } from '@/lib/mockData'
```

Do not create your own mock data inline in components, direct it there at lib.

---

## Responsive Breakpoints

| Breakpoint | Width | Tailwind prefix |
|---|---|---|
| Mobile | 375px+ | (default) |
| Tablet | 768px+ | `md:` |
| Desktop | 1280px+ | `xl:` |

Test all your work at these three widths using browser DevTools before opening a PR.

---

## Routing

This app uses Next.js App Router. Routes are defined by folder structure:

```
app/(dashboard)/page.tsx          → "/"
app/(dashboard)/orders/page.tsx   → "/orders"
app/(dashboard)/reports/page.tsx  → "/reports"
```

The `(dashboard)` folder is a **route group** — the parentheses make it invisible to the URL. It exists only to apply the sidebar layout to all pages inside it.

To add a new page:
1. Create a folder inside `app/(dashboard)/`
2. Add a `page.tsx` inside it
3. Add the nav link to `components/dashboard/Sidebar.tsx`

---

## Available Scripts

```bash
npm run dev       # start development server at localhost:3000
npm run build     # production build
npm run lint      # run ESLint
```

---

## Using Sileo Toast
This metric uses Sileo Toast instead of the commonly used sonner, please visit the docs for usage guide.
[Sileo Docs](https://sileo.aaryan.design/)

## Formatting Utilities

Use helpers from `lib/format.ts` for consistent data display:

```tsx
import { formatPHP, formatNumber, timeAgo } from '@/lib/format'

formatPHP('4850000.00')    // → "₱4,850,000"
formatNumber(284)          // → "284"
timeAgo(new Date())        // → "just now"
```

Never format currency or numbers manually inline in components.

---

## Adding New Dependencies

Do not install new npm packages without checking with Khael first. If you need a library:

1. Check if it already exists in the monorepo
2. Ask Khael to approve it
3. Install it from the `apps/web/` directory:

```bash
cd apps/web
npm install package-name
```

Never install frontend packages at the monorepo root.

---

## Before Opening a Pull Request

- [ ] `npm run dev` starts without errors
- [ ] No TypeScript errors (`npm run build` passes)
- [ ] No `console.log()` left in code
- [ ] No `any` types used
- [ ] Works at mobile, tablet, and desktop widths
- [ ] Follows the color palette and card pattern above(inform for any changes)
- [ ] PR description includes before/after screenshots
