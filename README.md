# Project Documentation

- [Architecture Overview](https://github.com/yenaing-oo/cinemate/wiki/Architecture)
- [Project Proposal](https://github.com/yenaing-oo/cinemate/wiki/Project-Proposal)

# 🌐 Live App

Try the hosted application here:  
👉 https://bookcinemate.me

# Development Setup

This guide will help you set up the development environment for Cinemate, a T3 stack application built with Next.js, TypeScript, Tailwind CSS, tRPC, Prisma, and NextAuth.

## Prerequisites

- **Node.js**: Version 18.17 or higher. We recommend using [nvm](https://github.com/nvm-sh/nvm) for managing Node versions.
- **pnpm**: Package manager. Install via npm: `npm install -g pnpm@latest`
- **Docker**: For running the database locally. [Download Docker Desktop](https://docs.docker.com/get-docker/).
- **Git**: For version control.
- **Supabase CLI**:
    - On macOS:
        ```bash
        brew install supabase/tap/supabase
        ```
    - On Windows:
        1. Install Scoop in PowerShell:
            ```powershell
            Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
            Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
            ```
        2. Add the Supabase bucket:
            ```powershell
            scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
            ```
        3. Install Supabase CLI:
            ```powershell
            scoop install supabase
            ```

## Installation

1. **Clone the repository**:

    ```bash
    git clone https://github.com/yenaing-oo/cinemate.git
    cd cinemate
    ```

2. **Install pnpm** (if not already installed):
    - On macOS/Linux:
        ```bash
        npm install -g pnpm@latest
        ```
    - On Windows:
        ```bash
        corepack enable
        corepack prepare pnpm@latest --activate
        pnpm -v
        ```

3. **Install dependencies**:
    ```bash
    pnpm install --frozen-lockfile
    ```

## Environment Setup

1. **Copy environment file**:

    ```bash
    cp .env.example .env
    ```

2. **Configure environment variables**:
    - Populate `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from your Google OAuth credentials.
    - Adjust other variables as needed (e.g., database URL if not using default Docker setup).

## Supabase Authentication & Local Database Setup

Supabase is used as the authentication provider for this project. It handles user sign-up, sign-in, password reset, and email confirmation flows. All transactional emails (such as confirmation and password reset) are sent via Supabase, and for local development, these emails are intercepted by the Mailpit email server running at http://localhost:54324/.

1. **Start Supabase local development environment**

    Make sure you have Docker running, then start Supabase:

    ```bash
    supabase start
    ```

2. **Reset and migrate the database**

    ```bash
    supabase db reset
    ```

3. **Generate Prisma Client and apply migrations**

    ```bash
    pnpm db:generate
    ```

4. **Seed the database with development data**

    ```bash
    pnpm db:seed --dev
    ```

5. **Sync movies from TMDB**

    ```bash
    pnpm sync:movies
    ```

6. **Start the development server**

    ```bash
    pnpm dev
    ```

7. **Sign up for a test user**
    - Go to [http://localhost:3000/auth/sign-up](http://localhost:3000/auth/sign-up)
    - Use `user@example.com` and any password. Associated seed data exists for this email from step 4.

8. **Confirm your email**
    - Open [http://localhost:54324/](http://localhost:54324/) (Mailpit email server)
    - Find the confirmation email and click the link

9. **Sign in with your test credentials**
    - `user@example.com` is seeded with sample bookings and tickets

## Running the Application

Start the development server:

```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Useful Scripts

### Development

- `pnpm dev` - Start the development server.
- `pnpm check` - Run linting, type checking, and format checks.

### Database

- `pnpm db:generate` - Create or apply Prisma migrations and regenerate Prisma Client after schema changes.
- `pnpm db:push` - Force the database schema to match `schema.prisma` without creating a migration. Use with caution.
- `pnpm prisma generate` - Regenerate Prisma Client without changing the database.
- `pnpm db:reset` - Drop all data and reapply all migrations from scratch. Use with caution.
- `pnpm db:seed` - Seed the database with initial data.
- `pnpm db:seed --dev` - Seed the database with local development sample data.
- `pnpm db:studio` - Open Prisma Studio for database management.

### Data Sync

- `pnpm sync:movies` - Fetch now-playing movies from TMDB, save them, and create showtimes and seats for local testing.

### Testing

- `pnpm db:test:prepare`: Generate Test Database

- `pnpm test` - Run all Vitest tests.
- `pnpm test:frontend` - Run frontend tests only.
- `pnpm test:backend` - Run backend tests only.
- `pnpm test:integration` - Run integration tests only

### Load Testing

- `pnpm db:seed:booking-loadtest` - Seed dedicated booking load-test users and showtimes.
- `pnpm db:seed:watch-party-loadtest` - Seed dedicated watch party host and participant users plus showtimes.
- `pnpm test:load` - Run the movie/showtime k6 suite.
- `pnpm test:load:booking` - Run the booking k6 suite.
- `pnpm test:load:watch-party` - Run the watch party k6 suite.
- See [`load-tests/README.md`](./load-tests/README.md) for env vars, dashboard commands, and scenario details.

## Mutation Testing

Mutation testing is configured with StrykerJS using [`stryker.conf.js`](./stryker.conf.js). The current mutation scope is limited to source files that already have active Vitest coverage. We have implemented this per feature.

### Commands

- `pnpm exec stryker run stryker.feature1.conf.js` - Run mutation tests for Feature 1.
- `pnpm exec stryker run stryker.feature2.conf.js` - Run mutation tests for Feature 2.
- `pnpm exec stryker run stryker.feature3.conf.js` - Run mutation tests for Feature 3.
- `pnpm exec stryker run stryker.feature4.conf.js` - Run mutation tests for Feature 4.
- `pnpm exec stryker run stryker.feature5.conf.js` - Run mutation tests for Feature 5.

### Reports

- Open `reports/mutation/mutation.html` in a browser to review the mutation score and surviving mutants after a test run.
