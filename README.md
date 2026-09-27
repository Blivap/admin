# Blivap Admin

Next.js 15 ops dashboard for Blivap live blood donor matching.

## Stack

- Next.js 15 (App Router) + TypeScript (strict)
- TanStack Query + TanStack Table
- react-hook-form + Zod
- Tailwind CSS + Recharts

## Architecture

```
App Router
  Server Components  → prefetch + HydrationBoundary
  Client Components  → tables, forms, useMutation
       ↓
lib/api/*            → one module per domain (endpoint paths live here only)
       ↓
lib/api/client.ts    → credentials:include, ApiRequestError, 401 → /login
       ↓
NestJS /admin/*      → AdminGuard + JWT admin_session cookie + AuditInterceptor
```

Auth uses a JWT in the `admin_session` httpOnly cookie (separate from mobile donor/requester auth). Admin identity lives in `admin_users` with an `AdminRole[]` field designed for multi-admin growth — not a single-user hardcode.

Mutating actions are **never** audited from the frontend; NestJS `AuditInterceptor` writes `audit_logs` automatically.

## Modules

| Route | Purpose |
|-------|---------|
| `/overview` | Live stats, 30-day chart, unmatched urgent alerts |
| `/users` | Filterable users, detail, suspend/reactivate/verify/reset/merge |
| `/requests` | Request ops, match log, assign/escalate/rematch/rebroadcast |
| `/notifications` | Auto-broadcast history + admin campaigns / DMs |
| `/verifications` | Approve / reject / flag queue |
| `/cms` | Landing copy, FAQs, testimonials |
| `/analytics` | Donors/requests metrics + CSV export |
| `/settings` | Matching, eligibility, alert threshold, maintenance |
| `/audit` | Read-only audit log |

## Setup

```bash
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:2001  (Nest backend)
# Admin UI: yarn dev --port=8057

npm install
npm run dev
```
