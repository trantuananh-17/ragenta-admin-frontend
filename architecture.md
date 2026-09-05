# ragenta-admin-frontend — Architecture

> The internal console for the Ragenta platform and the marketing site. This
> document describes the request and auth flow, the per-feature data model as the
> frontend sees it, and the conventions every screen follows.
>
> Stack: **Next.js 16 (App Router, React 19) · TypeScript · Tailwind v4 ·
> shadcn/ui · TanStack Query v5 + Table v8 · Hono proxy · ky + Zod · Better Auth ·
> nuqs**

---

## 1. Overview

The app owns almost no business data. It is responsible for three things:

1. **Authentication and authorization** — only platform administrators get in.
2. **A server-side API proxy** (Hono) that forwards every browser request to the
   right backend with the caller's session cookie.
3. **One consistent feature-module pattern** — list, detail and editor screens
   over the two backends, with URL-driven state, SSR prefetch and hydration, and
   Zod-validated responses.

```
   Browser                     Next.js server                Backends
 ┌─────────┐   /api/*     ┌──────────────────┐   ┌──────────────────────────────┐
 │ React   │─────────────▶│  Hono proxy      │──▶│ ragenta-backend         :8080 │
 │ (RSC +  │   (ky)       │  /api/[[...route]]│   │  identity, workspaces,        │
 │  client │              │                   │   │  billing, usage, audit, admin │
 │  query) │◀─────────────│  RSC prefetch (ky)│──▶│ ragenta-content-backend :8084 │
 └─────────┘   JSON       └──────────────────┘   │  posts, changelog, catalogue, │
      ▲                            │              │  announcement, legal, settings│
      └── HTML + hydrated ─────────┘              └──────────────────────────────┘
          query cache
```

| Backend | Env var | Owns |
|---|---|---|
| `ragenta-backend` | `RAGENTA_API_URL` | users, sessions, workspaces, members, projects, credits, plans, usage, audit log, platform admin API, and Better Auth at `/v1/auth/*` |
| `ragenta-content-backend` | `RAGENTA_CONTENT_API_URL` | blog posts, changelog, catalogue, announcement bar, legal documents, site metadata |

Both are addressed on `/v1`. The content backend has no user store of its own —
its admin routes introspect the same Better Auth session against
`ragenta-backend`, so there is exactly one source of identity.

---

## 2. Routing

```
src/app/
├── layout.tsx                       # fonts, ThemeProvider, Providers, Toaster, EnvScript
├── page.tsx                         # "/" → /admin
├── globals.css                      # Tailwind v4 + the shadcn token set (Ragenta violet)
├── (auth)/                          # public shell, no sidebar
│   ├── login/            forgot-password/            reset-password/
├── admin/
│   ├── layout.tsx                   # SidebarProvider + AppSidebar + SidebarInset
│   └── (main)/                      # adds AppHeader and the scroll container
│       ├── page.tsx                 # Dashboard
│       ├── users/                   # accounts, roles, suspensions, sessions
│       ├── workspaces/[workspaceId] # tenant detail, credits, plan
│       ├── models/                  # provider keys, catalogue, platform defaults
│       ├── plans/                   # read-only price list
│       ├── promo-codes/             # redeemable credit grants
│       ├── audit-log/               # append-only trail
│       └── content/
│           ├── posts/[id], /new
│           ├── changelog/[id], /new
│           ├── catalogue/[id], /new
│           ├── announcement/        # singleton
│           ├── legal/[slug]         # two fixed documents
│           └── site-metadata/       # three fixed keys
└── api/[[...route]]/route.ts        # Hono proxy catch-all
```

The nav is declared statically in `src/components/app-sidebar.tsx`, grouped by
which backend owns the data: Dashboard · Platform · Billing · Landing content ·
System.

---

## 3. The feature-module pattern

Every screen is a self-contained module under `src/features/<name>/`. This is the
single most important convention here; all eleven features follow it.

```
src/features/<feature>/
├── params.ts                     # nuqs parsers — one source of truth for list state
├── service/<feature>.service.ts  # ky calls + Zod schemas + exported TS types
├── options/<feature>.options.ts  # queryKey factory + queryOptions (NO "use client")
├── hooks/<feature>.hook.ts       # "use client" — useSuspenseQuery / useMutation
├── server/
│   ├── params-loader.ts          # nuqs server loader (parses searchParams in RSC)
│   └── prefetch.ts               # "server-only" — fills the server QueryClient
└── components/
    ├── index.ts                  # barrel
    ├── <feature>-list.tsx        # container + table + toolbar + pagination
    ├── <feature>-form.tsx        # shared by the create and edit screens
    ├── <feature>-detail.tsx      # detail/editor screen
    ├── <feature>-states.tsx      # loading / empty / error views
    └── columns.tsx               # TanStack Table ColumnDef[]
```

### Why `options/` is split from `hooks/`

Importing `queryOptions` from a `"use client"` file into a server file breaks the
build. `options/*.options.ts` therefore carries **no** directive and is usable
from both sides; `hooks/*.hook.ts` is `"use client"` and only wraps those options.

`server/prefetch.ts` imports `server-only` rather than declaring `"use server"` —
it is a render-time helper, not a Server Action, and `"use server"` would publish
it as an RPC endpoint.

### The canonical page

```tsx
export default async function FooPage({ searchParams }) {
  await requireAuth();
  const params = await fooParamsLoader(searchParams);
  await prefetchFoo(params);

  return (
    <FooContainer>
      <HydrationBoundary state={dehydrate(getQueryClient())}>
        <ErrorBoundary fallback={<FooError />}>
          <Suspense fallback={<FooLoading />}>
            <FooTable />
          </Suspense>
        </ErrorBoundary>
      </HydrationBoundary>
    </FooContainer>
  );
}
```

The server prefetch warms the cache, `HydrationBoundary` ships it to the client,
and the client table's `useSuspenseQuery` hits the **same** query key — so it
renders immediately without a second fetch.

### Shared scaffolding

`src/components/entity-components.tsx` provides `EntityContainer`,
`EntityHeader`, `EntitySearch`, `EntityPagination`, `EntityStateView`,
`EntityEmptyView`, `EntityList`, `EntityItem` and `EntityDataTable`. Detail
screens use `detail-shell.tsx` (`DetailShell`, `DetailSection`, `DetailList`).
Cross-cutting pieces: `locale-tabs`, `status-badge`, `confirm-dialog`,
`stat-card`, `markdown-preview`, `tag-input`, `copy-button`,
`content-status-filter`.

### Every screen reads a backend

`promo-codes` and `model-providers` shipped in `v0.1.1rc1` as fixtures behind a
`PrototypeNotice`. Both were wired to the real admin API on 2026-09-05 and the
notice component is gone — no module here holds a store any more. They follow
the same shape as the rest: `service/` calls through `api`, `server/prefetch.ts`
warms the cache, and the page hydrates behind a `Suspense` boundary.

`model-providers` is the one screen that makes a call whose latency is somebody
else's: **Test connection** posts to
`/v1/admin/providers/:provider/check`, which reaches the provider. A rejected
key comes back as `200 { ok: false }`, not an error — "your key is refused" is
the answer to the question, and an error banner would hide it.

`promo-codes` deliberately drops the per-grant expiry the reference console
offers — `credit_balance` expires nothing, so the field would promise what the
ledger cannot keep. `model-providers` mirrors the real catalogue from
`ragenta-backend/src/ai/models.ts` for the three supported providers and leaves
the rest without models, rather than inventing rates that would be read as
billing truth. A provider key is write-only in the UI: submitted, never read
back, shown only as a masked hint.

### URL state with nuqs

`params.ts` declares the parsers once and `inferParserType` derives the type.
Pagination, search and filters all serialize to the URL, so a screen is
deep-linkable, the back button works, and the toolbar and the table read one
source of truth. It is also the query key, which is why the search boxes debounce.

---

## 4. API layer

### 4.1 ky clients

| Client | File | Browser base | Server base |
|---|---|---|---|
| `api` | `lib/ky.ts` | `/api/v1` | `${RAGENTA_API_URL}/v1` |
| `contentApi` | `lib/ky-content.ts` | `/api/content` | `${RAGENTA_CONTENT_API_URL}/v1` |

Both are dual-mode on `typeof window`:

- **Browser** → a relative path, so the call goes through the Hono proxy. That is
  what keeps the backend URLs out of the bundle and the request same-origin.
- **Server** → the backend directly, with the caller's cookie replayed by a
  `beforeRequest` hook reading `next/headers`.
- An `afterResponse` hook sends the browser to `/login` on a 401, so a session
  that expired mid-visit does not leave the user on a page of error cards.

`lib/server-fetch.ts` imports `next/headers` **dynamically**, never at module
top level: the ky clients import it and are themselves imported from client
components, so a static import would pull a server-only module into the browser
bundle.

Better Auth's own operations (sign-in, sign-out, password reset, the admin and
organization plugins) go through `authClient` in `lib/auth-client.ts` instead.

### 4.2 The Hono proxy (`src/proxy/`)

Mounted at `app/api/[[...route]]/route.ts` via `handle(app)`. First match wins:

| Route | Target | Notes |
|---|---|---|
| `/api/auth/*` | `ragenta-backend /v1/auth/*` | cookies pass through; dev-only `Domain` strip so an HTTPS backend's cookie sticks on localhost |
| `/api/health` | — | this app's own liveness, for the container healthcheck |
| `/api/content/*` | `ragenta-content-backend /v1/*` | |
| `/api/v1/*` | `ragenta-backend /v1/*` | |

Every forwarded request gets `X-Forwarded-Host`; failures answer `502` in the
same `{ error: { code, message } }` shape both backends use. A target that
resolves to this app's own host is refused with a `PROXY_MISCONFIGURED` 500
rather than looping.

**There is no JWT middleware.** The reference console exchanges a session cookie
for an RS256 JWT because its backends verify JWTs; both Ragenta backends
authenticate the session cookie itself, so there is nothing to mint and no
30-second token cache to keep correct.

---

## 5. Authentication and authorization

### Server gate — `src/lib/auth.ts`

- `getSession()` forwards the request cookie to
  `ragenta-backend /v1/auth/get-session` and returns `{ user }` or `null`.
  Wrapped in React `cache()`, so one render asks once. A banned account resolves
  to `null`.
- `requireAuth()` redirects to `/login` with no session, and to
  `/login?reason=not-admin` for a signed-in non-administrator. **Every admin page
  calls it first.**
- `requireUnAuth()` keeps a signed-in administrator off the auth pages.
- `isPlatformAdmin()` accepts Better Auth's comma-separated role string, and
  `ADMIN_USER_IDS` mirrors the backends' own escape hatch.

All of this is UX. Both backends re-check the admin flag on every admin route,
and that is the enforcement.

### Client — `src/lib/auth-client.ts`

`createAuthClient` with `adminClient()` and `organizationClient()`. Dual-mode:
`/api/auth` in the browser (same-origin → the proxy), `${RAGENTA_API_URL}/v1/auth`
on the server.

Ragenta's own admin API is plain REST through ky. Product endpoints deliberately
do not live inside Better Auth plugins — that is what makes the reference service
hard to layer, and the backend does the opposite on purpose.

### Flows

- **Email/password** — `authClient.signIn.email()`, then `router.refresh()` so
  the server gate decides whether this account may see `/admin`.
- **Google** — `authClient.signIn.social()`, enabled only when the backend has
  Google credentials configured.
- **Password reset** — `/forgot-password` requests the mail (answering the same
  way whether or not the address exists), `/reset-password` consumes the token.

---

## 6. Data model as the frontend sees it

### 6.1 ragenta-backend

- **AdminUser** — `{ id, name, email, emailVerified, role, banned, createdAt }`
  from `GET /v1/admin/users` (offset-paged, `search`). Mutations are Better Auth
  admin-plugin calls: `setRole`, `banUser`, `unbanUser`, `revokeUserSessions`.
- **AdminWorkspace** — `{ id, name, slug, createdAt, plan, subscriptionStatus,
  planCredits, topupCredits }`. Credits are Postgres `numeric` and arrive as
  strings; the schema coerces them.
- **WorkspaceDetail** — `{ workspace, billing, members }` where `billing` is
  `{ plan, limits, credits: { plan, topup, total, resetAt }, seats: { used, limit } }`.
  Actions: `POST .../credits` (`{ amount, bucket, reason, idempotencyKey }`) and
  `PUT .../plan`.
- **AuditEntry** — `{ id, actorId, organizationId, action, targetType, targetId,
  status, ipAddress, userAgent, metadata, createdAt }`. Append-only; `actorId` is
  null once the account is deleted, because the trail outlives it.
- **Plans** — `GET /v1/plans` returns `{ signupGrantCredits, plans[], topupPacks[] }`
  from the same constants the seat cap and the refill job read. Read-only here.

### 6.2 ragenta-content-backend

- **Post** — row `{ id, slug, heroImageUrl, status, publishedAt, createdAt,
  updatedAt }` plus a translation per locale `{ title, excerpt, bodyMd, seoTitle,
  seoDescription, tags[], readingMinutes }`. CRUD + publish/unpublish.
- **ChangelogEntry** — `{ id, entryDate (YYYY-MM-DD), version, type, status }`
  plus translations `{ title, excerpt, bullets[], sections[] }` where a section is
  `{ heading, body, bullets? }`. CRUD + publish/unpublish.
- **CatalogueItem** — `{ id, slug, name, description (localized), tags
  (localized), featured, sortOrder, status }`. Page-numbered, not offset-paged —
  the public search box pages by number and the API answers in the same units.
  `name` is untranslated: product names are not copy.
- **Announcement** — a singleton `{ enabled, linkUrl, badge, fullText, shortText }`,
  replaced whole on every write.
- **LegalDocument** — two fixed slugs, each with `{ title, bodyMd }` per locale.
  Upserted by slug, never created.
- **SiteMetadata** — three fixed keys (`community_url`, `status_url`, `docs_url`),
  each saved independently.

### Localization

`en` and `vi`, with `en` required everywhere. It is the fallback each other
locale resolves through, so a record with only Vietnamese would render an empty
card on the English index rather than being absent from it. `LocaleTabs` marks
English required and flags an empty Vietnamese tab; `LocaleChips` shows the same
gap in a list. An empty translation is **omitted** from a payload rather than
sent as `""` — a blank row would win over the English fallback.

---

## 7. Runtime configuration

Server env is read from `process.env` in RSC, the proxy and the server ky path.
Client-readable values are **not** baked at build time: `EnvScript` serializes an
allowlist into `window.__env` on every render and `lib/config.ts` reads it, so one
image runs against staging and production unchanged.

| Variable | Read by | Purpose |
|---|---|---|
| `RAGENTA_API_URL` | server | platform backend |
| `RAGENTA_CONTENT_API_URL` | server | content backend |
| `ADMIN_BASE_URL` | server | this app's public URL, for the OAuth callback |
| `ADMIN_USER_IDS` | server | mirrors the backends' admin-by-id escape hatch |
| `APP_BASE_URL` | client | the customer app |
| `SITE_BASE_URL` | client | the marketing site — "View live" links |

---

## 8. Build and packaging

`output: "standalone"` and `reactCompiler: true`. The multi-stage
`node:22-alpine` Dockerfile produces a non-root standalone server on **8083** —
the port reserved for `admin-frontend` in the deployment layout — with an
`/api/health` healthcheck.

Not yet done: a GitHub repository, `check.yml` / `release.yml` / `deploy.yml`, a
compose service in `ragenta-deployment`, a DNS record and a certificate for
`staging-admin-frontend.ragenta.cloud`.

---

## 9. Conventions cheat-sheet

- **One backend = one ky client**, always dual-mode (browser → proxy, server →
  direct + cookie).
- **The proxy carries the credential**; the browser only ever holds the httpOnly
  session cookie.
- **Every admin page starts with `await requireAuth()`** — and that is UX; the
  backend enforces.
- **The URL is the source of truth** for list state.
- **`options/` has no `"use client"`; `hooks/` does; `prefetch.ts` is
  `server-only`.**
- **Every backend response is Zod-parsed** at the service boundary.
- **SSR prefetch + hydrate**, then `useSuspenseQuery` on the client.
- **Irreversible actions confirm**, and the confirmation says what will happen
  rather than asking whether you are sure.
- **New feature** = copy the module skeleton (§3) + a page under
  `app/admin/(main)/` + a sidebar entry.
