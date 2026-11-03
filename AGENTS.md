<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# rapply

## Stack and language

- This is a single Next.js 16 App Router app with React 19, TypeScript, Tailwind v4, Prisma 7.10 and PostgreSQL. The UI, comments, and API errors are French (`app/layout.tsx` sets `lang="fr"`).
- `pnpm` is authoritative; use `pnpm-lock.yaml`, not the stale `package-lock.json`. The `@/*` TypeScript alias maps to the repository root.

## Commands and prerequisites

- `pnpm dev`, `pnpm build`, `pnpm start`, `pnpm lint` are the available package scripts. There is no test runner, formatter, or typecheck script; `pnpm build` is the type-checking/production gate. `pnpm lint` currently has known baseline violations, so compare changes with the baseline rather than assuming it is clean.
- Set `DATABASE_URL` in `.env` before running Prisma commands. Then use `pnpm install`, `npx prisma generate`, and (when changing the database) `npx prisma migrate dev`. `prisma7.config.ts` loads the environment and owns the seed command.
- `pnpm seed` runs `prisma/seed.ts`; `pnpm create-user [create|password|delete] ...` runs the host-only account CLI. The production Docker runner has no `node_modules`, package manifest, or `tsx`; do not run these CLIs inside it.
- After editing `prisma/schema.prisma`, run `npx prisma generate`; the generated client is gitignored under `app/generated/prisma`.

## Architecture

- Authenticated dashboard routes live under `app/(dashboard)/`; `/recettes` and `/parametres` are outside that group. Dashboard pages are async server components that use `app/lib/server-fetch.ts` and pass initial data to client views in `app/components/`.
- `serverFetch` makes an absolute, `cache: "no-store"` request to `NEXT_PUBLIC_APP_URL`; that URL must be reachable from the server/container. Client views keep local entity state and normally update it from mutation responses instead of relying on `router.refresh()`.
- Use `app/components/PageLayout.tsx` for page headers and fixed-header offsets. Use its `standalone` prop for `/recettes` and `/parametres`; do not hand-roll equivalent offset CSS. Reuse `.pwa-sheet-overlay`/`.pwa-sheet` for edit sheets.
- `PageLayout` is client-side because it mounts pull-to-refresh. `PullToRefresh` must wrap only page content, not fixed headers or modals; when idle it must clear `style.transform` to `""`, never leave `translate3d(0,0,0)`.

## Prisma, auth, and API safety

- Prisma 7 requires the PostgreSQL driver adapter. Keep `app/lib/prisma.ts` as the sole client construction point; do not restore the legacy `prisma-client-js` generator or add a schema datasource URL.
- `proxy.ts` is the Next 16 request/auth entry point (not `middleware.ts`). It verifies the JWT, checks `tokenVersion`, injects `x-user-id`, and enforces same-origin checks for mutating `/api` requests. Route handlers should call `getUserId(req)` and scope every query by that user; never trust a client-supplied `userId`.
- Collection POST and item PUT handlers validate with zod `safeParse` and pass `parsed.data` to Prisma. Keep PATCH schemas separate from POST schemas when defaults, refinements, or nested item fields make `.partial()` unsafe.
- `Decimal` values serialize from API responses as strings. Convert with `Number(...)`; format French numbers with `toLocaleString("fr-FR")`. Parse form numbers before sending them to zod.

## Dates and shared behavior

- Import dayjs from `@/app/lib/dayjs` when using the configured `utc`/`isoWeek` plugins. Calendar-only values stored at UTC boundaries must be read with `dayjs.utc()`; `Reminder.dueDate` is a real local-time instant and must not be treated as a UTC calendar date.
- `OVERDUE` is derived in `app/lib/recurrence.ts`, not a persisted Prisma enum value. That module is shared by the UI and push jobs, so changes must preserve both client and server behavior.
- Push jobs run in-process from `instrumentation.ts` in production; do not add an external cron assumption. The Docker runtime sets `TZ=Europe/Paris`; rebuild/recreate the container when deployment environment changes matter.
- `public/sw.js` is hand-written and caches API GETs and offline routes. Bump its cache name when changing cache behavior, and remember that `/recettes` and `/parametres` are not registered by the dashboard service-worker registrar.

## Styling and deployment

- Tailwind v4 is CSS-first: palette/theme tokens and handwritten layout classes are in `app/globals.css`; there is no `tailwind.config.*`. Reuse existing tokens such as `font-display` and `font-mono-log`.
- `next.config.ts` uses `output: "standalone"`. The Docker build runs Prisma generation before `pnpm build`; the runner starts `.next/standalone/server.js` as a non-root user. Schema migrations are applied out of band, not during image startup.
