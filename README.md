# DapurGizi

Platform belanja bahan dapur segar — Admin Panel + User Web + Backend API.

## 🏗️ Arsitektur

```
DapurGizi/
├── admin/              # Next.js 16 — Panel admin
├── web/                # Next.js 16 — User web store
├── backend/            # Node.js + TypeScript + Prisma 7
├── docker-compose.yml  # PostgreSQL, Redis, MinIO
└── README.md
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

### 4. User Web
```bash
cd web
npm install
npm run dev                 # http://localhost:3000
```

## 🖥️ Admin Panel
Dashboard • Orders • Products • Categories • Users • Banners • Promos • Flash Sale • Cooking Videos • Recipes • Delivery Slots • Settings

## 🌐 User Web
Home • Search • Categories • Product Detail • Cart • Checkout • Orders • Payment • Profile • Recipes • Notifications • Auth (Login/Register/OTP)

## 🔧 Backend API
- **Auth**: Register, Login, Google OAuth, OTP, Password Reset, Token Rotation
- **Products**: CRUD, Search, Filter, Categories
- **Orders**: Create, Status, Cancel
- **Admin**: Dashboard, Full CRUD, Broadcast
- **WebSocket**: Real-time order notifications
- **File Upload**: multer → sharp (WebP) → MinIO

## 🛠️ Tech Stack
| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express 5 + TypeScript |
| Database | PostgreSQL + Prisma 7 |
| Cache | Redis |
| Storage | MinIO (S3-compatible) |
| Admin | Next.js 16 + React 19 |
| User Web | Next.js 16 + React 19 |
| Real-time | Socket.IO |

## 📄 License
Private — Dapur Gizi
