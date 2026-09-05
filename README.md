# ragenta-admin-frontend

The internal admin console for Ragenta. It administers **two** things: the
platform (`ragenta-backend` — accounts, workspaces, credits, plans, audit) and
the marketing site's content (`ragenta-content-backend` — posts, changelog,
catalogue, announcement, legal, site settings).

It owns no data of its own. Every screen is a read/write UI over one of those
two backends.

## Stack

Next.js 16 (App Router, React 19, React Compiler) · TypeScript strict ·
Tailwind v4 · shadcn/ui · TanStack Query v5 + Table v8 · ky + Zod · nuqs ·
Better Auth client · a Hono proxy at `/api/*` · pnpm · Node 22.

## Running it

```bash
cp .env.example .env.local     # already points at the staging backends
pnpm install
pnpm dev                       # http://localhost:3002 → /admin
```

Scripts: `pnpm dev | build | start | typecheck | lint`.

`.env.example` points at the deployed staging backends, so a fresh clone talks
to real data with no local infrastructure. Point `RAGENTA_API_URL` and
`RAGENTA_CONTENT_API_URL` at `localhost` when running the backends yourself.

**Both backends must list this app's origin in their own `TRUSTED_ORIGINS`**, or
Better Auth refuses the sign-in and CORS refuses the call. `http://localhost:*`
is allowed by default on both, so local development needs nothing; a deployed
admin frontend needs its hostname added on both sides.

## Who can get in

`requireAuth()` in `src/lib/auth.ts` runs first on every admin page. It asks
`ragenta-backend` who the caller is and redirects anyone who is not a platform
administrator.

That guard is **UX only**. Both backends re-check the admin flag on every one of
their own admin routes, and that is what actually enforces it — a route guard
here would be bypassed by anyone who opened the network tab.

`ADMIN_USER_IDS` mirrors the same variable on the backends, so an owner who is an
administrator by id rather than by role is not bounced off the login page.

## How a request reaches a backend

There is **no token exchange**. Both backends authenticate the Better Auth
session cookie directly, so the proxy forwards the credential and adds nothing.

- **Browser** → relative URL (`/api/v1/...`, `/api/content/...`) → this app's
  Hono proxy → the backend. Same-origin, so the httpOnly cookie is attached
  automatically and no CORS arrangement is needed. The backend URLs never reach
  the bundle.
- **Server (RSC prefetch)** → the backend directly, replaying the caller's cookie
  from `next/headers`.

`src/proxy/index.ts` is the whole map: `/api/auth/*` → Better Auth,
`/api/content/*` → the content backend, `/api/v1/*` → the platform backend,
`/api/health` → this app itself, for the container healthcheck.

## The feature-module pattern

Every screen is a self-contained module under `src/features/<name>/`. Copy the
skeleton rather than inventing a new shape:

```
src/features/<feature>/
├── params.ts                     # nuqs parsers — the URL is the list state
├── service/<feature>.service.ts  # ky calls + Zod schemas + exported types
├── options/<feature>.options.ts  # queryKey factory + queryOptions — NO "use client"
├── hooks/<feature>.hook.ts       # "use client" — useSuspenseQuery / useMutation
├── server/
│   ├── params-loader.ts          # nuqs server loader
│   └── prefetch.ts               # "server-only" — warms the server QueryClient
└── components/                   # container / table / toolbar / pagination /
                                  # columns / form / states / index.ts
```

`options/` carries no `"use client"` on purpose: the RSC prefetch and the client
hook both import it, and a client directive there breaks the server build.

A page is always the same five lines: `requireAuth()`, load params, prefetch,
then `HydrationBoundary` → `ErrorBoundary` → `Suspense` → the table.

Shared scaffolding lives in `src/components/`: `entity-components.tsx`
(`EntityContainer`, `EntityDataTable`, `EntitySearch`, `EntityPagination`, …),
`detail-shell.tsx` for detail screens, plus `locale-tabs`, `status-badge`,
`confirm-dialog`, `stat-card`, `markdown-preview`.

## Conventions worth knowing

- **Every backend response is Zod-parsed** at the service boundary. A shape drift
  fails there, loudly, rather than three components later.
- **The URL is the source of truth** for list state (`params.ts`), so every
  filtered screen is deep-linkable and the back button works.
- **English is required on every translated record.** It is the fallback each
  other locale resolves through — a post that exists only in Vietnamese renders
  an empty card on the English index rather than being absent from it.
- **Publishing is not instant.** The marketing site caches content for 300s, so
  every publish toast says so.
- **Credit adjustments carry an idempotency key** generated once per opened
  dialog, so a double-click cannot move credit twice.

## Models and promo codes

Both shipped as UI-only prototypes in `v0.1.1rc1` and were wired to the backend
on 2026-09-05.

- **Models** (`/admin/models`) — provider API keys, the model catalogue and the
  platform defaults, over `/v1/admin/providers`. A key is write-only: it is
  submitted, stored encrypted (AES-256-GCM) and never returned, so what stays on
  screen is the masked hint. **Test connection** makes one authenticated call to
  the provider — a model list, never a generation — and the result is persisted
  on the credential row, so it survives a reload. Providers Ragenta has no
  client for are listed with no models and say so; storing a key for one would
  do nothing.

  With `SECRETS_ENCRYPTION_KEY` unset the backend refuses to store a key rather
  than writing it in the clear, and the page says so — otherwise the save button
  looks broken for a reason nobody can see.

- **Promo codes** (`/admin/promo-codes`) — redeemable codes granting credits to
  a workspace, over `/v1/admin/promo-codes`. Status (active / inactive / expired
  / used up) is derived by the backend, so the badge here cannot disagree with
  what a customer sees when they type the code in. A redeemed code can only be
  deactivated: its redemption rows are the only record of credits the ledger
  already shows.

## What is deliberately not here

- **An aggregate dashboard endpoint.** The dashboard composes the three admin
  lists it already has, and says on the page that anything derived from the
  workspace list covers at most 100 rows. The fix is
  `GET /v1/admin/overview` on the backend, not a bigger page size here.
- **Workspace member management.** The backend's admin API reads a workspace but
  does not administer its members; the workspace-scoped member routes require
  membership, which a platform administrator does not have.
- **A production deployment.** Staging runs at
  `staging-admin-frontend.ragenta.cloud`; the `production` GitHub Environment
  exists but is empty, as it is for every other repository here.
