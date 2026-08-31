# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Anasendar** — a family calendar app. Currently **front-end only** (Angular/Ionic web app in `app/`) — no backend yet. See `app/../../../.claude/plans` history or ask the user for the fuller roadmap (real backend, auth, mobile packaging, server push) that this phase intentionally defers.

## Commands

All commands run from `app/`:

- `npm start` (alias `ng serve`) — dev server at http://localhost:4200
- `npm run build` (alias `ng build`) — production build to `app/www/`
- `npm test` (alias `ng test`) — Vitest unit tests, headless, single run
- `npm run lint` — ESLint

Run a single test file: `npx vitest run src/app/core/conflict/has-conflict.spec.ts`.

## Architecture

Standalone Angular components (no NgModules) on Ionic 9 / Angular 22, scaffolded via `ionic start ... --type=angular-standalone --capacitor`. Capacitor is wired in (`capacitor.config.ts`) but no native platform has been added yet (`npx cap add android/ios` is a later step) — the app currently only runs as a web app.

**Repository pattern is the key structural decision.** Every feature talks to data only through two interfaces injected via DI tokens — `EventsRepository` (`core/data/events-repository.model.ts`, token in `events-repository.token.ts`) and `ProfilesRepository` (same pattern) — never directly to storage. The only implementations today are `LocalStorageEventsRepository` / `LocalStorageProfilesRepository`, wired up in `main.ts`. When a real backend exists, add `Http*Repository` classes implementing the same interfaces and swap the provider in `main.ts` — no feature component should need to change.

**Conflict detection** (`core/conflict/has-conflict.ts`) is a pure function: two events conflict only if they belong to the *same profile* and their time ranges overlap (back-to-back events are not a conflict). It's called from inside `LocalStorageEventsRepository.create()`/`update()`, which throw a typed `ConflictError` (`core/data/events-repository.model.ts`) that the event form catches and displays. This is also where a future HTTP repository would surface the backend's 409 response, using the same error type.

**Cross-profile overlaps** (different family members booked at the same time) are informational, not blocked — computed separately by `core/conflict/find-cross-profile-overlaps.ts` and surfaced only on the Family Dashboard page.

**Profiles are sub-users with no login** — `ActiveProfileService` (`core/profile/`) just tracks which profile is "active" client-side (Netflix-profile style, no per-profile password). `features/calendar/calendar-page/` shows only the active profile's events; `features/calendar/dashboard-page/` shows every profile's events together, color-coded, plus the overlap panel.

**Voice reminders** (`core/voice/`): `ReminderWatcherService` polls every 20s while the app is open and speaks due reminders via `TtsService` (Web Speech API). This only works while the tab is open — there's no backend/push yet, so a reminder for an event that arrives while the tab is closed won't fire until the app is reopened.

**Calendar rendering** uses `angular-calendar` + `date-fns` (see `core/calendar/to-calendar-event.ts` for the `EventRecord` → `CalendarEvent` mapping). Its CSS is pulled in via `@import 'angular-calendar/scss/angular-calendar'` in `src/global.scss` — the package's `exports` map only allows the `scss/*` subpath, not `css/*`, despite what its README shows.
