# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start development server (port 3000)
npm run build    # Production build
npm run lint     # Run ESLint
```

No test suite is configured. There is no `npm test` command.

## Architecture

**CrewWise** is a mobile-first group collaboration platform (모임 관리). The UI targets a single-column 390px max-width layout.

### Routing (`src/app/`)

App Router with file-based routing:

- `/` — Public landing page
- `/auth/*` — Login, signup, reset-password, find-email
- `/main` — Post-login home
- `/groups` — Group listing
- `/[id]/*` — Dynamic group workspace: `home`, `members`, `events`, `votes`, `notices`, `missions`, `minutes`, `news`
- `/[id]/notices/[noticeId]`, `/[id]/events/[eventId]` — Detail pages

**Next.js 15 breaking change**: dynamic params are a `Promise`. Always `await` them:
```ts
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

### State & Data Fetching

- **Auth state**: Zustand store at `src/store/authStore.ts` — token persisted to `localStorage`, accessed via `useAuthStore`
- **Server state**: React Query (`@tanstack/react-query`) — `QueryClientProvider` is in root layout via `Providers`
- **HTTP client**: Axios instance at `src/lib/api.ts` — automatically injects `Authorization: Bearer <token>` from `localStorage` on every request. Base URL from `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8080`)

### Conventions

- `'use client'` directive required for any component using hooks, state, or browser APIs
- Path alias `@/*` → `src/*`
- UI text is in Korean
- Tailwind CSS 4 for all styling (no CSS modules or styled-components)
