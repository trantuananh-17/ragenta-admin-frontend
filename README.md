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

## Screens that run ahead of the backend

Two modules are UI only. They carry a `PrototypeNotice` banner saying so, their
state lives in the browser tab, and a reload restores the fixture.

- **Models** (`/admin/models`) — provider API keys, the model catalogue and the
  platform defaults. Today `ragenta-backend` reads provider keys from
  environment variables (`src/ai/providers.ts`) and ships the catalogue as a
  TypeScript table (`src/ai/models.ts`), so there is no key to edit and no model
  row to toggle. Making it real means moving both into the database behind an
  admin API, with the key encrypted at rest and only a masked hint returned —
  which is already how this screen treats it.
- **Promo codes** (`/admin/promo-codes`) — redeemable codes granting credits to
  a workspace. The backend has no promo-code module; the endpoints the service
  expects are named in its header.

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

## The reference clone

`vecura-admin-frontend/` is a **read-only** reference (ADR-012). It is
gitignored, excluded from `tsconfig.json` and from ESLint. Never edit, stage or
commit inside it.

The layout, the feature-module pattern and the shared entity components are
modelled on it. Everything domain-specific was dropped — it administers a
five-backend drug-discovery platform, and Ragenta has two backends and a
different domain.
