<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# rapply

Next.js 16 (App Router) personal-management app (French UI): reminders, notes, finances (transactions/budgets/categories), and a weekly schedule.

## Commands

- `pnpm dev` — start dev server (pnpm is the package manager; `pnpm-workspace.yaml` pre-approves native builds for prisma/esbuild).
- `pnpm build` — `next build` (this also runs type checking; there is no separate typecheck script).
- `pnpm start` — run the production build.
- `pnpm lint` — `eslint` via flat config `eslint.config.mjs`.
- `npx prisma generate` — regenerate the Prisma client after editing `prisma/schema.prisma`. **There is no npm script for this; run it directly.**
- `npx prisma migrate dev` / `npx prisma db push` — schema migrations. Config lives in `prisma7.config.ts` (Prisma 7's default config filename).
- Seed: `npx prisma db seed` runs `prisma/seed.ts` (via `tsx`). The seed command is configured under `migrations.seed` in `prisma7.config.ts` — **not** in `package.json` `prisma.seed`, which Prisma 7 ignores. The seed reuses the driver-adapter client from `app/lib/prisma.ts` since Prisma 7 has no built-in engine.
- No test runner, formatter, or `typecheck` script is configured.

## Prisma (high-signal gotchas)

- Prisma 7.10 with a **driver adapter**: the client is created in `app/lib/prisma.ts` using `PrismaPg` from `@prisma/adapter-pg`. Prisma 7 has no built-in engine, so this adapter is required — do not switch to the legacy `prisma-client-js` generator or drop the adapter.
- The client is generated into `app/generated/prisma` (output set in `prisma/schema.prisma`) and is **gitignored**. Import it as `@/app/generated/prisma/client`. Regenerate after any schema change or the app breaks at runtime.
- Datasource URL is read from `DATABASE_URL` in `.env` (loaded by `import "dotenv/config"` in `prisma7.config.ts`).

## Architecture

- Route handlers live under `app/api/<resource>/route.ts` (collection) and `app/api/<resource>/[id]/route.ts` (item). Each handler reads the authenticated user via `getUserId(req)` from `app/lib/auth.ts`.
- Auth: JWT in the httpOnly cookie `token` (signed with `JWT_SECRET`) is verified in **`proxy.ts` at the repo root** (Next 16 renamed `middleware` → `proxy`; the file must live at project root, NOT in `app/`), which injects `x-user-id`. `app/api/auth/login/route.ts` issues the token. The matcher excludes `/login`, `/api/auth/login`, and static assets.
- Proxy runs in the Node.js runtime (not configurable) and exports a `proxy` function. Don't recreate `middleware.ts` inside `app/` — Next 16 will not load it.
- Push notifications use `web-push` (VAPID keys in `.env`); `app/api/push/send` is protected by `CRON_SECRET` and meant to be called by a cron job.
- `next-pwa` is installed but **not configured** in `next.config.ts` — do not assume PWA/offline behavior.
- Auth cookie gotcha: in `app/api/auth/login/route.ts` the `token` cookie's `secure` flag is derived from the request protocol (`x-forwarded-proto` header), **not** from `NODE_ENV`. Behind an HTTPS proxy (e.g. ngrok) `NODE_ENV` is still `development`, so a `NODE_ENV`-based `secure` would be false and the browser drops the cookie → user stays stuck on `/login`. Keep `secure` based on `x-forwarded-proto`/`req.nextUrl.protocol`.

## Known issue to fix (not a convention)

- `app/api/reminders/[id]/routes.ts` is **misnamed** — Next.js only loads `route.ts`, so the GET/PUT/DELETE handlers for single reminders are never served. Rename it to `route.ts` to enable those endpoints.
