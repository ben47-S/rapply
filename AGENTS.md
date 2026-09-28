<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# rapply

Next.js 16.3 (App Router) + React 19 + Tailwind v4 + Prisma 7.10/Postgres personal-management app. **UI, comments, and API error strings are all French** (`lang="fr"` in `app/layout.tsx`).

## Working state (check before starting)

`HEAD` does **not** build: `app/(dashboard)/page.tsx` at HEAD imports `app/components/PageLayout.tsx`, but that file is still **untracked** (an in-progress refactor that also has 8 modified view components). Never `git stash`/`git checkout` this tree without `git add app/components/PageLayout.tsx` first. `PageLayout` now owns the fixed-header scaffolding (`variant="standard" | "search" | "filters" | "responsive-tools"`, slots `leading/title/titleActions/actions/controls/subheader`) — use it instead of hand-rolling header/offset CSS in new views.

## Commands

- pnpm is the package manager. A stale `package-lock.json` also exists — ignore it; `pnpm-lock.yaml` is the real lockfile and the only one the Dockerfile uses (`--frozen-lockfile`).
- `pnpm dev` / `pnpm build` / `pnpm start` / `pnpm lint`. **No test runner, no formatter, no `typecheck` script** — `pnpm build` is the only type check, and it is the only gate that actually passes. **`pnpm lint` fails at baseline** (86 errors / 4 warnings) and is not a regression gate: they are almost entirely `no-explicit-any` on the deliberate `any` entity types, plus `set-state-in-effect` in `BurgerMenu`/`login` and one `no-img-element`. Compare against that baseline instead of expecting zero. Bare `eslint` via flat config `eslint.config.mjs`.
- `npx prisma generate` — regenerate the client after editing `prisma/schema.prisma`. No npm script exists; run it directly.
- `npx prisma migrate dev` — schema migrations (`prisma/migrations/` exists, 4 applied). Config is `prisma7.config.ts` (Prisma 7's default filename), which is also where `migrations.seed` is declared — there is no `package.json` `prisma.seed` key.
- `pnpm seed` (`prisma db seed` → `tsx prisma/seed.ts`) and `pnpm create-user` (`tsx prisma/create-user.ts`, interactive). Both import the driver-adapter client from `app/lib/prisma.ts`; don't give them a separate client.

## Prisma 7 gotchas

- **Driver adapter is mandatory** (Prisma 7 has no query engine): `app/lib/prisma.ts` wires `PrismaPg` from `@prisma/adapter-pg` into `PrismaClient({ adapter })`. Never revert to the legacy `prisma-client-js` generator or drop the adapter.
- Client generates to `app/generated/prisma` (set in `prisma/schema.prisma`), is **gitignored**, and is imported **only** as `../generated/prisma/client` from `app/lib/prisma.ts`. Nothing else imports it.
- `datasource` in the schema has **no `url`** — it comes from `process.env.DATABASE_URL` via `prisma7.config.ts` (`import "dotenv/config"`).
- Don't use the Dockerfile's global `prisma@6.8.2` as a reference; the project pins `7.10.0`.

## Auth & request pipeline

- Auth is verified in **`proxy.ts` at the repo root** (Next 16 renamed `middleware` → `proxy`; it must not live in `app/`, and there is no `app/middleware.ts`). It exports `proxy`, runs in the Node runtime, verifies the httpOnly `token` JWT (`JWT_SECRET`), then injects `x-user-id`.
- Route handlers do **not** re-parse cookies. They call `getUserId(req)` from `app/lib/auth.ts` and must scope every Prisma query by that id. `getUserId` **throws** `UNAUTHENTICATED` rather than returning 401 (practically unreachable — the proxy 401s first).
- The proxy runs a `prisma.user.findUnique` **on every single request** to compare `tokenVersion` (session revocation, bumped by `app/api/auth/revoke/route.ts`). Don't add more DB work there.
- The proxy also enforces **CSRF**: for `POST/PUT/PATCH/DELETE` under `/api/*` it compares `origin` (or `referer`) host to `x-forwarded-host`/`host`, and returns 403 on mismatch. It *allows* the request when both headers are absent — so this is origin-based, not a token.
- Unauthenticated, by design: `/login`, `/api/auth/login`, `/api/push/send`, `/api/push/digest`, and static assets (matcher at `proxy.ts:90`). The two push routes use `Bearer ${CRON_SECRET}`, not the proxy. `app/api/auth/logout` also has no auth. `/api/export` and `/api/push/test` **are** authenticated (`getUserId`); `/api/push/test` further 404s unless `NODE_ENV === "development"`.
- Login cookie gotcha: in `app/api/auth/login/route.ts` the `token` cookie's `secure` flag is derived from `x-forwarded-proto`/`req.nextUrl.protocol`, **not** `NODE_ENV`. Behind an HTTPS proxy (Traefik/ngrok) `NODE_ENV` is still `production`/`development` inconsistently; an `NODE_ENV`-based flag makes the browser drop the cookie and the user stays stuck on `/login`.
- Login rate limiting (`app/lib/rate-limit.ts`) is an **in-memory `Map`** — lost on restart, per-process. 5 failures / IP / 15 min ⇒ 15 min block. Resolves the client IP via `cf-connecting-ip` → `x-forwarded-for` → `x-real-ip`.

## Page / component pattern

- `app/(dashboard)/**/page.tsx` are **async server components** that `Promise.all` their data via `serverFetch` and pass plain props to a `"use client"` view in `app/components/`. Canonical: `app/(dashboard)/reminders/page.tsx`.
- `app/lib/server-fetch.ts` forwards the `token` cookie with `cache: "no-store"` and calls the **absolute** `NEXT_PUBLIC_APP_URL` — i.e. every SSR render makes a real HTTP round-trip to your own server. That URL must be correct *and reachable from the container*. It **throws** on non-2xx; only `app/(dashboard)/page.tsx` (`safe<T>()`) and the two pages outside the group add fallbacks.
- Client views hold entity state locally (`useState(initial)`, entity types are `any`, no shared DTOs, no react-query/SWR) and call `fetch("/api/...")` directly. After a mutation they **lift the result into local state** via an `onSaved(updated, deletedId, added)` callback — no `router.refresh()`, no `revalidatePath`. (That is the norm, not the law: `ScheduleView` events and the `SettingsView` currency both call `router.refresh()`, because neither keeps a local mirror of its entities.)
- Modals live in the same file as their view and use the `.pwa-sheet-overlay` + `.pwa-sheet` pair. They close on overlay click and on `✕` — **no Escape handler exists in any of the six edit modals**, only `DashboardBudgets.tsx` has one.
- The `alive` unmount guard (`const alive = useRef(true)` + cleanup-`useEffect`, wrapping the `setSaving(false)` / `setDeleting(false)` in each `finally`) is **optional and easy to get wrong**: if you write it, the setup body must set `alive.current = true`, because React StrictMode is on by default with the App Router (`next.config.ts` never sets `reactStrictMode`) and the dev double-invoke leaves the flag `false` after mount — every guard then silently skips, and the save button stays stuck on its spinner. It was exactly this bug in 6 of the 7 views before the fix. Note the guard is largely redundant anyway: React 18+ removed the setState-after-unmount warning, so the call is already a silent no-op. Prefer aborting the `fetch` if you need real cancellation.
- `app/parametres/page.tsx` and `app/recettes/page.tsx` are **outside** the `(dashboard)` group, so they get no sidebar, no bottom nav, and no `ServiceWorkerRegistrar` — which is why they hand-roll their own page padding. Don't "fix" that without understanding the boundary.

## Serialization & dates (easy to get wrong)

- **Prisma `Decimal` fields reach the client as JSON *strings*** (`Transaction.amount`, `Budget.amount`, `Reminder.estimatedAmount`, `Recipe.estimatedCost`) because `Decimal#toJSON` returns a string. Routes just `NextResponse.json(prismaResult)`. So every read must be wrapped: `Number(t.amount)`, `Number(x).toLocaleString("fr-FR")`, and form seeding uses `String(Number(tx.amount))`. There is **no** `Prisma.Decimal` import and no `.toFixed()` anywhere — formatting is always `.toLocaleString("fr-FR")`.
- Client → API: zod schemas expect `z.number()`, so form strings are parsed with `parseFloat(String(v).replace(",", "."))` and nulled when `!isNaN(v) && v > 0`.
- Import dayjs **only** from `@/app/lib/dayjs` (it extends `isoWeek` and sets locale `fr`). Four files still import raw `"dayjs"` — `app/api/push/send`, `app/api/push/digest`, `app/api/schedule`, `app/api/stats` — so they get `fr` but **not** `isoWeek`; adding an isoWeek call there will break.
- **No timezone plugin and no `TZ`** anywhere. `dayjs(...).format("HH:mm")` renders in the host's local zone while `datetime-local` inputs are browser-local, so times shift by the browser's UTC offset (the Docker image runs UTC). Be careful when adding date math, and note `recurrenceEndDate` is explicitly built as `...T23:59:59.000Z` while everything else is local.
- Reminder due date uses a **single `datetime-local` input** (`app/components/RemindersView.tsx`). It was split into date+time and then explicitly reverted twice — do not re-split. `ScheduleView` legitimately uses `type="date"` + two `type="time"` inputs because `ScheduleEvent.startTime`/`endTime` are `"HH:mm"` **strings** in the DB, regex-validated in zod.
- `app/lib/week.ts` indexes Monday-first arrays with `isoWeekday()` (1=Mon..7=Sun), while `app/(dashboard)/page.tsx` has a hand-rolled **Sunday-first** `DOW` array indexed by `dayjs().day()`. They coexist and disagree — don't mix them.

## Validation

zod (v4) is used on **POST of collection routes** (`reminders`, `notes`, `budgets`, `categories`, `transactions`, `schedule`, `recipes`, `recipes/[id]`), always as `safeParse` → `return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })`. Enums are hand-written string unions mirroring the Prisma enums, not `z.enum(...)`; dates are `z.string().datetime()` converted with `new Date(...)`; foreign-key ownership is checked *after* zod with its own 400.

**Six of the seven `PUT` handlers on `[id]` routes do not validate at all** — they hand the raw body to `data` (`notes`, `budgets`, `transactions`, `schedule`, `categories` all do a bare `data: body`; `reminders/[id]/route.ts:52` does `const updateData: any = { ...body }`). That is a mass-assignment hole: a client can post `userId` and hijack the row, and `Decimal`/date fields come in as strings. Only `recipes/[id]` is safe — it `safeParse`s with the same `recipeSchema` used by its POST. If you touch one of the other six, reuse the collection route's schema with `.partial()` (reminders' PUT also handles `status` and `items`, which are not in its POST schema). Some other routes (`user`, `push/subscribe`, `push/test`) use explicit manual checks.

Clients only surface `error.formErrors` (`data?.error?.formErrors?.join(", ")`); `fieldErrors` are parsed and then dropped, so per-field messages are invisible in the UI.

## Styling (Tailwind v4, CSS-first)

There is **no `tailwind.config.*`**. `app/globals.css` does `@import "tailwindcss"` then defines the whole palette in `@theme` (`ink`, `surface`, `surface-raised`, `border-log`, `parchment`, `muted`, `brass`, `amber`, `teal-log`, `rust`) — add a colour there. Fonts map to non-obvious utilities: `font-display` (Fraunces), **`font-mono-log`** (IBM Plex Mono, *not* `font-mono`), `font-sans` (Inter).

Hand-written classes in `globals.css` that you should reuse: `.mobile-page-header` / `.mobile-page-root--*` (the fixed-header + offset system, now emitted only via `PageLayout`), `.pwa-sheet-overlay` / `.pwa-sheet` (all modals; `z-index: 60` is set globally there), `.pwa-bottom-nav`, `.initial-loading` (+ `app/components/InitialLoading.tsx`). Offsets derive from the CSS vars `--mobile-header-height` / `--mobile-page-title-height` / `--mobile-page-subheader-height`; the desktop breakpoint is hardcoded at `min-width: 768px` with `left: 224px` to clear the `md:w-56` sidebar — change one, change the other.

**Stacking context trap:** the hand-written classes come *after* `@import "tailwindcss"` in `globals.css`, so at equal specificity they beat a Tailwind utility. A `z-[70]` on a `.pwa-sheet-overlay` is silently ignored — the global `z-index: 60` wins. `ConfirmDialog` (the delete-confirmation nested inside an edit sheet) therefore sets `style={{ zIndex: 70 }}` inline, which cannot lose. Use the same trick for any overlay-on-overlay.

**Destructive actions are confirmed** via `app/components/ConfirmDialog.tsx`, not `window.confirm` (which SettingsView still uses in 2 places). The pattern in the six edit modals is a two-state `remove`: the first click does `if (!confirming) return setConfirming(true)`, the second `setConfirming(false)` and proceeds. Note this needs the modal's `return (...)` wrapped in a `<>...</>` fragment, because the dialog is a **sibling** of `.pwa-sheet-overlay`, not a child.

## Push, recurrence, and the service worker

- Two crons hit protected endpoints with `Bearer $CRON_SECRET`: `*/10 * * * *` → `POST /api/push/send` (REALTIME reminders + budget alerts) and `7 0 * * *` → `POST /api/push/digest` (MORNING reminders).
- `app/lib/recurrence.ts` is the reminder brain and is **client-shared** — the same functions drive UI state and cron alerts. `derivedStatus()` returns `OVERDUE` as a *derived, non-persisted* value (only `PENDING`/`DONE` exist in the enum), so `where: { status: "OVERDUE" }` in a Prisma query is a bug. `stagesFor()` returns `[70,90,100]` vs `[50,80,100]` based on a 90-day window; `windowStart()` anchors the push window and differs for recurring vs one-shot. `dayjs.add(1,"month")` clamps/overflows end-of-month dates (Jan 31 → Mar 3).
- Reminder dedup: `sentStages` is an **Int bitmask** (bits 0/1/2). `PUT /api/reminders/[id]` resets `sentStages = 0` whenever `dueDate` is present in the body — which also re-arms pushes on an unrelated re-save.
- Budgets alert once per period via `alertLevel` + `alertSentAt` (80/95/100 %), reset when `alertSentAt` predates the period start.
- `app/lib/push.ts` calls `webpush.setVapidDetails()` **at module scope**, so importing it without `VAPID_*` set throws. `sendPush` auto-deletes subscriptions on 404/410 then rethrows; `sendPushToMany` swallows per-subscription errors and returns a count (the crons only report counts). It imports `prisma`, so it is server-only.
- `public/sw.js` is hand-written (no `next-pwa`). **It caches `GET /api/*`** (network-first, `caches.put` on every ok response) and precaches `/` as the navigation fallback, so adding/renaming a GET endpoint surfaces as stale data in the installed PWA. Bump `CACHE_NAME` (`rapply-cache-v2`) when you change caching behaviour. Non-GET methods and `/api/auth*`, `/api/push/send`, `/api/push/digest` bypass the SW entirely. `notificationclick` only focuses an existing window or opens `/` — no deep links.
- `ServiceWorkerRegistrar` is mounted from `app/(dashboard)/layout.tsx` and **no-ops unless `NODE_ENV === "production"`**; since `/recettes` and `/parametres` sit outside that group they never register the SW at all. `PushSubscribeButton` is rendered by `SettingsView` (Paramètres), **not** the dashboard, and registers `/sw.js` itself before subscribing because the registrar is dev-inert. It posts to `/api/push/subscribe`, which deliberately stays behind the proxy so `x-user-id` is available.

## Recipes

Recipes are a self-contained feature: `app/recettes/page.tsx`, `app/components/RecipesView.tsx`, `app/api/recipes/**` (including `shopping-list`). It is the only place with zod on an `[id]` route. Note `Recipe.estimatedCost` (not `estimatedAmount`) is the Decimal field, and a recipe can be linked 1:1 to a `Note` via `noteId`.

## Deploy

- `next.config.ts` uses `output: 'standalone'` + global security headers (HSTS, `X-Frame-Options: DENY`, …). Don't add per-route headers there without checking this catch-all `/(.*)` block.
- The Dockerfile is 3-stage: `pnpm install --frozen-lockfile` → `npx prisma generate` **then** `pnpm build` → non-root `nextjs` runner on `node server.js` with `.next/standalone`.
- All 7 secrets (`DATABASE_URL`, `JWT_SECRET`, `CRON_*`, `VAPID_*`, `NEXT_PUBLIC_*`) are passed as **build ARGs** and declared in **both** the Dockerfile and both blocks of `docker-compose.yml` (`build.args` and `environment`). A new `NEXT_PUBLIC_*` var must be added in all three places, or it is `undefined` at build time.
- **No `prisma migrate deploy` runs in the image** — schema changes must be applied out-of-band.
- `docker-compose.yml` joins the external `traefik-network` and routes `Host(\`${DOMAIN:-rapply.voisilab.app}\`)`; there is no DB service (external Postgres via `DATABASE_URL`).
