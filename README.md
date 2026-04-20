# DapurGizi

Platform belanja bahan dapur segar — User App + Driver App + Admin Panel + Backend API.

## 🏗️ Arsitektur

```
Dapurgizi/
├── apps/
│   ├── user_app/          # Flutter — Aplikasi pelanggan
│   └── driver_app/        # Flutter — Aplikasi driver
├── packages/
│   ├── core/              # Models, API client, auth, validators
│   ├── ui_kit/            # Design system, widgets, theme
│   └── map_kit/           # Peta, geocoding, GPS
├── admin/                 # Next.js 15 — Panel admin
├── backend/               # Node.js + TypeScript + Prisma 7
├── docker-compose.yml     # PostgreSQL, Redis, MinIO
└── melos.yaml             # Flutter monorepo workspace
```

## 🚀 Quick Start

### 1. Infrastructure
```bash
docker compose up -d        # PostgreSQL, Redis, MinIO
```

### 2. Backend
```bash
cd backend
cp .env.example .env        # Edit konfigurasi
npm install
npx prisma db push
npx prisma db seed
npm run dev                 # http://localhost:3001
```

### 3. Admin Panel
```bash
cd admin
npm install
npm run dev -- -p 3002      # http://localhost:3002
```

### 4. Mobile Apps
```bash
# Di root project
dart pub get
cd apps/user_app && flutter run
cd apps/driver_app && flutter run
```

## 📱 User App (12 Screens)
| Screen | Fitur |
|--------|-------|
| Splash | Animated logo |
| Onboarding | 3-page intro |
| Login/Register | Email + Google + OTP |
| Home | Search, banner, categories, featured products |
| Category | Filter chips + product grid |
| Product Detail | SliverAppBar, nutrition, qty selector |
| Cart | Inline quantity, checkout bar |
| Checkout | Address, delivery, payment, promo |
| Orders | Tabbed active/history |
| Order Detail | Status timeline |
| Profile | Menu, addresses, notifications |

## 🚗 Driver App (10 Screens)
| Screen | Fitur |
|--------|-------|
| Login | Email/password |
| Registration | Steps → KTP upload → verification |
| Home | Online toggle, stats, active orders |
| Order Detail | Customer info, WhatsApp, navigation, problem report |
| History | Order list with status |
| Earnings | Monthly total, weekly stats, transactions |
| Profile | Verified badge, stats, settings |

## 🖥️ Admin Panel (10 Pages)
Dashboard • Orders • Products • Categories • Drivers • Users • Banners • Promos • Settings • Broadcast

## 🔧 Backend API
- **Auth**: Register, Login, Google OAuth, OTP, Password Reset, Token Rotation
- **Products**: CRUD, Search, Filter, Categories
- **Orders**: Create, Status, Cancel, Driver Assignment
- **Drivers**: Register, KTP Upload, Online Toggle, GPS, Earnings
- **Admin**: Dashboard, Full CRUD, Broadcast
- **WebSocket**: Real-time driver tracking, order notifications
- **File Upload**: multer → sharp (WebP) → MinIO

## 🛠️ Tech Stack
| Layer | Technology |
|-------|-----------|
| Mobile | Flutter 3.x + Riverpod + GoRouter |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma 7 |
| Cache | Redis |
| Storage | MinIO (S3-compatible) |
| Admin | Next.js 15 + React |
| Real-time | Socket.IO |

## 📄 License
Private — Dapur Gizi
