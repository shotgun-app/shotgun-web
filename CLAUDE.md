# CLAUDE.md

Guidance for Claude Code working in this repo.

## What this is

`shotgun-web` - the Vue 3 front end of Shotgun, a carpooling app (drivers publish
trips, passengers book empty seats). The Go backend is a sibling repo at
`../shotgun-api` and is not implemented yet; this app runs against an in-memory
mock.

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
```

## Architecture rules

- **All fake data lives in `src/mock/data.ts`.** One file. Never hardcode users,
  trips or bookings anywhere else - import them from there.
- **`src/services/api.ts` is the only backend seam.** It exports the `Api`
  interface and picks `mock.ts` or `http.ts` based on `VITE_USE_MOCK_API`.
  Adding an endpoint means: add it to the interface, then to _both_
  implementations.
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
  uses: `.btn` + `.btn-primary` / `.btn-ghost`, `.field`, `.rise`. Used once?
  Keep it inline in the template.
- Long class lists wrap across lines; Prettier handles the formatting.

## Design direction: clean modern minimal

Keep new screens inside these rules. They are the reason the app looks
deliberate rather than generated.

- **Palette, locked.** `brand-*` is blue (primary actions, focus, avatar),
  `accent-*` is green and appears rarely - currently one highlighted word.
  Neutrals are one cool-grey ramp: `ink`, `ink-soft`, `line`, plus `night*` for
  dark mode. Never introduce a second grey family or a third accent.
- **Type.** Geist Variable, self-hosted (`@fontsource-variable/geist`), imported
  at the top of `main.css`. Never add a Google Fonts `<link>`. Headings are
  `font-medium tracking-tight`; hierarchy comes from weight, size and colour,
  not from bold-and-huge.
- **Shape, locked.** One radius: `rounded-card` (12px) for containers, inputs
  and buttons. Full-pill only for the avatar chip.
- **Dark mode is mandatory** on every new surface. Tailwind `dark:` variant,
  driven by the `.dark` class on `<html>`: with no stored pick the theme store
  follows `prefers-color-scheme`, and the toggle in the nav / on the landing
  page pins light or dark (stored under `shotgun.theme`). The page switches as a
  whole; a section must never invert on its own. No pure black, no pure white.
- **Motion is one primitive.** The `.rise` class, a 600ms settle on first paint,
  staggered with inline `animation-delay` when several elements enter together.
  It is disabled under `prefers-reduced-motion`. Do not add an animation
  library, scroll-driven animation or infinite loops.
- **Density is low.** Generous padding (`py-16` and up on app pages), short copy,
  few elements per screen. Hero text is at most three elements and fits the
  first viewport.
- **Images are real.** Landing uses a stock photo under the Unsplash License.
  Never fake a product screenshot out of `<div>`s, never hand-roll decorative
  SVG.
- **Copy rules.** No em-dashes anywhere visible (use a hyphen or two sentences).
  No eyebrow labels above every heading, no scroll cues, no decorative status
  dots, no invented precise statistics.
- **Icons:** Phosphor (`@phosphor-icons/vue`), one family only, introduced with
  the theme toggle (Sun / Moon). New icons must come from the same library
  rather than hand-pasted SVG paths.

## Routing and auth

- `/` landing (`guestOnly`), `/app` + `/app/profile` (`requiresAuth`), unknown
  paths redirect to `/`.
- The guard in `src/router/index.ts` calls `auth.restore()` once, then enforces
  the route meta. Don't duplicate auth checks inside components.
- Token lives in `localStorage` under `shotgun.token`, sent as
  `Authorization: Bearer <token>`. All storage access is wrapped in try/catch.

## Tests

- Unit tests live next to what they test in `__tests__/` folders: mock service,
  stores (auth, rides, trips, theme), router guards, and component suites.
- A new store, service method or guarded route ships with a unit test. A new
  user-visible flow ships with a Playwright test in `e2e/`.
- Component tests mount with a real Pinia and a real memory router, and run
  against the mock api rather than a stubbed service. Keep it that way: it
  exercises the seam the backend will later replace.
- The mock api has a built-in 350ms delay, so async component tests wait on a
  real timeout before asserting.
- `npm run test:unit` and `npm run test:e2e` must both pass before work is done.
  Playwright needs `npx playwright install chromium` once.

## Scope

Current sprint is **auth only**: register, login, logout, protected `/app`,
placeholder profile. Trip search, trip creation, bookings, ratings and CO2
stats are later tickets - the types and seed data exist, the screens do not.
Don't build them unasked; ask first.

## Conventions

- Prettier: no semicolons, single quotes, width 100. Run `npm run format`.
- Vue SFC order: `<script setup lang="ts">`, then `<template>`. No `<style>`.
- Comments explain _why_, and are sparse; the existing files set the density.
- Prefer real accessible markup (`role="menu"`, `aria-expanded`, `<label>`)
  over div soup - the vision doc calls out accessibility and high contrast.
