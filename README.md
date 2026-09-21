# shotgun-web

Web client for **Shotgun**, a carpooling app: drivers publish trips they are
driving anyway, passengers book the empty seats.

This repo is the Vue 3 front end. The backend lives in a sibling repo,
[`../shotgun-api`](../shotgun-api) (Go), and is **not wired up yet** - the front
end currently runs against an in-memory mock.

## Status

Sprint scope is authentication only:

- `/` - public landing page: photographic hero on the left, login/register on the right.
- `/app` - protected area; visiting it logged out redirects to `/`.
- `/app/profile` - placeholder profile page.
- Top nav with a user dropdown (My profile, Log out).

Trip search, trip creation and bookings are separate tickets. Their domain types
and seed data already exist so those screens have something to read.

## Setup

```sh
npm install
npm run dev
```

Open http://localhost:5173. On the landing page, **Use demo account** fills the
seeded credentials:

| Email               | Password      |
| ------------------- | ------------- |
| `alice@shotgun.app` | `password123` |

Registering a new account works too, but the mock keeps accounts in memory only -
they are gone after a page reload.

## Scripts

```sh
npm run dev          # dev server
npm run build        # type-check + production build
npm run preview      # serve the production build
npm run test:unit    # Vitest
npm run test:e2e     # Playwright (npx playwright install on first run)
npm run lint         # oxlint + eslint, both with --fix
npm run format       # prettier
```

## Architecture

```
src/
  mock/data.ts        all hardcoded data (users, trips, bookings) - one file
  services/
    api.ts            the Api interface + which implementation is active
    mock.ts           in-memory implementation, reads mock/data.ts
    http.ts           fetch implementation against ../shotgun-api (not active)
  assets/main.css     Tailwind import, @theme design tokens, shared .btn/.field
  stores/auth.ts      Pinia store: the only owner of "who is logged in"
  router/index.ts     routes + the requiresAuth / guestOnly guard
  views/              LandingView, AppLayout, HomeView, ProfileView
  components/         PromoPanel, AuthPanel, TopNav
  types/index.ts      domain types shared by mock, http and UI
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

## Plugging in the real backend

1. Implement `POST /auth/register`, `POST /auth/login`, `POST /auth/logout` and
   `GET /auth/me` in `../shotgun-api`, returning the JSON shapes in
   `src/types/index.ts`.
2. Adjust paths/shapes in `src/services/http.ts` if the endpoints differ.
3. Create `.env.local`:

   ```sh
   VITE_USE_MOCK_API=false
   VITE_API_BASE_URL=http://localhost:8080
   ```

4. Delete `src/mock/` and `src/services/mock.ts` once nothing imports them
   (the "Use demo account" button in `AuthPanel.vue` is the last consumer).

The auth token is stored in `localStorage` under `shotgun.token` and sent as
`Authorization: Bearer <token>`.

## Recommended IDE setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar), with Vetur disabled.
