# k6 Load Testing (Feature-Based)

This folder contains the initial k6 setup for feature/scenario load testing.

Current layout pattern:

- `load-tests/suites/<area>.js` (suite entrypoint used by `pnpm test:load`)
- `load-tests/features/<area>/scenario.js` (options + scenario flow)
- `load-tests/features/<area>/requests.js` (endpoint requests)

## Scenario Included

1. Movie and Showtime Selection (initial baseline)

- GET `/api/trpc/movies.nowPlaying`

Default requirement profile in this script:

- 20 concurrent users (`LOAD_VUS=20`)
- 5 minute steady run (`LOAD_DURATION=5m`)
- minimum throughput threshold of 200 requests/minute (`http_reqs rate >= 3.33/sec`)

## Docker-First Setup

Use the official `grafana/k6` image. No local k6 install is required.

Create an env file once:

```bash
cp load-tests/.env.example load-tests/.env
```

Populate `load-tests/.env` with your values.

Set `BASE_URL` in `load-tests/.env` to control local vs live target.

## Run Commands

Make sure you have Docker running. If running against a local target, make sure your local server is running (`pnpm dev`) and that `BASE_URL` in `load-tests/.env` is set to `http://host.docker.internal:3000` (or your local IP).

From the project root:

```bash
pnpm test:load
pnpm test:load:dashboard
```

`test:load` is a headless run (no live dashboard).

`test:load` runs k6 with live dashboard endpoint and report export enabled:

- To access the dashboard, open `http://localhost:5665` in your browser.
- When the test finishes, a HTML report is exported to `load-tests/results/dashboard-report.html`.
- This file is overwritten on each run at `load-tests/results/dashboard-report.html`.

## Required/Optional Environment Variables

### Base target

- `BASE_URL` (optional, default is `http://host.docker.internal:3000`)
- Use `BASE_URL=https://bookcinemate.me` for live

### nowPlaying input

- `NOW_PLAYING_LIMIT` (optional)

## Useful knobs

- `SLEEP_SECONDS` (default: `1`)

Shared load profile overrides:

- `LOAD_VUS` (default: `20`)
- `LOAD_DURATION` (default: `5m`)
- `LOAD_GRACEFUL_STOP` (default: `30s`)
