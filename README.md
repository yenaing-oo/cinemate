# Project Documentation

- [Architecture Overview](https://github.com/yenaing-oo/cinemate/wiki/Architecture)
- [Project Proposal](https://github.com/yenaing-oo/cinemate/wiki/Project-Proposal)

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
        ```bash
        npm install -g supabase
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

    ```bash
    supabase start
    ```

2. **Start Supabase local development environment**

    ```bash
    supabase start
    ```

3. **Reset and migrate the database**

    ```bash
    supabase db reset
    ```

4. **Generate Prisma Client and apply migrations**

    ```bash
    pnpm db:generate
    ```

5. **Seed the database with development data**

    ```bash
    pnpm db:seed --dev
    ```

6. **Sync movies from TMDB**

    ```bash
    pnpm sync:movies
    ```

7. **Start the development server**

    ```bash
    pnpm dev
    ```

8. **Sign up for a test user**
    - Go to [http://localhost:3000/auth/sign-up](http://localhost:3000/auth/sign-up)
    - Use `user@example.com` and any password

9. **Confirm your email**
    - Open [http://localhost:54324/](http://localhost:54324/) (Mailpit email server)
    - Find the confirmation email and click the link

10. **Sign in with your test credentials**
    - `user@example.com` is seeded with sample bookings and tickets

## Running the Application

Start the development server:

```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Useful Scripts

- `pnpm dev` - Start development server
- `pnpm check` - Run linting, type checking, and format check
- `pnpm db:generate` - Use after you change `schema.prisma` or pulled schema changes from Git. Creates a migration file if schema has changed, or applies existing migrations if DB is behind, and regenerates Prisma Client.
- `pnpm db:push` - Use when you want to force the database to match the schema (skips migrations). May ask to reset DB on destructive changes. Use with caution.
- `pnpm prisma generate` - Does not touch the database, just regenerates Prisma Client based on the current schema.
- `pnpm db:reset` - Resets the database (drops all data) and applies all migrations from scratch. Use with caution.
- `pnpm db:seed` - Run the database seeding script to populate initial data.
- `pnpm db:seed --dev` - Run the development seed script to populate the database with sample data (movies, users, bookings) for local development.
- `pnpm db:studio` - Open Prisma Studio for database management
- `pnpm sync:movies` - Sync movies from TMDB. Fetches the top 10 now-playing movie details and saves them to the database. Creates showtimes and seats for each movie. Useful for initial seeding and testing in local development.
- `pnpm test` - Run all tests
- `pnpm test:frontend` - Run frontend tests only
- `pnpm test:backend` - Run backend tests only
