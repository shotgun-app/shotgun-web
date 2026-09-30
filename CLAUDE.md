# CLAUDE.md

Guidance for Claude Code working in this repo.

## What this is

`shotgun-web` - the Vue 3 front end of Shotgun, a carpooling app (drivers publish
trips, passengers book empty seats). The Go backend is a sibling repo at
`../shotgun-api`. Auth (register, login, logout, profile, password) is real,
using an HttpOnly session cookie. Trips, rides and bookings have no backend
endpoints yet, so those screens show errors until the API has them.

## Stack

Vue 3 (`<script setup>`, Composition API) · TypeScript · Vite · vue-router ·
Pinia (setup stores) · **Tailwind CSS v4** · Vitest · Playwright ·
ESLint + oxlint + Prettier.

## Commands

```sh
npm run dev
npm run type-check      # vue-tsc, must pass before saying work is done
npm run test:unit
npm run test:e2e
npm run lint
npm run format
npm run check:format    # prettier --check, what CI runs
npm run check:lint      # oxlint + eslint without --fix, what CI runs
```

## CI

`.github/workflows/ci.yml` runs on every pull request and on `main`. Its jobs
`Format`, `Lint` (lint + type-check) and `Unit tests` are required checks: a PR
cannot merge into `main` until all three pass. Run `npm run format` before
committing.

## Architecture rules

- **No fake data in the app.** Seed data and the in-memory fake api exist only
  under `src/test/` for unit tests. Never hardcode users, trips or bookings in
  app code.
- **`src/services/api.ts` is the only backend seam.** It exports the `Api`
  interface and `api` (the `http.ts` client). Adding an endpoint means: add it to
  the interface, then to `http.ts` and to `src/test/fakeApi.ts`.
- **Components never call services.** UI → Pinia store → `api`. Today that is
  `src/stores/auth.ts`; follow the same shape for new stores.
- **Errors** are always `ApiError` (`src/types/index.ts`). Stores turn them into
  a plain string in `error`; components render that, never a raw exception.
- **Types in `src/types/index.ts`** mirror the JSON contract expected from
  `../shotgun-api`. Change them in step with the backend, not ahead of it.
- Path alias `@/` → `src/`.

## Styling - Tailwind only

- **Tailwind v4, utility classes in the template.** No `<style>` blocks in SFCs,
  no scoped CSS, no second CSS file. Configured via `@tailwindcss/vite`; there
  is no `tailwind.config.js` in v4.
- **All design tokens live in the `@theme` block of `src/assets/main.css`.**
  Tailwind turns each into utilities: `--color-brand-600` gives `bg-brand-600`,
  `text-brand-600`, `border-brand-600`, and so on.
- `@layer components` in the same file holds only what more than one component
  uses (full list in `DESIGN.md`). Used once? Keep it inline in the template.
- Long class lists wrap across lines; Prettier handles the formatting.

## Design system

**`DESIGN.md` is the source of truth for how the UI looks.** Read it before adding
or changing any screen, and update it in the same change when a token, shared
class or pattern changes. The essentials:

- Build from the shared classes in `main.css` (`.btn-*`, `.card`, `.field`, `.input`,
  `.alert-*`, `.badge-*`, `.empty`, `.page-title`, `.page-lead`, `.section-title`,
  `.meta`) and the shared components (`UserAvatar`, `RouteLine`, `PasswordInput`,
  `PhoneInput`). Never re-type a card, alert, badge or danger-button utility string.
- Palette is locked: blue `brand-*` is the only primary, green `accent-*` is rare, one
  cool-grey ramp. One radius, `rounded-card`. Flat: no shadows on cards.
- Dark mode is mandatory: every colour utility gets a `dark:` pair.
- Sentence case, no em-dashes, no eyebrow labels, no invented statistics.
- Icons: Phosphor only. Font: Geist Variable, self-hosted. Motion: only `.rise`.
- Every list view has loading, empty and error states.
- Destructive actions take two steps (`btn-danger`, then `btn-danger-solid`).

## Routing and auth

- `/` landing (`guestOnly`), `/app` + `/app/profile` (`requiresAuth`), unknown
  paths redirect to `/`.
- The guard in `src/router/index.ts` calls `auth.restore()` once, then enforces
  the route meta. Don't duplicate auth checks inside components.
- Session is an HttpOnly cookie set by the API; requests use
  `credentials: 'include'`. The frontend never handles the token. All
  `localStorage` access (theme) is wrapped in try/catch.

## Tests

- Unit tests live next to what they test in `__tests__/` folders: stores (auth, rides, trips, theme), router guards, and component suites.
- A new store, service method or guarded route ships with a unit test. A new
  user-visible flow ships with a Playwright test in `e2e/`.
- Component tests mount with a real Pinia and a real memory router. The api is
  swapped for `src/test/fakeApi.ts` by `src/test/setup.ts`; call `resetFakeApi()`
  in `beforeEach`. The fake has no latency.
- Playwright tests run against the real API + database (`docker compose up -d
--build` in `../shotgun-api` first).
- `npm run test:unit` and `npm run test:e2e` must both pass before work is done.
  Playwright needs `npx playwright install chromium` once.

## Scope

Auth and profile are done and talk to the real API. The trip search, rides and
bookings screens exist but wait for their backend endpoints. Ratings and CO2
stats are later tickets. Don't build them unasked; ask first.

## Conventions

- Prettier: no semicolons, single quotes, width 100. Run `npm run format`.
- Vue SFC order: `<script setup lang="ts">`, then `<template>`. No `<style>`.
- Comments explain _why_, and are sparse; the existing files set the density.
- Prefer real accessible markup (`role="menu"`, `aria-expanded`, `<label>`)
  over div soup - the vision doc calls out accessibility and high contrast.

## Commits

- Do not add `Co-Authored-By` trailers or any other attribution for AI agents
  to commit messages or pull requests.
