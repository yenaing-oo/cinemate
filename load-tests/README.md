# k6 Load Testing (Feature-Based)

This folder contains the k6 setup for feature/scenario load testing.

Current layout pattern:

- `load-tests/suites/<area>.js` (suite entrypoint used by the package scripts)
- `load-tests/features/<area>/scenario.js` (options + scenario flow)
- `load-tests/features/<area>/requests.js` (endpoint requests)

## Features Included

### Feature 1: Movie and Showtime Selection

Endpoints covered:

- `GET /api/trpc/movies.nowPlaying`
- `GET /api/trpc/showtimes.getByMovie`

Default requirement profile in this script:

- `20` concurrent users (`LOAD_VUS=20`)
- `5m` steady run (`LOAD_DURATION=5m`)
- minimum throughput threshold of approximately `200` requests/minute (`http_reqs rate >= 3.33/sec`)

Commands:

```bash
pnpm test:load
pnpm test:load:dashboard
```

Dashboard details:

- open `http://localhost:5665` in the browser during the run
- exported report: `load-tests/results/dashboard-report.html`

### Feature 3: Email

This scenario exercises end to end booking flow to make sure confirmation email is being sent to the user when booking is successful.

Endpoints covered:

- `POST /api/trpc/bookingSession.update`

Scenario flow:

1. Automatically select one valid future showtime from the available movie and showtime data.
2. Assign one seeded booking user to each virtual user.
3. Create a booking session for that user.
4. Move the session to `SEAT_SELECTION`.
5. Load the seat map.
6. Move the session to `CHECKOUT`.
7. `COMPLETE` the session by confirming the movie.

Authentication behavior:

- booking completion routes are protected routes
- when `LOAD_TEST_MODE=true`, the backend reads a seeded user email from the `x-load-test-user-email` request header
- the test uses 20 virtual users and each of them runs entire booking scenario.

Default requirement profile in this script:

- `20` concurrent users (`BOOKING_LOAD_VUS=20`)
- `5m` steady run (`BOOKING_LOAD_DURATION=5m`)
- `1` ticket per booking session (`BOOKING_TICKET_COUNT=1`)
- minimum throughput threshold of `200` requests/minute (`http_reqs rate >= 3.33/sec`)

Booking setup for local runs:

Terminal 1:

```bash
cp load-tests/.env.example load-tests/.env
pnpm db:seed:booking-loadtest
pnpm dev:loadtest
```

Terminal 2:

```bash
pnpm test:load:email
```

Use this instead if you want the live dashboard:

```bash
pnpm test:load:email:dashboard
```

What the setup commands do:

- `cp load-tests/.env.example load-tests/.env` creates the k6 env file
- `pnpm db:seed:booking-loadtest` seeds the booking users, a dedicated future movie, future showtimes, and showtime seats
- `pnpm dev:loadtest` starts the local app with `LOAD_TEST_MODE=true` so the booking suite can authenticate through the `x-load-test-user-email` header

If you see `UNAUTHORIZED` on `showtimeSeats.getByShowtime`, check these first:

- the app was started with `pnpm dev:loadtest`
- the booking users were seeded with `pnpm db:seed:booking-loadtest`

### Feature 4: Booking

This scenario exercises the booking flow up to the checkout review page. It does not confirm payment or complete the booking.

Endpoints covered:

- `POST /api/trpc/bookingSession.create`
- `POST /api/trpc/bookingSession.update`
- `GET /api/trpc/showtimeSeats.getByShowtime`

Scenario flow:

1. Automatically select one valid future showtime from the available movie and showtime data.
2. Assign one seeded booking user to each virtual user.
3. Create a booking session for that user.
4. Move the session to `SEAT_SELECTION`.
5. Load the seat map.
6. Move the session to `CHECKOUT`.
7. Rewind the session back to `SEAT_SELECTION` so held seats are released before the next iteration.

Authentication behavior:

- booking routes are protected routes
- when `LOAD_TEST_MODE=true`, the backend reads a seeded user email from the `x-load-test-user-email` request header
- if that user exists in the database, the backend injects that user into the tRPC auth context for the request
- one seeded user is required per booking virtual user because the application allows one active booking session per user

Default requirement profile in this script:

- `20` concurrent users (`BOOKING_LOAD_VUS=20`)
- `5m` steady run (`BOOKING_LOAD_DURATION=5m`)
- `1` ticket per booking session (`BOOKING_TICKET_COUNT=1`)
- minimum throughput threshold of `300` requests/minute (`http_reqs rate >= 5.00/sec`)

Booking setup for local runs:

Terminal 1:

```bash
cp load-tests/.env.example load-tests/.env
pnpm db:seed:booking-loadtest
pnpm dev:loadtest
```

Terminal 2:

```bash
pnpm test:load:booking
```

Use this instead if you want the live dashboard:

```bash
pnpm test:load:booking:dashboard
```

What the setup commands do:

- `cp load-tests/.env.example load-tests/.env` creates the k6 env file
- `pnpm db:seed:booking-loadtest` seeds the booking users, a dedicated future movie, future showtimes, and showtime seats
- `pnpm dev:loadtest` starts the local app with `LOAD_TEST_MODE=true` so the booking suite can authenticate through the `x-load-test-user-email` header

If you see `UNAUTHORIZED` on `showtimeSeats.getByShowtime`, check these first:

- the app was started with `pnpm dev:loadtest`
- the booking users were seeded with `pnpm db:seed:booking-loadtest`

Commands:

```bash
pnpm test:load:booking
pnpm test:load:booking:dashboard
```

Dashboard details:

- open `http://localhost:5666` in the browser during the run
- exported report: `load-tests/results/booking-dashboard-report.html`

## Docker-First Setup

Use the official `grafana/k6` image. No local k6 install is required.

Create an env file once:

```bash
cp load-tests/.env.example load-tests/.env
```

Populate `load-tests/.env` with your values.

Set `BASE_URL` in `load-tests/.env` to control local vs live target.

Target notes:

- local target default: `BASE_URL=http://host.docker.internal:3000`
- live target example: `BASE_URL=https://bookcinemate.me`
- Docker maps `host.docker.internal` for the k6 services, so the same local URL works on macOS, Windows, and Linux dev machines

## Run Commands

Make sure Docker is running.

From the project root:

```bash
pnpm test:load
pnpm test:load:dashboard
pnpm test:load:booking
pnpm test:load:booking:dashboard
```

Command behavior:

- `test:load` runs the movie/showtime suite without a live dashboard
- `test:load:dashboard` runs the movie/showtime suite with the live dashboard and report export enabled
- `test:load:booking` runs the booking suite without a live dashboard
- `test:load:booking:dashboard` runs the booking suite with the live dashboard and report export enabled

## Required/Optional Environment Variables

### Base target

- `BASE_URL` (optional, default: `http://host.docker.internal:3000`)
- use `BASE_URL=https://bookcinemate.me` for a live target

### Movie and Showtime Selection

- `NOW_PLAYING_LIMIT` (optional)
- `MOVIE_SHOWTIME_LOAD_VUS` (optional)
- `MOVIE_SHOWTIME_LOAD_DURATION` (optional)
- `MOVIE_SHOWTIME_LOAD_GRACEFUL_STOP` (optional)
- `MOVIE_SHOWTIME_ITERATION_SECONDS` (optional)

### Booking

- `LOAD_TEST_MODE` (required for the booking suite; `pnpm dev:loadtest` sets it for the app locally)
- `TEST_USER_EMAILS` (optional, comma-separated explicit seeded booking users)
- `BOOKING_USER_EMAIL_PREFIX` (optional, default: `booking-loadtest`)
- `BOOKING_USER_EMAIL_DOMAIN` (optional, default: `example.com`)
- `BOOKING_TICKET_COUNT` (optional, default: `1`)
- `BOOKING_LOAD_VUS` (optional, default: `20`)
- `BOOKING_LOAD_DURATION` (optional, default: `5m`)
- `BOOKING_LOAD_GRACEFUL_STOP` (optional, default: `30s`)
- `BOOKING_ITERATION_SECONDS` (optional)
- `BOOKING_SHOWTIME_COUNT` (optional, seed-only, default: `6`)

## Useful Knobs

- `SLEEP_SECONDS` (default: `1`)
- `ITERATION_SECONDS` (default shared target: `12`)

Shared load profile overrides:

- `LOAD_VUS` (default: `20`)
- `LOAD_DURATION` (default: `5m`)
- `LOAD_GRACEFUL_STOP` (default: `30s`)

## Notes

- The booking suite automatically selects one valid future showtime. There is no manual `SHOWTIME_ID` input.
- The booking suite stops at checkout review and does not complete payment or final booking confirmation.
- Rewinding from `CHECKOUT` back to `SEAT_SELECTION` prevents held seats from accumulating across iterations.
- If `TEST_USER_EMAILS` is omitted, the suite and the seed script both derive the same generated user list from `BOOKING_LOAD_VUS`, `BOOKING_USER_EMAIL_PREFIX`, and `BOOKING_USER_EMAIL_DOMAIN`.
