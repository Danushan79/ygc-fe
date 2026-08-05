# Mediscan

## Overview

Mediscan is a full-stack medical application built with Next.js. This repository currently
contains the **project foundation only** — folder structure, tooling, and a health check
endpoint. UI screens, authentication, database schema, and AI/scanning features will be added
in later tasks.

## Tech Stack

- [Next.js](https://nextjs.org) (App Router) — frontend + backend (API routes)
- [React](https://react.dev) 19
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com) 4
- [ESLint](https://eslint.org) (`eslint-config-next`)
- [Prettier](https://prettier.io) (with `prettier-plugin-tailwindcss`)

## Folder Structure

```
src/
├── app/            # Routes, layouts, and API route handlers (App Router)
│   └── api/        # Backend HTTP endpoints (e.g. /api/health)
├── components/      # Shared, reusable UI components
├── features/        # Feature-scoped modules (UI + logic grouped by domain)
├── services/         # Business logic / service layer, consumed by API routes
├── lib/             # Low-level integrations (e.g. database client)
├── hooks/           # Shared React hooks
├── types/            # Shared TypeScript types
├── utils/            # Generic, stateless helper functions
├── constants/         # App-wide constant values
└── config/            # Typed environment/config loading
```

## Installation

```bash
npm install
```

## Development Commands

| Command                | Description                               |
| ---------------------- | ----------------------------------------- |
| `npm run dev`          | Start the development server              |
| `npm run build`        | Build the app for production              |
| `npm run start`        | Start the production server (after build) |
| `npm run lint`         | Run ESLint                                |
| `npm run format`       | Format the codebase with Prettier         |
| `npm run format:check` | Check formatting without writing files    |

## Environment Setup

1. Copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

2. Fill in the values as needed. Environment variables are read centrally in
   [`src/config/env.ts`](src/config/env.ts) — import `env` from there instead of accessing
   `process.env` directly elsewhere in the app.

| Variable                | Description                               |
| ----------------------- | ----------------------------------------- |
| `NEXT_PUBLIC_APP_URL`   | Public base URL of the app                |
| `MONGODB_URI`           | MongoDB connection string                 |
| `JWT_SECRET`            | Secret used to sign auth session JWTs     |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name (for avatar photos) |
| `CLOUDINARY_API_KEY`    | Cloudinary API key                        |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret                     |

## Health Check

Once the dev server is running, verify the backend is up:

```bash
curl http://localhost:3000/api/health
```

```json
{ "status": "ok", "application": "mediscan" }
```
