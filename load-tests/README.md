# k6 Load Testing (Feature-Based)

This folder contains the k6 setup for feature-level load testing.

Current layout pattern:

- `load-tests/suites/<area>.js` is the suite entrypoint used by the package scripts
- `load-tests/features/<area>/scenario.js` contains options and scenario flow
- `load-tests/features/<area>/requests.js` contains request helpers

## Included Suites

### 1. Movie and Showtime Selection

Request paths:

- `GET /api/trpc/movies.nowPlaying`
- `GET /api/trpc/showtimes.getByMovie`

Default baseline:

- `20` constant VUs
- `5m` steady run
- approximately `200` requests/minute total

Commands:

```bash
pnpm test:load
pnpm test:load:dashboard
```

Dashboard details:

- open `http://localhost:5665`
- exported report: `load-tests/results/dashboard-report.html`

### 2. Feature 4: Booking

This suite exercises the booking flow only until the checkout review page. It does not confirm the booking.

Request paths used during the main scenario:

- `GET /api/trpc/showtimeSeats.getByShowtime`
- `POST /api/trpc/bookingSession.update`

Scenario flow:

1. `setup()` only validates config and starts the suite quickly.
2. Each VU resolves its assigned seeded load-test user on first use.
3. Each request carries that user identity in `x-load-test-user-email`.
4. The app runs with `LOAD_TEST_MODE=true` and treats that seeded user as authenticated.
5. The suite auto-resolves the first future showtime with enough available seats for the configured booking load.
6. Each VU creates its own booking session for that target showtime and advances it to `SEAT_SELECTION`.
7. Each iteration loads the seat map for that user.
8. Each iteration moves the booking session to `CHECKOUT`.
9. Each iteration immediately rewinds back to `SEAT_SELECTION` so held seats are released for the next loop.
10. Long-running VUs recreate their booking session before the app's 5 minute booking-session expiry window.

Default booking baseline:

- `20` constant VUs
- `5m` steady run
- `1` ticket per booking session
- approximately `300` requests/minute total

Commands:

```bash
pnpm test:load:booking
pnpm test:load:booking:dashboard
```

Dashboard details:

- open `http://localhost:5666`
- exported report: `load-tests/results/booking-dashboard-report.html`

## Docker-First Setup

Use the official `grafana/k6` image. No local k6 install is required.

Create an env file once:

```bash
cp load-tests/.env.example load-tests/.env
```

Populate `load-tests/.env` with your values.

If you are targeting a local app:

- run your app locally with `pnpm dev`
- keep `BASE_URL=http://host.docker.internal:3000`

### Booking Quick Start

For someone cloning the branch, the booking suite now has one supported setup:

1. Seed at least as many booking load-test users as `BOOKING_LOAD_VUS`.
2. Seed at least one future showtime with enough seats for `BOOKING_LOAD_VUS * BOOKING_TICKET_COUNT`.
3. Set `LOAD_TEST_MODE=true` in the app env before starting the app.
4. Copy `load-tests/.env.example` to `load-tests/.env`.
5. Set `TEST_USER_EMAILS` to the seeded user emails.
6. Adjust `BOOKING_LOAD_VUS` if needed.
7. Run `pnpm test:load:booking` or `pnpm test:load:booking:dashboard`.

What the booking suite resolves automatically:

- the target showtime id
- the movie/showtime pair used for the run

What another developer still needs to provide:

- seeded booking users
- a seeded future showtime with enough seats
- `LOAD_TEST_MODE=true` in the app env
- `TEST_USER_EMAILS` in `load-tests/.env`

## Environment Variables

### Shared target and pacing

- `BASE_URL`
  default: `http://host.docker.internal:3000`
- `SLEEP_SECONDS`
  optional shared pacing knob
- `ITERATION_SECONDS`
  optional shared iteration target, default `12`

### Shared load profile

- `LOAD_VUS`
  default: `20`
- `LOAD_DURATION`
  shared default for suites that do not override duration
- `LOAD_GRACEFUL_STOP`
  default: `30s`

### Movie/showtime suite

- `NOW_PLAYING_LIMIT`
  optional input for `movies.nowPlaying`
- `MOVIE_SHOWTIME_LOAD_VUS`
- `MOVIE_SHOWTIME_LOAD_DURATION`
- `MOVIE_SHOWTIME_LOAD_GRACEFUL_STOP`
- `MOVIE_SHOWTIME_ITERATION_SECONDS`

### Booking suite

- `LOAD_TEST_MODE`
  required for booking load testing; set it in both the app env and `load-tests/.env`
- `BOOKING_TICKET_COUNT`
  optional, default `1`
- `TEST_USER_EMAILS`
  required comma-separated seeded booking load-test users; you need at least as many emails as booking VUs
- `BOOKING_LOAD_VUS`
- `BOOKING_LOAD_DURATION`
  default `5m`
- `BOOKING_LOAD_GRACEFUL_STOP`
- `BOOKING_ITERATION_SECONDS`

## Notes

- Seed one database user per booking VU and pass those same emails through `TEST_USER_EMAILS`.
- Seed at least one future showtime with enough seats for `BOOKING_LOAD_VUS * BOOKING_TICKET_COUNT`.
- The booking suite always auto-resolves its target showtime from the now-playing and showtimes APIs. There is no manual `SHOWTIME_ID` override anymore.
- If you increase `BOOKING_TICKET_COUNT` or `BOOKING_LOAD_VUS`, make sure the target showtime has enough available seats to avoid artificial contention.
- The sample `.env.example` keeps `BOOKING_LOAD_VUS=2` so it works as copied with the sample email list. Raise it to `20` and provide `20` seeded emails for the full baseline.
- Booking sessions are created per VU during the scenario, not pre-created in `setup()`, to avoid both k6 `setup()` timeouts and the app's 5 minute booking-session expiry.
- Do not collapse all booking VUs onto one user for this app. Booking sessions are one-per-user and `bookingSession.create` replaces the existing session for that user.
