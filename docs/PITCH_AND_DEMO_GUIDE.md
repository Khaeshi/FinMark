# FinMark — Pitch & Demo User Guide

A practical guide for the team: what FinMark is, how to demo it live, and how to talk about it so judges/clients hear *product + trust + infrastructure* — not just “we built CRUD.”

---

## 1. One-sentence pitch

**FinMark is an operations platform for FinMark staff who manage SME clients** — orders, financials, users, and risk/compliance signals — built as real microservices with role-based access.

Use that line first. Then expand with the three pillars below.

---

## 2. The story (3 pillars)

| Pillar | What to say | What to show |
|--------|-------------|--------------|
| **Operate** | Staff create and progress SME orders with clear roles (Ops / Finance / Admin). | Orders → New Order → status change |
| **Detect** | Unusual order amounts are flagged against the client’s historical average — risk without fake “AI.” | Create a 3×+ average order → amber badge / modal notice |
| **Account** | Every status change is attributable (who / what / when) — aligns with data-protection and access-control expectations (RA 10173 / ISO 27001 *thinking*). | Order detail → Audit trail timeline |

Close with: *“This is not a mock dashboard. Services, auth, roles, and audit logs are wired.”*

---

## 3. Who uses what (roles)

| Role | Can do in the demo |
|------|--------------------|
| **SUPERADMIN** | Everything + Dashboard system health / platform metrics |
| **ADMIN** | Clients, users, orders, reports, analytics |
| **OPERATIONS** | Orders (create, status, cancel) |
| **FINANCE** | Reports (add/edit financial records, CSV export) |
| **ANALYST** | Analytics + reports (read-focused) |
| **VIEWER** | Dashboard only |

**Tip:** Demo as **ADMIN** or **SUPERADMIN** so you can hit Clients, Users, Orders, and Reports in one login. Mention roles verbally even if you stay on one account.

---

## 4. Live demo script (~6–8 minutes)

Do this in order. Practice once so timings feel natural.

### Setup (before you present)
1. `npm run dev` is running; log in (dev: `admin@finmark.com` / seeded password).
2. Confirm at least one SME client has **3+ existing orders** (seed data usually does).
3. Open **Orders**, **Clients**, and one **order detail** tab ready if helpful.

### Act 1 — Operate (2 min)
1. **Clients** → Add Client (name + industry + tier) → show it on the grid.
2. **Orders** → New Order → pick client → enter a **normal** amount → Create.
3. Change status with the row dropdown (e.g. PENDING → CONFIRMED). Say: *“State machine enforces valid transitions — you can’t jump to FULFILLED from PENDING.”*

### Act 2 — Detect (2 min)
1. New Order again for a client with history.
2. Enter an amount **clearly > 3×** their usual size (if unsure, use something huge like `999999.00`).
3. Point at the **amber “Unusual amount”** notice in the modal, then the badge on the list.
4. Line: *“We compare against that client’s average — only after enough history, so first orders aren’t false positives.”*

### Act 3 — Account (2 min)
1. Click the flagged (or any) order row → **order detail**.
2. Scroll to **Audit trail**.
3. Point at status change lines and (if present) the anomaly flag entry.
4. Line: *“Compliance-aware: we can answer who changed what and when — required thinking for PH data-privacy and security frameworks.”*

### Act 4 — Breadth (1–2 min, if time)
- **Reports** → Add Record / Export CSV  
- **Users** → role dropdown / invite (Admin)  
- **Analytics** → charts  
- **Dashboard** (SUPERADMIN) → System Health  

Stop before you over-click. Three strong moments beat ten shallow ones.

---

## 5. Talking points (objections & answers)

| They might say | You say |
|----------------|---------|
| “Is this just a student CRUD app?” | “CRUD is the floor. On top: role-gated APIs via gateway, order state machine, computed risk flags, immutable-style audit log writes, multi-service health.” |
| “Where’s the AI?” | “We didn’t bolt on a chatbot. Risk is **deterministic and explainable** — amount vs client average. That’s what ops and auditors trust.” |
| “Is data safe?” | “Auth at the gateway, roles per route, audit on sensitive status changes, no money as floats (decimal strings). Schema already has AuditLog — we write to it.” |
| “Can it scale?” | “Microservices behind an API gateway; Redis caching on reports; health aggregation for SUPERADMIN. Horizontal scaling is in the architecture, not a slide.” |
| “Who is the customer?” | “**Internal FinMark employees** managing many SME clients — not the SMEs logging in themselves (for this prototype).” |

---

## 6. Architecture in 30 seconds (for technical judges)

```
Web (Next.js) → API Gateway (:4000) → order-svc / report-svc / admin-svc / auth / …
                              ↓
                         PostgreSQL (Prisma) + Redis (cache)
```

Mention only if asked:
- Orders never skip invalid status transitions (`VALID_TRANSITIONS`).
- Financial amounts use shared decimal helpers — not JS floats.
- Anomaly `flagged` is **computed**, not a schema column (no migration needed).

---

## 7. Feature checklist (what exists today)

| Area | Capabilities |
|------|----------------|
| **Orders** | List/filter, create, status update, cancel + reason, detail page, anomaly badge, audit timeline |
| **Clients** | List, add, edit, activate/deactivate |
| **Reports** | Financial table, add/edit record, CSV export |
| **Users** | List, change role, assign client, deactivate, invite (Cognito register) |
| **Analytics** | Revenue, orders by period, client trend, heatmap, top clients |
| **Dashboard** | KPIs; SUPERADMIN system health + platform metrics + **WAF: active** |

---

## 7b. App-layer WAF demo (30 seconds)

Gateway blocks SQLi/XSS probes before they reach services. Line for judges: *“WAF sits on the API gateway — same place as auth and rate limits.”*

```bash
# Should return 403 with code WAF_BLOCKED
curl -s "http://localhost:4000/api/orders?q=%27%20OR%201%3D1--"

# Normal login still works (dev)
curl -s -X POST "http://localhost:4000/api/auth/dev-login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@finmark.com\",\"password\":\"devpassword\"}"
```

On the SUPERADMIN dashboard, System Health shows **WAF: active** and a block count from `/health`.

---

## 8. Demo do’s and don’ts

**Do**
- Narrate *why* before *click* (“I’m about to show risk detection…”).
- Use one memorable number for the anomaly order.
- End on Audit trail — that’s the trust closer.

**Don’t**
- Dig into settings or broken empty states.
- Promise ML, mobile apps, or SME self-serve unless built.
- Apologize for seed data — call it “representative PH SME sample data.”

---

## 9. Suggested closing line

> “FinMark helps our team run SME client operations with the same expectations banks have of software: clear roles, explainable risk signals, and an audit trail you can stand behind.”

---

## 10. Quick reference — URLs & accounts

| Item | Value |
|------|--------|
| App | `http://localhost:3000` (or your deployed URL) |
| API gateway | `http://localhost:4000` |
| Dev login | Use seeded admin from project README / login page shortcuts |

If something fails mid-demo: refresh, re-login, fall back to **Orders list + one detail page** already open — still enough to finish Acts 2–3.
