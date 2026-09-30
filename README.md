<div align="center">
  <img src="https://raw.githubusercontent.com/shotgun-app/.github/main/content/logo.png" alt="Shotgun App logo" height="70" />
  <h1 align="center">shotgun-web</h1>
</div>

# shotgun-web

Web client for **Shotgun**, a carpooling app: drivers publish trips they are
driving anyway, passengers book the empty seats.

This repo is the Vue 3 front end. The backend lives in a sibling repo,
[`../shotgun-api`](../shotgun-api) (Go).

## Status

Auth and profile use the real API:

- `/` - public landing page: photographic hero on the left, login/register on the right.
- `/app` - protected area; visiting it logged out redirects to `/`. Home shows a time-based greeting and trip search.
- `/app/profile` - name, email, phone (with country code), change password, delete account.
- `/app/rides` and `/app/bookings` - screens exist, but the API has no ride or booking endpoints yet.
- Top nav with a user dropdown (profile, bookings, rides, log out).

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
npm run check:format # prettier --check (CI)
npm run check:lint   # oxlint + eslint without --fix (CI)
```

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on every pull request and on
`main`. A pull request can only be merged into `main` when all of these checks
pass:

| Check        | Runs                                          |
| ------------ | --------------------------------------------- |
| `Format`     | `npm run check:format`                        |
| `Lint`       | `npm run check:lint` and `npm run type-check` |
| `Unit tests` | `npx vitest run`                              |

If `Format` fails, run `npm run format` and commit the result.

## Architecture

```
src/
  services/
    api.ts            the Api interface; `api` is the HTTP client
    http.ts           fetch client for ../shotgun-api (sends the session cookie)
  test/               test-only fake api + seed data (installed by vitest setup)
  utils/              locations, greeting, dial codes, date/initials formatting
  assets/main.css     Tailwind import, @theme design tokens, shared classes (see DESIGN.md)
  stores/auth.ts      Pinia store: the only owner of "who is logged in"
  router/index.ts     routes + the requiresAuth / guestOnly guard
  views/              LandingView, AppLayout, HomeView, ProfileView, RidesView, BookingsView
  components/         AuthPanel, TopNav, TripCard, TripSearch, UserAvatar, RouteLine, ...
  types/index.ts      domain types shared by http and UI
```

Components never call a service directly - they go through a Pinia store, which
calls `api` from `src/services/api.ts`.

### Styling

Tailwind CSS v4 through `@tailwindcss/vite`. There is no `tailwind.config.js`:
the whole configuration is the `@theme` block in `src/assets/main.css`. Styling
is utility classes in templates, and no SFC carries a `<style>` block.

**Design direction:** clean modern minimal. The full design system - colour
tokens, typography, shape and spacing, shared classes (`.btn-*`, `.card`,
`.alert-*`, `.badge-*`, `.empty`, ...), components, patterns and a checklist for
new UI - is in [`DESIGN.md`](DESIGN.md). Read it before adding or changing any
screen, and keep it in step with `src/assets/main.css`.

- **Images** - the landing photograph is stock (highway traffic, free under the
  Unsplash License, served from `images.unsplash.com`). Swap the `src` in
  `PromoPanel.vue` when real brand photography exists.

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
