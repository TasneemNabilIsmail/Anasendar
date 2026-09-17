# Anasendar — Architecture & Functionality

Anasendar is a family calendar app. This phase is **front-end only** (Angular 22 /
Ionic 9, standalone components, scaffolded via `ionic start ... --type=angular-standalone
--capacitor`) — there is no backend yet. Capacitor is wired in (`capacitor.config.ts`,
`appId: com.anasendar.app`, `webDir: www`) but no native platform has been added
(no `android/`/`ios/` directories, `npx cap ls` reports none) — today the app only
runs as a web app.

## Repository pattern

Every feature talks to data only through two interfaces injected via DI tokens,
never directly to storage:

- **`EventsRepository`** (`core/data/events-repository.model.ts`, token
  `EVENTS_REPOSITORY`): `list(profileId)`, `listAll()`, `create(profileId, input)`,
  `update(id, input)`, `remove(id)`, `markReminderSent(id, sentAt)`.
- **`ProfilesRepository`** (same pattern, token `PROFILES_REPOSITORY`):
  `list()`, `create(input)`, `update(id, input)`, `remove(id)`.

The only implementations today are `LocalStorageEventsRepository` /
`LocalStorageProfilesRepository`, wired up in `main.ts`.

- `LocalStorageEventsRepository` — key `calendar.events`. In-memory
  `BehaviorSubject<EventRecord[]>` seeded from storage; dates are serialized to/from
  ISO strings. `create`/`update` reject with a plain `Error` if `endAt <= startAt`
  ("End time must be after start time."), or throw a typed `ConflictError` (which
  carries the `conflictingEvent`) if `hasConflict()` finds a same-profile overlap.
- `LocalStorageProfilesRepository` — key `calendar.profiles`. Seeds a default
  profile `{ displayName: 'Me', colorHex: '#3B82F6', isDefault: true }` if storage
  is empty/corrupt. `remove()` reseeds the default profile if deleting would leave
  zero profiles — a family can never end up with none.

When a real backend exists, add `Http*Repository` classes implementing the same
interfaces and swap the provider in `main.ts` — no feature component needs to change.
A future HTTP repository would surface the backend's 409 response as the same
`ConflictError` type.

## Profiles ("family members")

Profiles are **sub-users with no login** — Netflix-profile style. There's no
per-profile password; anyone using the device can switch profiles.

- **`ActiveProfileService`** (`core/profile/active-profile.service.ts`) tracks
  which profile is "active" client-side. Stores the active id in localStorage
  under `calendar.activeProfileId`. `activeProfile$` combines the live profile
  list with the stored id: if the stored id matches an existing profile, use it;
  otherwise it falls back to `profiles.find(p => p.isDefault) ?? profiles[0]` and
  self-heals by calling `setActiveProfile()` on that fallback (handles a deleted
  or never-set profile).
- **`ProfileSwitcherComponent`** (`core/profile/profile-switcher/`) renders a row
  of profile chips (`IonChip`) in the calendar page header; clicking one calls
  `setActiveProfile(id)`.
- **`ManageProfilesPage`** (`features/profiles/manage-profiles.page.ts`) is the
  family-member admin screen:
  - `addProfile()` creates a profile with a color from a fixed 8-color
    `PALETTE` (`#3B82F6, #EF4444, #10B981, #F59E0B, #8B5CF6, #EC4899, #14B8A6,
    #F97316`), then randomizes the next suggested color.
  - Inline rename/recolor via `startEdit` / `saveEdit` / `cancelEdit`.
  - `remove(profile)` confirms via a native `confirm()` dialog, then cascades:
    deletes every event owned by that profile before removing the profile itself.
  - `selectActive(profile)` sets it as the active profile.

## Calendar rendering

`core/calendar/to-calendar-event.ts` maps an `EventRecord` to the `CalendarEvent`
shape `angular-calendar` expects:

- `toCalendarEvent(event, profile, includeProfileName = false)`
- Color: `profile?.colorHex ?? '#3B82F6'`, set as
  `{ primary: color, secondary: color + '33' }` (the `33` suffix is ~20% alpha,
  giving the lighter "secondary" background shade angular-calendar uses for the
  event block).
- When `includeProfileName` is `true` (dashboard only), the profile's display
  name is appended to the title, e.g. `Dentist (Alex)`.
- `meta: { eventId, profileId }` is attached for click-through routing.

`angular-calendar`'s CSS is pulled in via
`@import 'angular-calendar/scss/angular-calendar'` in `src/global.scss` — the
package's `exports` map only allows the `scss/*` subpath, not `css/*`, despite
what its README shows.

## Pages / routes (`app.routes.ts`)

All lazy-loaded via `loadComponent`:

| Route | Component | Purpose |
|---|---|---|
| `''` | redirects to `calendar` | |
| `calendar` | `CalendarPageComponent` | Active profile's personal calendar |
| `dashboard` | `DashboardPageComponent` | Family Dashboard — every profile at once |
| `profiles` | `ManageProfilesPage` | Add/edit/remove family members |
| `events/new` | `EventFormPage` | Create an event |
| `events/:id/edit` | `EventFormPage` | Edit/delete an existing event |

### My Calendar (`features/calendar/calendar-page/`)

- Uses `angular-calendar` + `date-fns` adapter (`provideCalendar`), with
  Month / Week / Day views (`view: CalendarView`, defaults to `Week`) toggled by
  toolbar buttons, plus previous/today/next navigation bound to `[(viewDate)]`.
- Shows **only the active profile's** events: an `events` signal built from
  `activeProfile$.pipe(switchMap(profile => eventsRepo.list(profile.id)))`,
  mapped through `toCalendarEvent` (without the profile-name suffix).
- Embeds `<app-profile-switcher>` in the header, plus a link to `/dashboard`.
- Clicking an event navigates to `/events/:id/edit` (via `event.meta.eventId`).
- Clicking a day cell, or the floating action button, navigates to
  `/events/new`; the day-cell click also passes `?date=<iso>` so the form
  prefills a 1-hour event starting at that time.

### Family Dashboard (`features/calendar/dashboard-page/`)

Read-only aggregate view — no create button:

- Shows **every profile's** events together, color-coded by profile, with the
  profile name appended to each title (`toCalendarEvent(event, profile, true)`).
- A legend at the top lists each profile as a colored dot + name
  (`profile.colorHex`).
- **Cross-profile overlap panel**: `core/conflict/find-cross-profile-overlaps.ts`
  does an O(n²) pairwise scan of *all* events, skipping pairs that belong to the
  same profile, and flags a pair when `a.startAt < b.endAt && a.endAt >
  b.startAt`. Results are sorted by start time. This is purely informational —
  unlike same-profile conflicts, it never blocks saving. The panel (rendered
  only when there's at least one overlap) shows a count badge, then one row per
  pair with both profiles' names, the overlapping time range, and both event
  titles.

### Event form (`features/event-form/event-form.page.ts`)

A reactive form (`fb.nonNullable.group`) with fields:

- `title` (required), `description`, `location`
- `startAt` / `endAt` — native `datetime-local` inputs, required
- `reminderMinutesBefore` — select with options `[0, 5, 10, 15, 30, 60]`
  (`0` = "No reminder")

There is **no profile picker** in the form — a new event is always created
under the currently active profile
(`activeProfileService.activeProfile$` read synchronously via `take(1)`).

- Edit mode is detected from the `:id` route param; the event is looked up via
  `eventsRepo.listAll()` and the form redirects back to `/calendar` if it's not
  found.
- A `?date=` query param (from the calendar's day-cell click) prefills a new
  event's start/end.
- `save()`: if the form is invalid, marks all fields touched and stops.
  Otherwise calls `eventsRepo.create()`/`.update()`. On success, navigates to
  `/calendar`. On failure, catches `ConflictError` and generic `Error` and shows
  the message via `<ion-note color="danger">` — a `ConflictError`'s message is
  built as `Conflicts with "<title>" (<start> – <end>)`.
- In edit mode only, a delete button removes the event and navigates back to
  `/calendar`.

## Conflict detection vs. cross-profile overlaps

Two distinct mechanisms, easy to conflate:

| | Same-profile conflict | Cross-profile overlap |
|---|---|---|
| Function | `core/conflict/has-conflict.ts` | `core/conflict/find-cross-profile-overlaps.ts` |
| Scope | Same profile only | Different profiles only |
| Effect | **Blocks** save — repository throws `ConflictError`, form shows error | **Informational only** — shown on the Family Dashboard, never blocks |
| Rule | Overlapping time ranges for the same person conflict; back-to-back events do not | Any two different profiles' events whose time ranges overlap |

## Reminders / "notifications"

Entirely client-side — no push, no service worker, no backend. Reminders only
fire while the app tab is open.

1. **Setting one** — the event form's `reminderMinutesBefore` select
   (`0/5/10/15/30/60` minutes before start) is stored on the `EventRecord`.
   `reminderSentAt` starts unset.
2. **Persistence** — `LocalStorageEventsRepository` serializes `reminderSentAt`
   to/from an ISO string and exposes `markReminderSent(id, sentAt)` so a
   reminder is never announced twice.
3. **Polling loop** — `ReminderWatcherService` (`core/voice/`) is started once,
   from `AppComponent`'s constructor, for the life of the app session:
   - Requests `Notification` permission up front.
   - Runs a check immediately, then every 20s (`CHECK_INTERVAL_MS`).
   - Each tick loads *all* events + profiles and, for every event with an unset
     reminder, computes `fireAt = startAt - reminderMinutesBefore`. If `now` has
     passed `fireAt` but the event hasn't started yet, it fires.
4. **Firing** — `announce()` builds a message like
   `"Reminder. Alex: Dentist starts in 15 minutes."` and:
   - **Speaks it** via `TtsService.speak()` (`core/voice/tts.service.ts`), a
     thin wrapper over the Web Speech API (`SpeechSynthesisUtterance`). Works
     only while the page is open/foregrounded — no browser can synthesize
     speech for a backgrounded or closed tab. A later Capacitor branch
     (`@capacitor-community/text-to-speech`) can slot in behind the same
     `speak()` method for native builds.
   - **Shows a browser notification** via the native `Notification` API, only
     if permission was granted.
   - Calls `markReminderSent` so it won't repeat.

**Known limitation, by design:** if the tab is closed when a reminder should
fire, it simply doesn't — and if the app is reopened *after* the event's start
time has already passed, the `now > event.startAt` guard skips it rather than
announcing a stale reminder. Real push notifications (so reminders fire even
with the app closed) are deferred to the backend phase.

## Testing & commands

All commands run from `app/`:

- `npm start` (`ng serve`) — dev server at http://localhost:4200
- `npm run build` (`ng build`) — production build to `app/www/`
- `npm test` (`ng test`) — Vitest unit tests, headless, single run
  - Single file: `npx vitest run src/app/core/conflict/has-conflict.spec.ts`
- `npm run lint` — ESLint
