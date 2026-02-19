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

## Database Setup

1. **Start the database**:

    ```bash
    ./start-database.sh
    ```

2. **Verify Docker container**:
   Check that the PostgreSQL container is running in Docker Desktop.

3. **Generate and apply database migrations**:
    ```bash
    pnpm db:generate
    ```

## Seeding the Database

After setting up the database, you can seed it with data for development. There are a few ways to do this:

### 1. Development Seed (Recommended)

This is the fastest way to get a complete local environment with sample data. It creates foundational data (like cinema seats) and also a sample movie, a sample user, and several sample bookings.

Run the following command:

```bash
pnpm db:seed --dev
```

> **Note:** This command is idempotent and can be run multiple times.

### 2. Sync with Live Movie Data

If you want to populate the database with a larger, more realistic set of currently playing movies, you can use the `sync:movies` script. This script fetches the top 10 now-playing movies from The Movie Database (TMDB) and populates the database with them, including creating showtimes.

```bash
pnpm sync:movies
```

> **Note:** You can run this *after* running the development seed if you want to add more movies alongside the sample movie.

### 3. Foundational Seed (Seats Only)

If you only need the foundational data (i.e., the cinema seat layout) without any sample movies or bookings, you can run the seed command without the `--dev` flag:

```bash
pnpm db:seed
```

This is useful for setting up a clean environment before running the `sync:movies` script, or for production-like setups.

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