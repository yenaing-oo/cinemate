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

1. In `setup()`, each configured test user signs in through Supabase.
2. In `setup()`, a fresh booking session is created for `SHOWTIME_ID` and advanced to `SEAT_SELECTION`.
3. Each iteration loads the seat map for that user.
4. Each iteration moves the booking session to `CHECKOUT`.
5. Each iteration immediately rewinds back to `SEAT_SELECTION` so held seats are released for the next loop.

Default booking baseline:

- `20` constant VUs
- `4m` steady run
- `1` ticket per booking session
- approximately `300` requests/minute total

Why `4m` by default:

- booking sessions currently expire after `5` minutes in the app, so the booking suite stays under that window by default

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

- `SHOWTIME_ID`
  required showtime to create booking sessions against
- `BOOKING_TICKET_COUNT`
  optional, default `1`
- `SUPABASE_URL`
  required auth endpoint reachable from Docker, usually `http://host.docker.internal:54321`
- `SUPABASE_PUBLISHABLE_KEY`
  required local or live publishable key
- `SUPABASE_COOKIE_NAME`
  optional override for the auth cookie name; for local Supabase in this repo the expected value is usually `sb-127-auth-token`
- `TEST_USER_EMAILS`
  required comma-separated booking load-test users; you need at least as many emails as booking VUs
- `TEST_USER_PASSWORD`
  required password shared by those test users
- `BOOKING_LOAD_VUS`
- `BOOKING_LOAD_DURATION`
  default `4m`
- `BOOKING_LOAD_GRACEFUL_STOP`
- `BOOKING_ITERATION_SECONDS`

## Notes

- The booking suite assumes the configured users already exist in Supabase and can sign in.
- For local runs, keep `SUPABASE_URL` pointed at `host.docker.internal` from Docker, but use `SUPABASE_COOKIE_NAME` if your app’s `NEXT_PUBLIC_SUPABASE_URL` hostname differs.
- If you increase `BOOKING_TICKET_COUNT` or `BOOKING_LOAD_VUS`, make sure the target showtime has enough available seats to avoid artificial contention.
