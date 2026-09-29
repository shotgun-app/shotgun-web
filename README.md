<div align="center">
  <img src=https://raw.githubusercontent.com/shotgun-app/.github/main/content/logo.svg
  alt="Shotgun App logo" height="70" />
  <h1 align="center">shotgun-web</h1>
</div>

# shotgun-web

Web client for **Shotgun**, a carpooling app: drivers publish trips they are
driving anyway, passengers book the empty seats.

This repo is the Vue 3 front end. The backend lives in a sibling repo,
[`../shotgun-api`](../shotgun-api) (Go).

## Status

Sprint scope is authentication only:

- `/` - public landing page: photographic hero on the left, login/register on the right.
- `/app` - protected area; visiting it logged out redirects to `/`.
- `/app/profile` - placeholder profile page.
- Top nav with a user dropdown (My profile, Log out).

Trip search, trip creation and bookings are separate tickets.

## Setup

Start the API and database first (see [`../shotgun-api`](../shotgun-api)):
`docker compose up -d --build` there, it listens on http://localhost:8080.

```sh
npm install
npm run dev
```

Open http://localhost:5173 and register an account. The API base URL defaults to
`http://localhost:8080`; override it with `VITE_API_BASE_URL` in `.env.local`.

## Scripts

```sh
npm run dev          # dev server
npm run build        # type-check + production build
npm run preview      # serve the production build
npm run test:unit    # Vitest
npm run test:e2e     # Playwright, needs the API running (npx playwright install chromium first)
npm run lint         # oxlint + eslint, both with --fix
npm run format       # prettier
```

## Architecture

```
src/
  services/
    api.ts            the Api interface; `api` is the HTTP client
    http.ts           fetch client for ../shotgun-api (sends the session cookie)
  test/               test-only fake api + seed data (installed by vitest setup)
  utils/locations.ts  countries/cities and date helpers for the forms
  assets/main.css     Tailwind import, @theme design tokens, shared .btn/.field
  stores/auth.ts      Pinia store: the only owner of "who is logged in"
  router/index.ts     routes + the requiresAuth / guestOnly guard
  views/              LandingView, AppLayout, HomeView, ProfileView
  components/         PromoPanel, AuthPanel, TopNav
  types/index.ts      domain types shared by http and UI
```

Components never call a service directly - they go through a Pinia store, which
calls `api` from `src/services/api.ts`.

### Styling

Tailwind CSS v4 through `@tailwindcss/vite`. There is no `tailwind.config.js`:
the whole configuration is the `@theme` block in `src/assets/main.css`. Styling
is utility classes in templates, and no SFC carries a `<style>` block.

**Design direction:** clean modern minimal. Type-led, generous whitespace, one
photograph, no decorative chrome. Concretely:

- **Type** - Geist Variable, self-hosted via `@fontsource-variable/geist`. No
  Google Fonts `<link>`, no runtime font request to a third party. Headings run
  `font-medium tracking-tight`, not bold-and-huge.
- **Palette** - two brand ramps plus one cool-grey neutral ramp:

  | Token                     | Colour | Used for                                    |
  | ------------------------- | ------ | ------------------------------------------- |
  | `brand-*`                 | blue   | primary actions, focus rings, avatar        |
  | `accent-*`                | green  | the one highlighted word, eco/CO2 messaging |
  | `ink`, `ink-soft`, `line` | slate  | text, secondary text, borders (light mode)  |
  | `night*`                  | slate  | surfaces and text in dark mode              |

  One accent, used the same way everywhere. Changing the palette means editing
  those tokens in one place.

- **Shape** - a single radius token (`rounded-card`, 12px) for every container,
  input and button. Full-pill is reserved for the avatar chip.
- **Dark mode** - follows `prefers-color-scheme` through Tailwind's `dark:`
  variant. The whole page switches together; sections never invert
  independently. No pure black, no pure white.
- **Motion** - one primitive, the `.rise` class: a 600ms settle on first paint.
  It collapses to nothing under `prefers-reduced-motion: reduce`. There is no
  animation library and no scroll-driven animation.
- **Images** - the landing photograph is stock (highway traffic, free under the
  Unsplash License, served from `images.unsplash.com`). Swap the `src` in
  `PromoPanel.vue` when real brand photography exists.

The small `@layer components` block holds the patterns used by more than one
component: `.btn`, `.btn-primary`, `.btn-ghost`, `.field`, `.rise`.

### Layout

`/` is a half-and-half split: the photographic hero on the left, the auth form
on the right, separated by a real 1px divider (vertical from `lg` up, horizontal
once it stacks). The hero carries three text elements only - wordmark, headline,
one sentence - and fits the first viewport at every breakpoint.

## Tests

Unit tests (Vitest + jsdom) run against an in-memory fake of the `Api` interface
(`src/test/fakeApi.ts`, installed in `src/test/setup.ts`), so they need no
backend. Call `resetFakeApi()` in `beforeEach`. The fake keeps one "current user",
like the browser's session cookie.

End-to-end tests (Playwright, `e2e/`) drive a real browser against the **real API
and database**: start `docker compose up -d --build` in `../shotgun-api` first.
They cover registration, login, logout, duplicate email, wrong password, session
survival across a reload and the profile page.

## Authentication

Login and register make the API set an HttpOnly `session` cookie (random token,
stored in the `sessions` table). The browser sends it on every request
(`credentials: 'include'`); JavaScript never sees the token. Logout deletes the
session row and clears the cookie. The router guard calls `GET /auth/me` once on
boot to restore the session. The API must allow this origin with credentials
(`ALLOWED_ORIGIN`, default `http://localhost:5173`).

## Recommended IDE setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar), with Vetur disabled.
