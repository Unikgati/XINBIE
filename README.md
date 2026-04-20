# 🥦 Dapur Gizi

Marketplace mobile bahan dapur berbasis on-demand procurement.

## Architecture

```
apps/
  user_app/       → Flutter (Android & iOS) — consumer app
  driver_app/     → Flutter (Android & iOS) — driver mitra app
packages/
  core/           → Shared models, API client, auth, utils
  ui_kit/         → Shared design system & widgets
  map_kit/        → Shared map utilities (OSM, geocoding, routing)
backend/          → Node.js + Express + TypeScript + Prisma
admin_web/        → Next.js + TypeScript — admin panel
```

## Prerequisites

- Flutter 3.41+ & Dart 3.11+
- Node.js 22+ & npm 10+
- Docker Desktop (for PostgreSQL, Redis, MinIO)
- Melos (`dart pub global activate melos`)

## Quick Start

```bash
# 1. Start services
docker compose up -d

# 2. Bootstrap Flutter monorepo
melos bootstrap

# 3. Start backend
cd backend && npm install && npm run dev

# 4. Start admin web
cd admin_web && npm install && npm run dev

# 5. Run Flutter apps
cd apps/user_app && flutter run
cd apps/driver_app && flutter run
```

## Environment

Copy `.env` and fill in your credentials (Midtrans, Firebase, SMTP).
