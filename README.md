# SupportAI Web

Next.js 16 (App Router) + TypeScript + Tailwind + TanStack Query.
Implements the UI for backend Modules 0-1: sign up / sign in, dashboard, team management,
audit log and organization settings.

## Run it

```bash
cp .env.example .env.local        # BACKEND_URL=http://localhost:8000
npm install
npm run dev                       # http://localhost:3000
```
The backend must be running (see the backend README). Then open `/register`.

```bash
npm test            # 49 tests (Vitest + Testing Library)
npm run typecheck
npm run build
```

## How it works

```
Browser (React)                Next.js server (this app)                 FastAPI
 components -> hooks -> apiFetch  -> /api/proxy/*  --Bearer from cookie-->  /api/v1/*
 login form            authFetch  -> /api/auth/*   -- sets httpOnly cookies
```

* **Tokens never reach browser JavaScript.** The JWTs live in `httpOnly` cookies set by
  `/api/auth/*`; `/api/proxy/*` attaches them to backend calls and silently refreshes an expired
  session (`src/lib/server/session.ts`). An XSS bug therefore cannot steal a session.
* **CSRF:** cookies are `SameSite=Lax` and every write must come from our own `Origin`.
* **Permissions in the UI** (`src/lib/permissions.ts`) only hide controls; the backend enforces everything.
* `src/proxy.ts` (Next 16's replacement for middleware) redirects visitors without a session cookie to `/login`.

## Structure

| Path | Purpose |
|---|---|
| `src/app/` | Routes only; each page just renders a feature component |
| `src/features/<area>/` | `hooks.ts` (server data) + components for auth, members, audit, organization, dashboard |
| `src/components/ui/` | Small reusable building blocks |
| `src/lib/` | API client, types, permissions; `lib/server/` is server-only |
| `tests/` | Unit, hook, component and route-handler tests |
