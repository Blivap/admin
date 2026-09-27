# Blivap Admin

Next.js 15 admin dashboard for Blivap live blood donor matching.

## Stack

- Next.js 15 (App Router) + TypeScript (strict)
- TanStack Query + TanStack Table
- react-hook-form + Zod
- Tailwind CSS

## Architecture

```
App Router
  Server Components  → prefetch + HydrationBoundary (first paint)
  Client Components  → tables, forms, useMutation
       ↓
lib/api/*            → one typed module per domain
       ↓
lib/api/client.ts    → single fetch wrapper (credentials, errors, 401 → /login)
       ↓
NestJS /admin/*      → AdminAuthGuard + AuditInterceptor
```

Auth uses the `admin_session` httpOnly cookie only (never localStorage). Middleware redirects unauthenticated users to `/login?from=…`.

## Setup

```bash
cp .env.example .env.local
# set NEXT_PUBLIC_API_URL to your NestJS API origin

npm install
npm run dev
```

## Modules

| Route | Purpose |
|-------|---------|
| `/login` | Admin sign-in |
| `/users` | Search / filter / suspend users |
| `/requests` | Assign donor, escalate, matching log |
| `/notifications` | Broadcast composer + delivery stats |
| `/verifications` | Approve / reject queue |
| `/analytics` | Charts + CSV export |
| `/settings` | Matching radius, eligibility, maintenance |

## API contract (expected NestJS routes)

All mutating `/admin/*` calls are audit-logged by the NestJS `AuditInterceptor` — the frontend never calls a separate audit endpoint.

- `POST /admin/auth/login` · `POST /admin/auth/logout` · `GET /admin/auth/me`
- `GET|POST /admin/users…`
- `GET|POST /admin/requests…`
- `GET|POST /admin/notifications…`
- `GET|POST /admin/verifications…`
- `GET /admin/analytics` · `GET /admin/analytics/export`
- `GET|PATCH /admin/settings`
