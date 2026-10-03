# Design system

The single reference for how Shotgun looks. Everything here lives in code:
tokens and shared classes in `src/assets/main.css`, small building blocks in
`src/components/`. If the two disagree, the code wins - fix this file.

Direction: **clean, modern, minimal.** Flat surfaces, one blue, one rare green,
generous space, short copy.

## Logo and icons

- App mark: `public/logo.png` (blue rounded square with a white "S" mark). Used next to the "Shotgun" wordmark in the top nav
  (`size-8`) and above the form on the auth screen (`size-10`; the photo hero carries no logo), always with `alt=""` because
  the wordmark is right beside it.
- Favicons, Apple touch icon and web manifest icons are in `public/`
  (`favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`,
  `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `site.webmanifest`).
- UI icons: **Phosphor** (`@phosphor-icons/vue`) only, `:size="16"` to `18`, with
  `aria-hidden="true"` when a text label or `aria-label` exists. No hand-drawn SVG.

## Color

Tokens are the `@theme` block in `main.css`; use them as utilities
(`bg-brand-600`, `text-ink-soft`, `border-line`, ...). No raw hex in components.

| Role           | Light                                                     | Dark                                     | Use                                                                                          |
| -------------- | --------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| Brand (blue)   | `brand-600` `#2563EB`, hover `brand-700`                  | `brand-400` `#60A2FA`, hover `brand-500` | primary buttons, links, focus, avatar, route arrow                                           |
| Brand tints    | `brand-50` `#EFF5FF`, `brand-100`, `brand-200`            | `brand-950` `#101C3D`                    | hover fills, ghost button hover                                                              |
| Accent (green) | `accent-600` `#059669`, `accent-700` text on `accent-100` | `accent-400` on `accent-700/20`          | success and "seats available" states, one highlighted word on the landing. Rare.             |
| Ink            | `ink` `#0F172A`                                           | `night-ink` `#E6EBF4`                    | body text and headings                                                                       |
| Ink soft       | `ink-soft` `#52607A`                                      | `night-ink-soft` `#94A3BB`               | secondary text, labels                                                                       |
| Line           | `line` `#E5E9F0`                                          | `night-line` `#1F293D`                   | borders and dividers                                                                         |
| Surface        | `white`                                                   | `night-raised` `#121A2B`                 | cards, inputs, menus                                                                         |
| Page           | `white`                                                   | `night` `#0B1120`                        | page background                                                                              |
| Danger         | Tailwind `red-50/200/600/700`                             | `red-950`, `red-400`, `red-300`          | destructive actions and errors, only through `.btn-danger*`, `.alert-error`, `.badge-danger` |

Rules:

- Blue is the only primary. Green is an accent, never a second primary.
- One cool-grey ramp (`ink`, `ink-soft`, `line`, `night*`). Never add another grey family.
- No pure black, no pure white text in dark mode.
- Body text on any surface must meet WCAG AA. `btn-primary` flips to dark-on-light in dark mode for that reason.

## Typography

- **Geist Variable**, self-hosted (`@fontsource-variable/geist`). Never a Google Fonts link.
- Hierarchy comes from size, weight and colour, not from bold-and-huge. Headings are
  `font-medium tracking-tight`; nothing uses `font-semibold` or `font-bold`.

| Class            | Style                          | Use                                             |
| ---------------- | ------------------------------ | ----------------------------------------------- |
| `.page-title`    | `text-3xl` medium              | one per page (`h1`)                             |
| `.page-lead`     | `text-sm`, `ink-soft`, `mt-2`  | line under the page title                       |
| `.section-title` | `text-lg` medium               | card and section headings (`h2`)                |
| body             | `text-sm`                      | default text                                    |
| `.meta`          | `text-xs`, `ink-soft`          | secondary line in a list row, hints, timestamps |
| `.field > span`  | `0.8125rem` medium, `ink-soft` | form labels                                     |

Copy: **sentence case** everywhere ("Find drivers", "Fully booked", "Reserve ride").
No em-dashes in visible text (use a hyphen or two sentences), no eyebrow labels above
headings, no invented statistics. Use an ellipsis character for in-progress labels
("Saving…", "Searching…").

## Shape, spacing, elevation

- **One radius:** `rounded-card` (12px) for cards, inputs, buttons, alerts, empty states.
  Exceptions: fully round (`rounded-full`) for avatars, badges and the icon-only swap
  button; `rounded-lg` for items inside a menu (nested inside a `rounded-card`).
- **Flat.** No shadows on cards or buttons. The only shadow is the top-nav dropdown menu.
- Page container: `max-w-5xl px-6 py-16` (`AppLayout`). Content pages (profile, rides,
  bookings) are `max-w-2xl` and must all match. Home uses the full container for its
  search grid.
- Spacing: `gap-4` between list items, `gap-5` between form fields, `gap-6` inside a
  card's form, `mt-8`/`mt-10` between a page header and its content. Cards use `p-6`.
- Section separation inside a page is a `border-t border-line pt-6` divider, not a box.

## Dark mode

Mandatory on every surface. Tailwind `dark:` variant, driven by the `.dark` class on
`<html>` (theme store: follows `prefers-color-scheme` until the user picks; stored under
`shotgun.theme`). The whole page switches together; a section never inverts alone.
Every colour utility you add needs its `dark:` pair.

## Shared classes (`main.css`, `@layer components`)

Use these instead of repeating utility strings. Only patterns used by more than one
component belong here; something used once stays inline.

| Class                                                            | What it is                                                                                                  |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `.btn`                                                           | base button: inline-flex, `rounded-card`, `px-4 py-2.5`, `text-sm` medium                                   |
| `.btn-primary`                                                   | filled blue. One per view region.                                                                           |
| `.btn-ghost`                                                     | bordered neutral, blue tint on hover. Secondary actions, Cancel.                                            |
| `.btn-danger`                                                    | outlined red. First step of a destructive action.                                                           |
| `.btn-danger-solid`                                              | filled red. Only the confirm step ("Yes, delete").                                                          |
| `.field`                                                         | label wrapper: `<label class="field"><span>Label</span><input/></label>`                                    |
| `.input`                                                         | the same control styling for inputs that are not a direct child of `.field` (`PhoneInput`, `PasswordInput`) |
| `.card`                                                          | the one container: border, surface, `p-6`, no shadow                                                        |
| `.empty`                                                         | dashed box for "nothing here yet"                                                                           |
| `.alert` + `.alert-error` / `.alert-success`                     | inline message. Errors use `role="alert"`.                                                                  |
| `.badge` + `.badge-neutral` / `.badge-success` / `.badge-danger` | small status pill (rating, seats left)                                                                      |
| `.page-title`, `.page-lead`, `.section-title`, `.meta`           | typography, see above                                                                                       |
| `.rise`                                                          | the single motion primitive (see below)                                                                     |

Disabled controls (`:disabled` on `.input` / `.field` inputs and selects) are flat, dashed,
dimmed and show a not-allowed cursor. Disabled buttons dim to 60% and show a progress cursor.

## Components

- `UserAvatar` - initials on `brand-600`. Sizes `sm` (nav), `md` (trip card), `lg` (profile).
- `ProfileDetails` - read-only name, email, phone and member since. Used on your own profile
  and on other users' profiles, so a new profile field shows up on both.
- `RouteLine` - "Origin → Destination", the arrow in brand blue. Used on every trip row.
- `PasswordInput` - password field with a show/hide eye button (Phosphor `PhEye`/`PhEyeSlash`).
- `PhoneInput` - country-code select plus number, `v-model` is E.164. Phone is required on
  register and in the profile.
- `SeatStepper` - minus / number / plus for seat counts (trip booking, booking edit, free
  seats on a ride). Buttons clamp to `min`/`max`; typing still works so forms can report errors.
  Wrap it in `div.field`, not `label.field` (a label would trigger the first button).
- `ThemeToggle` - borderless, transparent icon button (moon in light, sun in dark).
- `TripCard`, `TripSearch` - built only from the shared classes above.
- `src/utils/format.ts` - `formatDeparture` (the one date format) and `initialsOf`.

## Patterns

- **Page header:** `h1.page-title` + `p.page-lead`; an optional primary action sits right,
  aligned with the title.
- **List of things:** `ul.grid.gap-4` of `li.card`. Row: `RouteLine`, then `.meta` lines,
  actions on the right (`btn-ghost`, `btn-danger`).
- **Destructive action:** two steps. `btn-danger` reveals "Are you sure?" text in red plus
  `btn-danger-solid` and a `btn-ghost` cancel. Never delete on the first click.
- **Forms:** labels above fields, errors in an `.alert-error` above the buttons, submit is
  `btn-primary`, Cancel is `btn-ghost`. Show `Saving…` while pending and disable both buttons.
- **States:** loading is a `.meta` line ("Loading your rides…") or the centered spinner card
  on Home; empty is `.empty`; errors are `.alert-error`. Every list view has all three.
- **Auth screen:** below `lg` the photo is a full-screen background (darkened), the headline sits on it and the form is a white card; from `lg` up it is a half / half split (photo left, form right). No tabs. One form with a "New to Shotgun? Create an account" / "Already
  have an account? Log in" text switch below it.

## Motion

One primitive: `.rise`, a 600ms settle on first paint, staggered with inline
`animation-delay` when several elements enter together. It is off under
`prefers-reduced-motion`. Colour transitions are `duration-200`. No animation library,
scroll-driven animation or infinite loops (the loading spinner is the one exception).

## Accessibility

- Real semantic markup: `<label>`, `role="menu"`, `aria-expanded`, `role="alert"` on errors.
- Icon-only buttons need `aria-label`; toggle buttons use `aria-pressed`.
- Focus is visible everywhere (`:focus-visible` outline in brand blue) - never remove it.
- Do not convey state by colour alone (badges carry text).

## Checklist for new UI

1. Built from shared classes and components? No new one-off card, alert, badge or danger button.
2. Sentence case, no em-dashes, no eyebrow labels.
3. Light and dark checked, `dark:` pair on every colour.
4. Loading, empty and error states present.
5. Width, spacing and radius match the values above.
6. Icons from Phosphor; icon-only buttons labelled.
7. Anything new that repeats in two places goes into `main.css` and into the table above.
