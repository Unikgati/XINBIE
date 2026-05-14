# 📄 Product Requirements Document (PRD)
# Dapur Gizi — Aplikasi Mobile Belanja Bahan Dapur
# Versi 2.1 — FINAL & LENGKAP (2-App Architecture)

**Versi:** 2.1.0  
**Tanggal:** April 2026  
**Status:** Final  
**Platform:** Flutter (Android & iOS) — 2 aplikasi terpisah (User App & Driver App)  
**Infrastruktur:** VPS + Domain (Self-hosted, Modal Minimal)  
**Changelog v2.1:** Arsitektur 2-app terpisah (User & Driver) dengan monorepo + shared packages. Penambahan titik pickup gudang di peta, WhatsApp driver→penerima, foto bukti pengantaran, laporan masalah driver, monitoring driver di peta (admin), penghasilan driver, COD gagal bayar, cart validation, broadcast notifikasi admin, dan berbagai penyempurnaan flow.

---

## Daftar Isi

1. [Overview & Visi Produk](#1-overview--visi-produk)
2. [Arsitektur Teknis Modal Minimal](#2-arsitektur-teknis-modal-minimal)
   - 2.4 Arsitektur Monorepo Flutter ⭐ *baru*
3. [Roles & Permissions](#3-roles--permissions)
4. [Kategori Produk](#4-kategori-produk)
5. [Flow Lengkap: User (user_app)](#5-flow-lengkap-user-user_app)
6. [Flow Lengkap: Driver (driver_app)](#6-flow-lengkap-driver-driver_app)
7. [Flow Lengkap: Admin Panel Web](#7-flow-lengkap-admin-panel-web)
8. [Fitur Lintas Role](#8-fitur-lintas-role)
9. [Notifikasi & Real-time](#9-notifikasi--real-time)
   - 9.3 FCM Topic & Channel Separation ⭐ *baru*
10. [Pembayaran Midtrans](#10-pembayaran-midtrans)
11. [Peta & Pengiriman](#11-peta--pengiriman)
12. [Database Schema](#12-database-schema)
13. [API Endpoint](#13-api-endpoint)
14. [Non-Functional Requirements](#14-non-functional-requirements)
    - 14.5 Monorepo & Build ⭐ *baru*
15. [Roadmap & Prioritas](#15-roadmap--prioritas)
16. [Appendix](#16-appendix)
    - I. Melos Configuration ⭐ *baru*
    - J. Play Store Listing ⭐ *baru*

---

## 1. Overview & Visi Produk

### 1.1 Deskripsi
**Dapur Gizi** adalah aplikasi mobile marketplace bahan dapur berbasis model *on-demand procurement* — admin/owner membeli barang setelah pesanan masuk (pre-order dengan markup harga), kemudian diantarkan oleh driver mitra ke pelanggan dari satu titik lokasi gudang yang ditentukan admin.

### 1.2 Model Bisnis
- Owner terima pesanan → belanja barang → barang dikumpulkan di gudang/titik pickup → driver ambil di titik pickup → antar ke pelanggan.
- Revenue dari markup harga produk + ongkos kirim Instant.
- Pengiriman Regular gratis (2 hari), Instant berbayar (hari yang sama).

### 1.3 Target Pengguna
- Ibu rumah tangga & pengelola dapur usaha kecil di area layanan.
- Driver mitra lepas di area setempat.

### 1.4 Prinsip Desain
- **Mobile-first** (Flutter)
- **2-App Architecture** — app User dan Driver terpisah (best practice industri: Gojek/GoPartner, Grab/GrabDriver, Shopee/Shopee Driver)
- **Monorepo + Shared Packages** — code reuse ~60-70% via shared packages (models, API client, auth, theme, map utilities)
- **Onboarding tanpa login** — user bisa browse tanpa akun
- **Self-hosted** — semua service di VPS sendiri
- **Minimal dependency** — hindari layanan cloud berbayar

---

## 2. Arsitektur Teknis Modal Minimal

### 2.1 Stack Teknologi

| Layer | Teknologi | Keterangan |
|---|---|---|
| Mobile App — User | Flutter (Dart) | `com.dapurgizi.user` — belanja & order |
| Mobile App — Driver | Flutter (Dart) | `com.dapurgizi.driver` — terima & antar order |
| Shared Packages | Dart (pure) | core, ui_kit, map_kit — reusable di kedua app |
| Backend API | Node.js (Express) atau Laravel | Ringan, banyak resource gratis |
| Database | PostgreSQL | Robust, gratis, self-host |
| Cache & Queue | Redis | Session, queue, realtime data |
| File Storage | MinIO (self-host) | Alternatif S3 gratis di VPS |
| Push Notification | Firebase FCM (free tier) | Gratis sampai skala besar |
| Payment | Midtrans | Biaya per transaksi, no monthly fee |
| Maps (Flutter) | flutter_map + MapLibre GL | Gratis, open source |
| Tile Server | OpenStreetMap CDN publik → self-host Protomaps | Gratis |
| Geocoding | Nominatim (OSM) self-host | Gratis |
| Routing | OSRM self-host | Gratis, estimasi jarak & waktu |
| Email | Brevo Free / Zoho Mail Free | 300 email/hari gratis |
| Admin Web | React.js / Next.js | Deploy di VPS yang sama |
| Reverse Proxy | Nginx | Gratis, performa tinggi |
| SSL | Let's Encrypt (Certbot) | Gratis |
| Server | 1 VPS min. 4 vCPU 8GB RAM 80GB SSD | ~Rp 200–350rb/bln |

### 2.2 Estimasi Biaya Bulanan

| Item | Estimasi |
|---|---|
| VPS (Contabo / RackNerd / IDCloudHost) | Rp 200.000 – 350.000 |
| Domain (.com atau .id) | ~Rp 15.000/bln |
| Email SMTP (Brevo free) | Rp 0 |
| Firebase FCM | Rp 0 |
| Midtrans | 0.7–2% per transaksi |
| **Total Fixed** | **~Rp 215.000 – 365.000/bln** |

### 2.3 Arsitektur Deployment

```
[User App]   ──►┐
                ├──► [Nginx Reverse Proxy :443]
[Driver App] ──►┘            │
                   ┌─────────┼──────────────┬──────────┐
                   │         │              │          │
              [API Server] [Admin Web]  [MinIO]   [OSRM]
                   │                    [Nominatim]
              [PostgreSQL + Redis]
                   │
              [FCM] [Midtrans Webhook] [SMTP Brevo]
```

> **Catatan:** Kedua app Flutter berkomunikasi dengan **1 backend API yang sama**. Tidak ada duplikasi server.

### 2.4 Arsitektur Monorepo Flutter

```
dapurgizi/
├── apps/
│   ├── user_app/                  ← Flutter app User (com.dapurgizi.user)
│   │   ├── lib/
│   │   │   ├── features/
│   │   │   │   ├── home/          ← Browse, search, banner, kategori
│   │   │   │   ├── cart/          ← Keranjang (Hive local + validasi API)
│   │   │   │   ├── checkout/      ← Alamat, jadwal, promo, bayar
│   │   │   │   ├── orders/        ← List & detail pesanan, timeline
│   │   │   │   ├── payment/       ← QRIS, VA, COD screens
│   │   │   │   └── profile/       ← Edit profil, alamat, notif settings
│   │   │   ├── app.dart
│   │   │   └── main.dart
│   │   └── pubspec.yaml           ← depends on: core, ui_kit, map_kit
│   │
│   └── driver_app/                ← Flutter app Driver (com.dapurgizi.driver)
│       ├── lib/
│       │   ├── features/
│       │   │   ├── dashboard/     ← Home, online/offline toggle, order aktif
│       │   │   ├── order/         ← Detail order, state machine, status update
│       │   │   ├── delivery/      ← Peta rute, pickup→drop, navigasi
│       │   │   ├── proof/         ← Upload bukti pengantaran, COD confirm
│       │   │   ├── problem/       ← Laporkan masalah (6 jenis)
│       │   │   ├── earnings/      ← Penghasilan, riwayat, export PDF
│       │   │   └── profile/       ← Profil driver, KTP, ubah password
│       │   ├── services/
│       │   │   ├── location_service.dart    ← Background GPS tracking
│       │   │   └── order_broadcast.dart     ← WebSocket orderan masuk
│       │   ├── app.dart
│       │   └── main.dart
│       └── pubspec.yaml           ← depends on: core, ui_kit, map_kit
│
├── packages/
│   ├── core/                      ← Shared: business logic & data
│   │   ├── lib/
│   │   │   ├── models/            ← User, Order, Product, Address, dll
│   │   │   ├── api/               ← Dio client, interceptors, endpoints
│   │   │   ├── auth/              ← Login, register, token refresh, Google Sign-In
│   │   │   ├── notifications/     ← FCM setup, handler, permission
│   │   │   └── utils/             ← Formatters, validators, constants
│   │   └── pubspec.yaml
│   │
│   ├── ui_kit/                    ← Shared: design system
│   │   ├── lib/
│   │   │   ├── theme/             ← Colors, typography, spacing, dark mode
│   │   │   ├── widgets/           ← Buttons, cards, badges, shimmer, empty states
│   │   │   └── animations/        ← Lottie wrappers, transitions
│   │   └── pubspec.yaml
│   │
│   └── map_kit/                   ← Shared: peta & lokasi
│       ├── lib/
│       │   ├── map_widget.dart    ← flutter_map wrapper + OSM tiles
│       │   ├── geocoding.dart     ← Nominatim reverse/forward geocoding
│       │   ├── routing.dart       ← OSRM route estimation
│       │   └── location.dart      ← GPS permission, current location
│       └── pubspec.yaml
│
├── backend/                       ← API server (1 backend, shared)
├── admin_web/                     ← Admin panel React/Next.js
└── melos.yaml                     ← Monorepo orchestration (build, test, lint)
```

**Keuntungan arsitektur ini:**

| Aspek | Detail |
|---|---|
| APK Size | User app ~15-20MB, Driver app ~12-15MB (vs ~25-30MB unified) |
| UX Focus | Navigasi & flow tailored per persona, tidak ada menu/fitur nyasar |
| Permissions | GPS background tracking **hanya** di driver_app |
| Release Cycle | Bug fix driver bisa deploy tanpa ganggu user app |
| Security | Driver endpoints tidak ter-expose di binary user app |
| Play Store | 2 listing terpisah, ASO & rating independen |
| Code Reuse | ~60-70% shared via packages (models, API, auth, theme, maps) |
| Testing | Shared packages di-test sekali, app-level test fokus ke UX flow |

**FCM Topic Separation:**

| App | FCM Topic | Kegunaan |
|---|---|---|
| User App | `users`, `user_{id}` | Notif pesanan, promo, broadcast user |
| Driver App | `drivers`, `driver_{id}` | Notif orderan masuk, verifikasi, broadcast driver |

---

## 3. Roles & Permissions

| Fitur | Guest | User | Driver | Admin |
|---|---|---|---|---|
| Browse produk | ✅ | ✅ | ❌ | ✅ |
| Tambah ke cart | ❌ | ✅ | ❌ | ✅ |
| Checkout & order | ❌ | ✅ | ❌ | ✅ |
| Lacak pesanan | ❌ | ✅ | ✅ | ✅ |
| Hubungi penerima via WA | ❌ | ❌ | ✅ | ✅ |
| Ambil & antar order | ❌ | ❌ | ✅ | ❌ |
| Upload bukti pengantaran | ❌ | ❌ | ✅ | ❌ |
| Laporkan masalah pengantaran | ❌ | ❌ | ✅ | ❌ |
| Kelola produk & kategori | ❌ | ❌ | ❌ | ✅ |
| Kelola banner & promo | ❌ | ❌ | ❌ | ✅ |
| Set titik pickup gudang | ❌ | ❌ | ❌ | ✅ |
| Monitor posisi driver di peta | ❌ | ❌ | ❌ | ✅ |
| Verifikasi driver | ❌ | ❌ | ❌ | ✅ |
| Broadcast notifikasi | ❌ | ❌ | ❌ | ✅ |
| Lihat laporan | ❌ | ❌ | ❌ | ✅ |

---

## 4. Kategori Produk

Kategori default (dapat ditambah/edit/nonaktifkan oleh admin):

| No | Kategori | Isi |
|---|---|---|
| 1 | Bahan Baku | Beras, tepung, gula, garam |
| 2 | Sayur & Buah | Semua sayuran dan buah segar |
| 3 | Daging & Seafood | Ayam, sapi, ikan, udang |
| 4 | Telur & Susu | Telur ayam, susu, keju |
| 5 | Bumbu & Rempah | Bawang, cabai, kunyit, jahe |
| 6 | Minyak & Saus | Minyak goreng, kecap, saus |
| 7 | Snack & Roti | Camilan, roti, biskuit |
| 8 | Minuman | Air mineral, jus, teh, kopi |
| 9 | Frozen Food | Nugget, sosis, bakso beku |
| 10 | Lainnya | Produk dapur lain |

Setiap kategori memiliki: nama, icon (upload SVG/PNG), warna background solid, dan urutan tampil.

---

## 5. Flow Lengkap: User (user_app)

### 5.1 Onboarding (Guest)

**Screen: Splash**
- Logo animasi Dapur Gizi → auto redirect ke Onboarding setelah 2 detik.

**Screen: Onboarding**
- Maskot aplikasi di bagian atas (ilustrasi karakter dapur yang ramah)
- Teks: *"Hi, Selamat Datang! Pesan bahan-bahan dapur dengan mudah untuk dapur anda"*
- Tombol **[Explore]** → masuk ke Home sebagai Guest
- Link kecil di bawah: *"Sudah punya akun? Masuk"*

---

### 5.2 Halaman Home

**Layout (top → bottom):**

```
┌──────────────────────────────────┐
│ [🔍 Cari produk...]  [🔔]       │  ← sticky, z-index di atas hero
├──────────────────────────────────┤
│                                  │
│     HERO BANNER (Carousel)       │  ← auto-play 4 detik, swipeable
│                                  │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐      │  ← Grid Kategori (4–5 kolom)
│  │🌾│ │🥦│ │🥩│ │🥚│ │🌶️│      │  ← overflow sebagian ke bawah hero
│  └──┘ └──┘ └──┘ └──┘ └──┘      │
├──────────────────────────────────┤
│    BANNER PROMOSI (Carousel)     │
├──────────────────────────────────┤
│  Produk Unggulan                 │
│  ┌────────┐  ┌────────┐         │
│  │  🖼️   │  │  🖼️   │         │  ← 2 kolom grid
│  │  Nama  │  │  Nama  │         │
│  │ ~~Rp~~ │  │ ~~Rp~~ │         │
│  │ Rp xxx │  │ Rp xxx │         │
│  │ [kg] [+]│ │ [kg] [+]│        │
│  └────────┘  └────────┘         │
├──────────────────────────────────┤
│  🏠 Home | 📋 Orders | 🛒 | 👤  │  ← Bottom Nav Bar
└──────────────────────────────────┘
```

**Komponen Detail:**

**Search Bar:**
- Real-time search, autocomplete nama produk.
- Guest bisa search dan lihat hasil, tapi tap tambah ke cart → redirect ke login.

**Hero Banner:**
- Carousel auto-play 4 detik, swipeable, dot indicator.
- Admin atur gambar + link (ke kategori/produk/promo tertentu).
- Dijadwalkan: tampil sesuai tanggal mulai–selesai.

**Kategori Grid:**
- Icon + label. Tap → halaman kategori terkait.
- Tampil maksimal 8 di grid, sisanya bisa di-scroll atau tombol "Lihat Semua".

**Banner Promosi:**
- Carousel single/multiple, dijadwalkan admin.

**Product Card:**
- Gambar produk
- Badge diskon % (pojok kiri atas, merah/oranye)
- Nama produk (max 2 baris, ellipsis)
- Harga coret jika ada diskon
- Harga aktif (bold, warna primer)
- Badge satuan (ikat, kg, pcs, liter, dll)
- Tombol **[+]** pojok kanan bawah
  - Tap → berubah menjadi `[−] 1 [+]` inline di card
  - Quantity 0 → kembali ke [+]
  - Guest tap [+] → snackbar "Login untuk menambah ke keranjang" + tombol [Login]
- Stok habis → overlay abu-abu "Habis" + tombol [+] disabled

**Bottom Navigation Bar:** Home | Orders (badge) | Cart (badge merah) | Profil

---

### 5.3 Halaman Kategori

**Layout:**
- AppBar: tombol Back (←) + judul kategori
- **Chips kategori lain**: Scrollable horizontal, gradient mask kiri-kanan (seamless), chip aktif berwarna solid primer
- Sort & Filter bar: dropdown sort (Terbaru, Harga ↑, Harga ↓, Terpopuler) + tombol Filter
- Grid produk 2 kolom
- **FAB** pojok kanan bawah: ikon 🛒 + badge merah jumlah item cart

**Bottom Sheet: Detail Produk**
(Muncul saat tap area gambar/nama/harga pada card)

```
┌─────────────────────────────────────┐
│  ▬ (drag handle)                    │
│                                     │
│  [Gambar 1:1]  [Badge Diskon 20%]  │
│                Nama Produk          │
│                ~~Rp 15.000~~        │
│                Rp 12.000  [kg]      │
│                ─────────────────    │
│  Deskripsi produk lengkap...        │
│  (scrollable)                       │
│                ─────────────────    │
│  Varian: (jika ada)                 │
│  [○ Merah] [○ Hijau] [○ Kuning]    │
│                ─────────────────    │
│          [−]    1    [+]            │
│                                     │
│  [🛒 Tambah ke Keranjang · Rp 12rb]│
└─────────────────────────────────────┘
```

---

### 5.4 Autentikasi User

#### 5.4.1 Kapan Login Diperlukan
- Tap [+] pada produk saat Guest
- Buka tab Cart untuk checkout
- Buka tab Orders
- Buka tab Profil

#### 5.4.2 Screen: Login
- Logo + tagline singkat
- Field: Email
- Field: Password (toggle show/hide)
- Tombol **[Masuk]**
- Link: *"Lupa password?"*
- Divider "atau"
- Tombol **[🔵 Masuk dengan Google]**
- Footer: *"Belum punya akun? Daftar"*

#### 5.4.3 Screen: Registrasi
- Field: Nama Lengkap
- Field: Email
- Field: Password (min 8 karakter, 1 huruf besar, 1 angka — indikator kekuatan password)
- Field: Konfirmasi Password
- Tombol **[Daftar]**
- Divider "atau"
- Tombol **[🔵 Daftar dengan Google]**
- Footer: *"Sudah punya akun? Masuk"*

Setelah daftar → kirim OTP 6 digit ke email → redirect ke screen Verifikasi.

#### 5.4.4 Screen: Verifikasi Email OTP
- Teks: *"Kode verifikasi dikirim ke [email]"*
- 6 input box digit (auto-focus box berikutnya, auto-submit jika digit ke-6 diisi)
- Timer countdown: 02:00 menit
- Tombol **[Verifikasi]**
- Link **[Kirim Ulang Kode]** (aktif setelah timer habis)
- OTP benar → auto login → redirect Home
- OTP salah → shake animation + pesan error + sisa percobaan
- Max 5x salah → akun terkunci 10 menit (tampilkan timer)

#### 5.4.5 Flow: Lupa Password
1. **Screen Input Email**: Field email → [Kirim Kode Reset]
2. **Screen Kode OTP**: 6 digit (timer 5 menit), logika sama seperti verifikasi email
3. **Screen Reset Password**: Input password baru + konfirmasi → [Simpan Password Baru]
4. Redirect ke Login + snackbar sukses

#### 5.4.6 Login dengan Google
- Email Google belum terdaftar → auto-register (skip OTP, karena Google sudah verifikasi)
- Email sudah terdaftar manual → link akun, login langsung
- Email sudah terdaftar Google lain → tampilkan error "Email sudah digunakan"

---

### 5.5 Keranjang (Cart)

**Validasi Cart:**
- Saat membuka cart, sistem cek ke API:
  - Produk dihapus admin → item dihapus otomatis dari cart + snackbar informasi
  - Produk stok habis → item di-flag "Stok habis", tidak bisa checkout
  - Harga berubah → update harga di cart + tampilkan notif "Harga beberapa produk telah berubah"
- Validasi dilakukan juga saat proses checkout

**Layout:**
- Header: "Keranjang" + jumlah item valid
- List item (card per produk):
  - Checkbox pilih item
  - Thumbnail produk
  - Nama + varian
  - Badge "Stok Habis" jika tidak tersedia
  - `[−] n [+]` quantity selector
  - Tombol 🗑 hapus
  - Subtotal per item
- Checkbox "Pilih Semua" di atas list
- **Sticky bottom**: Total (hanya item terpilih) + Tombol [Checkout (n item)]
- Cart kosong → ilustrasi + tombol [Mulai Belanja]

---

### 5.6 Checkout

**Validasi awal checkout:**
- Semua item masih tersedia (cek stok real-time)
- Minimal order terpenuhi (admin configurable)
- Area pengiriman terjangkau (berdasarkan alamat)
- Jika ada yang gagal → tampilkan peringatan spesifik sebelum lanjut

**Section 1 — Alamat Pengiriman:**
- Jika belum ada alamat → card [+ Tambah Alamat] (redirect ke form alamat)
- Jika ada → alamat utama + badge "Utama" + tombol [Ganti]
- Bottom sheet ganti alamat: daftar alamat + [+ Tambah Alamat Baru]

**Section 2 — Detail Pesanan:**
- List produk terpilih, editable quantity `[−] n [+]` + hapus
- Subtotal produk

**Section 3 — Jadwal Pengiriman:**
- Default: belum dijadwalkan (wajib diisi sebelum bisa buat pesanan)
- Tombol [Atur Jadwal] → bottom sheet:
  - Calendar picker (hanya tanggal yang tersedia + tidak habis kapasitas slot-nya)
  - Chips slot waktu: Pagi / Siang / Sore (hanya yang tersedia di tanggal itu)
  - Tombol [Konfirmasi Jadwal]
  - Jika semua slot penuh → pesan "Tidak ada slot tersedia untuk tanggal ini"

**Section 4 — Metode Pengiriman:**
- Regular (estimasi 2 hari): GRATIS
- Instant (hari ini, jika slot tersedia): + Rp xxx (admin atur)

**Section 5 — Kode Promo:**
- Field input kode + tombol [Pakai]
- Validasi real-time: tampilkan diskon atau pesan error inline

**Section 6 — Metode Pembayaran:**
- QRIS (via Midtrans)
- Transfer Bank / Virtual Account (BCA, Mandiri, BNI, BRI)
- COD (bayar saat barang tiba — hanya tersedia jika admin mengaktifkan untuk area tersebut)

**Section 7 — Ringkasan Harga:**
- Subtotal produk
- Ongkos kirim
- Diskon promo (jika ada)
- **Grand Total**

**Sticky Bottom:**
- Grand Total + Tombol **[Buat Pesanan]**

**Flow Buat Pesanan:**
1. Cek nomor WhatsApp user → jika belum ada, muncul bottom sheet input nomor WA
2. Konfirmasi nomor → [Simpan & Lanjutkan]
3. → Halaman Pembayaran

---

### 5.7 Pembayaran

#### QRIS
- Screen: QR Code dari Midtrans
- Timer countdown 15 menit (progress bar)
- Auto-refresh status tiap 5 detik (polling API backend)
- Tombol [Saya Sudah Bayar] (trigger manual check)
- Berhasil → Screen Pesanan Berhasil
- Expired/gagal → Screen Pembayaran Gagal

#### Transfer Bank (Virtual Account)
- Screen: Nomor VA + nama bank + nominal + batas waktu 24 jam
- Instruksi transfer per bank (accordion)
- Tombol [📋 Salin Nomor VA]
- Auto-refresh status (polling)
- Berhasil → Screen Pesanan Berhasil

#### COD
- Langsung → Screen Pesanan Berhasil
- Status pembayaran: "Menunggu Pembayaran" (dibayar saat pengantaran)
- Jika saat pengantaran penerima tidak bisa bayar → driver laporkan masalah (lihat flow driver)

#### Screen: Pesanan Berhasil
- Animasi Lottie sukses (centang hijau)
- Kode Pesanan (dengan tombol [📋 Salin])
- Ringkasan singkat: jumlah item, jadwal pengiriman, metode bayar
- Tombol [📦 Lacak Pesanan]
- Tombol [🏠 Kembali ke Home]

#### Screen: Pembayaran Gagal
- Ilustrasi error
- Pesan: alasan gagal (expired, dibatalkan, dll)
- Tombol [🔄 Coba Metode Lain]
- Tombol [❌ Batalkan Pesanan]

---

### 5.8 Halaman Orders

**Tab 1 — Dalam Proses:**
Card per pesanan:
- Kode pesanan + tanggal pesan
- List nama produk (max 2 ditampilkan + "dan X lainnya")
- Badge status (warna-coded):
  - 🟡 Menunggu Pembayaran
  - 🔵 Pesanan Diterima
  - 🟣 Sedang Diproses
  - 🟠 Menunggu Driver
  - 🚚 Dalam Perjalanan
  - ⚠️ Ada Masalah
- Total harga
- Tombol [Lihat Detail]

**Tab 2 — Riwayat:**
- Pesanan selesai dan dibatalkan
- Badge: ✅ Selesai | ❌ Dibatalkan | ⚠️ Bermasalah
- Tombol [🔁 Beli Lagi] → add produk yang masih ada ke cart
- Tombol [Lihat Detail]

---

### 5.9 Detail Pesanan (User)

**Header:**
- Kode Pesanan + tombol [📋 Salin]
- Tombol **[💬 Hubungi Kurir via WhatsApp]** — muncul hanya jika status "Dalam Perjalanan" atau setelahnya
  - Deep link: `https://wa.me/[nomor_wa_driver]?text=Halo, saya penerima pesanan #[kode]`
- Tombol **[🆘 Bantuan]** — WhatsApp ke nomor admin (selalu tampil)

**Section: Timeline Status Pengiriman:**
```
● Pesanan Diterima        ✅  12 Jan 2026 · 10:00
● Pesanan Diproses        ✅  12 Jan 2026 · 11:30
● Dalam Perjalanan        ✅  12 Jan 2026 · 14:00
● Selesai                 ⏳  (estimasi: 12 Jan 2026 · 16:00)
```
- Garis vertikal, dot berwarna, animasi pulse di status aktif
- Jika ada masalah dilaporkan driver → muncul node "⚠️ Masalah Dilaporkan" + deskripsi masalah

**Section: Detail Produk:**
Card per item: thumbnail + nama + varian + qty × harga + total

**Section: Ringkasan Pembayaran:**
- Subtotal, ongkir, diskon, grand total, metode bayar, status bayar

---

### 5.10 Profil User

**Layout:**
- Avatar / foto profil (circle)
- Nama + email

**Menu:**
- ✏️ Edit Profil
- 📍 Alamat Saya
- 🔔 Pengaturan Notifikasi
- 🔒 Ubah Password (hanya jika daftar manual)
- ❓ Bantuan (WhatsApp admin)
- 🚪 Keluar

#### Screen: Edit Profil
- Foto: tap untuk ganti (kamera/galeri), max 2MB, auto-compress ke JPEG/WebP < 500KB
- Nama Lengkap
- Nomor WhatsApp (format +62)
- Email (read-only jika Google Sign-In; editable jika manual, perlu verifikasi OTP ulang)
- Tombol [Simpan Perubahan]

#### Screen: Alamat Saya
- List alamat (card):
  - Badge "Utama" pada alamat utama
  - Nama penerima, nomor WA, alamat ringkas
  - Tombol [Edit] | [Hapus] (konfirmasi sebelum hapus)
  - Tombol [Jadikan Utama]
- Tombol [+ Tambah Alamat]

#### Screen: Form Tambah/Edit Alamat
- Peta interaktif (MapLibre + OSM) di bagian atas — drag pin untuk pilih lokasi
- Tombol [📍 Gunakan Lokasi Saya] (GPS)
- Field: Nama Penerima
- Field: Nomor WhatsApp Penerima
- Field: Alamat Lengkap (auto-fill dari reverse geocoding Nominatim, bisa edit manual)
- Field: Catatan untuk Kurir (opsional, contoh: "Rumah pagar hijau, belakang warung")
- Toggle: ⭐ Jadikan Alamat Utama
- Tombol [💾 Simpan Alamat]

---

## 6. Flow Lengkap: Driver (driver_app)

### 6.1 Registrasi & Verifikasi Driver

#### Screen: Registrasi Driver
- Nama Lengkap
- Email
- Nomor WhatsApp (untuk komunikasi dengan penerima & admin)
- Password + Konfirmasi Password
- Tombol [Daftar sebagai Driver]
- Link: *"Sudah punya akun? Masuk"*

#### Screen: Upload KTP
- Instruksi singkat: "Upload foto KTP Anda yang jelas dan terbaca"
- Area upload foto (tap untuk kamera atau galeri)
- Preview foto setelah dipilih
- Tombol [🔄 Ambil Ulang] jika kurang jelas
- Tombol [📤 Kirim untuk Verifikasi]
- Setelah submit → redirect ke screen Menunggu Verifikasi

#### Screen: Menunggu Verifikasi
- Ilustrasi "sedang diproses"
- Teks: *"Akun Anda sedang diverifikasi oleh tim kami. Proses ini biasanya memakan waktu 1×24 jam."*
- Nomor WhatsApp admin untuk tanya status
- Tombol [🔄 Refresh Status]
- Tombol [📞 Hubungi Admin]
- Approved → push notif "Selamat! Akun driver Anda telah diverifikasi." → redirect ke Home driver
- Rejected → push notif "Verifikasi ditolak: [alasan]" → kembali ke screen Upload KTP untuk upload ulang

#### Screen: Login Driver
- Email + Password
- Tidak ada Google Sign-In untuk driver (perlu konsistensi data identitas)
- Link: *"Lupa password?"* → flow OTP email sama seperti user

---

### 6.2 Dashboard Driver — Home

**Kondisi Offline / Tidak ada order:**
```
┌──────────────────────────────────────┐
│  Halo, [Nama] 👋      [● OFFLINE]   │
│                                      │
│  [Ilustrasi driver istirahat]        │
│  "Aktifkan status Online untuk       │
│   mulai menerima orderan"            │
│                                      │
│  ─────────────────────────────────   │
│  Ringkasan Hari Ini:                 │
│  📦 Orderan: 3   💰 Penghasilan:    │
│  Rp 45.000                           │
└──────────────────────────────────────┘
│  🏠 Home  [●━━●] Toggle  👤 Profil  │
```

**Kondisi Online / Ada Order Aktif:**
```
┌──────────────────────────────────────┐
│  Halo, [Nama] 👋      [● ONLINE]    │
│                                      │
│  ── ORDER AKTIF ──────────────────   │
│  👤 Budi Santoso   📋 #DG-20260412  │
│  📦 5 item  ⭐ 4.8  💳 Transfer     │
│  💰 Rp 185.000                       │
│  [📋 Lihat Detail Pesanan]          │
│                                      │
│  ─────────────────────────────────   │
│  [PETA — MapLibre + OSM]             │
│  Titik A: 📍 Gudang (Pickup)        │
│  Titik B: 🏠 Alamat Penerima        │
│  (garis rute ditampilkan)            │
│                                      │
│  ─────────────────────────────────   │
│  STATUS PENGANTARAN:                 │
│  ✅ Pesanan Diterima                 │
│  ✅ Menuju Pickup                    │
│  ○  Tiba di Pickup                   │  ← status aktif (pulse)
│  ○  Ambil Barang                     │
│  ○  Dalam Pengantaran               │
│  ○  Selesai                          │
│                                      │
│  [✅ Saya Sudah Tiba di Pickup]      │  ← tombol aksi kontekstual
└──────────────────────────────────────┘
│  🏠 Home  [●━━●] Toggle  👤 Profil  │
```

**State Machine Status & Tombol Aksi:**

| Status Aktif | Label Tombol | Status Setelah Tap |
|---|---|---|
| Order diterima | [🚗 Mulai Menuju Pickup] | Menuju Pickup |
| Menuju Pickup | [📍 Saya Sudah Tiba di Pickup] | Tiba di Pickup |
| Tiba di Pickup | [📦 Konfirmasi Ambil Barang] | Ambil Barang |
| Ambil Barang | [🚀 Mulai Pengantaran] | Dalam Pengantaran |
| Dalam Pengantaran (COD) | [💵 Konfirmasi COD + Upload Bukti] | → flow COD |
| Dalam Pengantaran (non-COD) | [✅ Pesanan Telah Diterima] | → screen upload bukti |

Setiap perubahan status → push notif ke user + update timeline pesanan user.

---

### 6.3 Titik Pickup Gudang di Peta Driver

- Titik pickup gudang **otomatis ditampilkan** di peta driver berdasarkan koordinat yang diset admin.
- Pada peta: marker khusus ikon gudang 🏭 (berbeda dari marker penerima 🏠)
- Jika admin mengubah lokasi gudang → driver otomatis mendapat koordinat terbaru saat membuka order
- Driver bisa tap marker gudang → lihat:
  - Nama gudang / pickup point
  - Alamat lengkap
  - Nomor WhatsApp admin/gudang (untuk tanya kondisi stok)
  - Tombol [🗺 Buka di Maps] (buka di Google Maps / OSM eksternal untuk navigasi)

---

### 6.4 Driver Hubungi Penerima via WhatsApp

Tombol **[💬 Hubungi Penerima]** tersedia di:
1. **Halaman Detail Order** (setelah order diterima driver)
2. **Home screen** selama order aktif (shortcut di card order aktif)

Aksi tombol:
- Deep link WhatsApp: `https://wa.me/[nomor_wa_penerima]?text=Halo%20[nama_penerima],%20saya%20driver%20Dapur%20Gizi%20yang%20akan%20mengantar%20pesanan%20%23[kode_order]%20Anda.`
- Pesan template otomatis (bisa diedit sebelum kirim karena deep link membuka WhatsApp)
- Nomor WA yang digunakan adalah nomor WA penerima di alamat pengiriman

**Kapan tombol ini muncul:**
- Setelah driver menerima order (status ≥ "Menuju Pickup")
- Tersedia sampai pesanan selesai

---

### 6.5 Detail Order (Driver)

Screen ini muncul saat driver tap "Lihat Detail Pesanan" dari home:

```
┌──────────────────────────────────────┐
│  ← Detail Pesanan #DG-20260412      │
│                                      │
│  👤 Penerima: Budi Santoso          │
│  📞 [💬 Hubungi Penerima via WA]   │  ← deep link WA
│  🏠 Jl. Melati No. 5, Kel. X       │
│  📝 "Rumah pagar biru"              │  ← catatan penerima
│                                      │
│  📍 Pickup: Gudang Dapur Gizi       │
│     Jl. Merdeka No. 10              │
│  [🗺 Buka di Maps]                  │
│                                      │
│  ── ITEM PESANAN ─────────────────   │
│  🖼 Beras 5kg × 2 = Rp 130.000     │
│  🖼 Telur 1 ikat × 1 = Rp 28.000   │
│  (+ 3 item lainnya)                 │
│  [Lihat Semua Item]                 │
│                                      │
│  💳 Metode Bayar: Transfer Bank     │
│  💰 Total: Rp 185.000              │
│                                      │
│  ── KONTAK ──────────────────────   │
│  [💬 Hubungi Penerima]             │
│  [📞 Hubungi Admin]                │
│                                      │
│  [⚠️ Laporkan Masalah]             │
└──────────────────────────────────────┘
```

---

### 6.6 Upload Bukti Pengantaran

Setelah driver tap [Pesanan Telah Diterima]:

**Screen: Upload Bukti Pengantaran**
- Instruksi: *"Foto bukti pengantaran diperlukan untuk konfirmasi. Pastikan foto jelas dan menampilkan paket di depan rumah/lokasi penerima."*
- Tombol [📷 Ambil Foto] (wajib dari kamera, bukan galeri, untuk autentikasi)
- Preview foto
- Tombol [🔄 Ambil Ulang]
- Field: Catatan opsional (contoh: "Diterima langsung oleh penerima")
- Tombol [✅ Konfirmasi Selesai]

Setelah konfirmasi:
- Status pesanan → Selesai
- Foto tersimpan di MinIO
- Push notif ke user: "Pesanan Anda telah diterima! Terima kasih sudah berbelanja."
- Push notif ke admin: "Pesanan #xxx selesai diantar oleh [nama driver]"

---

### 6.7 COD — Flow Pembayaran

Saat driver tap [Konfirmasi COD + Upload Bukti]:

**Screen: Konfirmasi COD**
- Total yang harus diterima: **Rp xxx.xxx** (besar, bold)
- Checklist konfirmasi: "Saya telah menerima uang tunai sebesar Rp xxx.xxx dari penerima"
- Toggle konfirmasi
- Tombol [📷 Upload Foto Bukti]
- Tombol [✅ Konfirmasi Pembayaran COD]

**Jika penerima tidak bisa bayar / tidak ada di tempat:**
- Tombol [⚠️ Laporkan Masalah] di screen ini
- Flow Laporkan Masalah (lihat 6.8)

---

### 6.8 Laporkan Masalah

Driver bisa melaporkan masalah dari:
- Detail Order (tombol ⚠️ Laporkan Masalah)
- Screen Konfirmasi COD

**Bottom Sheet / Screen: Laporkan Masalah**

Pilih jenis masalah (radio button):
- 🏠 Alamat tidak ditemukan
- 🚪 Penerima tidak ada di tempat
- 💵 Penerima tidak bisa bayar (COD)
- 📦 Barang rusak / tidak sesuai
- 🚗 Kendala kendaraan / ban bocor
- 📝 Lainnya (field teks wajib diisi)

Field: Keterangan tambahan (opsional untuk pilihan selain "Lainnya")
Tombol [📷 Lampirkan Foto] (opsional)
Tombol [📤 Kirim Laporan]

Setelah submit:
- Admin mendapat notifikasi "⚠️ Masalah pada pesanan #xxx: [jenis masalah]"
- Status pesanan user berubah ke "⚠️ Ada Masalah"
- Timeline user menampilkan node masalah dengan deskripsi
- Admin bisa resolve masalah dari panel (ubah status, hubungi user/driver)

---

### 6.9 Penawaran Orderan (Interruptive UI)

Saat driver Online dan ada orderan masuk:

```
┌──────────────────────────────────────────┐
│                                          │
│  🔔  ORDERAN MASUK!                     │
│  Terima sebelum waktu habis             │
│                                          │
│         ╭──────────────╮                │
│         │   ⏱  0:28   │  ← countdown  │
│         ╰──────────────╯                │
│    (lingkaran progress mengecil)        │
│                                          │
│  ⚠️ Order akan diberikan ke driver lain │
│     jika tidak merespon.                │
│                                          │
│  ─────────────────────────────────────  │
│  👤 Pemesan: Ibu Sari                  │
│  📦 Jumlah Item: 8 item                │
│  ⭐ Rating Pemesan: 4.9 (23 order)     │
│  💳 Metode: COD                        │
│  💰 Total Order: Rp 280.000            │
│                                          │
│  📍 Pickup: Gudang Dapur Gizi          │
│     Jl. Merdeka No. 10                 │
│  🏠 Drop: Jl. Melati No. 5, Kel. X    │
│  🕐 Estimasi Waktu: ±35 menit          │
│  💵 Fee Driver: Rp 15.000              │
│                                          │
│  📋 Detail Item:                        │
│  • Beras 5kg (2 pcs)                   │
│  • Telur (1 ikat)                      │
│  • + 6 item lainnya                    │
│                                          │
│  [❌  TOLAK]        [✅  TERIMA]        │
└──────────────────────────────────────────┘
```

- Timer: 30 detik (configurable admin, default 30 detik)
- Timer habis atau Tolak → broadcast ke driver Online berikutnya
- Prioritas broadcast: driver rating tertinggi + beban orderan hari ini terendah
- Jika tidak ada driver Online → notif ke admin "⚠️ Tidak ada driver tersedia untuk pesanan #xxx"

---

### 6.10 Toggle Online/Offline

- Switch di bottom navigation bar (posisi tengah)
- Saat toggle ke Online:
  - Konfirmasi: "Aktifkan mode Online? Anda akan mulai menerima orderan."
  - Driver mulai menerima broadcast order
- Saat toggle ke Offline:
  - Jika tidak ada order aktif → langsung offline
  - Jika ada order aktif → peringatan "Anda masih memiliki orderan aktif. Selesaikan dahulu sebelum offline."
  - Force offline tetap bisa (dengan konfirmasi + alasan) → admin mendapat notifikasi

---

### 6.11 Profil Driver

- Foto profil (editable, max 2MB)
- Nama, email, nomor WhatsApp
- Status verifikasi + tanggal verifikasi
- Rating rata-rata ⭐ (dari semua pesanan selesai)
- Total pesanan selesai

**Menu:**
- 📊 Riwayat Penghasilan
- 📋 Riwayat Pesanan
- 📄 Dokumen (KTP — lihat saja, request update ke admin)
- 🔒 Ubah Password
- ❓ Hubungi Admin
- 🚪 Keluar

#### Screen: Riwayat Penghasilan

**Header filter:** Hari Ini | Minggu Ini | Bulan Ini | Kustom (date picker)

**Summary card:**
- Total Penghasilan: Rp xxx.xxx
- Total Pesanan Selesai: n
- Rata-rata per Pesanan: Rp xxx

**List transaksi:**
Card per pesanan:
- Tanggal & jam selesai
- Kode pesanan
- Nama penerima
- Fee yang diterima: Rp xxx
- Status: Sudah Dibayar / Belum Dibayar (jika fee dibayar mingguan oleh admin)

**Tombol [📥 Export PDF]** (ringkasan bulanan)

#### Screen: Riwayat Pesanan Driver

List semua pesanan (selesai, dibatalkan, bermasalah):
- Kode, tanggal, nama penerima, status, fee
- Tap → lihat detail pesanan (read-only)

---

## 7. Flow Lengkap: Admin Panel Web

Admin menggunakan **web panel** di `admin.dapurgizi.com`, bukan aplikasi mobile.

### 7.1 Login Admin
- Email + Password
- Opsional: 2FA via OTP email
- Session timeout: 8 jam
- IP whitelist (opsional, konfigurasi Nginx)

---

### 7.2 Dashboard Utama

**Widget ringkasan (top cards):**
- 📦 Total pesanan hari ini
- 💰 Revenue hari ini
- 💰 Revenue bulan ini
- ⏳ Pesanan menunggu konfirmasi (merah jika > 5)
- ⚠️ Laporan masalah belum ditangani (merah)
- 🚚 Driver Online saat ini
- 👥 User baru bulan ini

**Grafik:**
- Line chart: Revenue 7 / 30 hari terakhir
- Bar chart: Produk terlaris (by qty dan by revenue)
- Donut chart: Distribusi metode pembayaran

**Feed aktivitas terbaru:**
- Pesanan baru masuk (real-time)
- Masalah driver baru
- Driver baru menunggu verifikasi

---

### 7.3 Manajemen Titik Pickup / Gudang

**Lokasi menu:** Pengaturan → Titik Pickup

**Form Konfigurasi Gudang:**
- Nama Pickup Point (contoh: "Gudang Utama Dapur Gizi")
- **Peta interaktif** (MapLibre + OSM):
  - Admin drag-and-drop pin untuk menentukan lokasi tepat gudang
  - Atau input koordinat manual (lat, lng)
  - Tombol [📍 Gunakan Lokasi Saya] (GPS browser)
- Alamat Lengkap (auto-fill dari reverse geocoding, bisa edit)
- Nomor WhatsApp Gudang/Pengelola (untuk driver yang butuh konfirmasi)
- Jam Operasional Pickup (contoh: 07:00–17:00)
- Catatan untuk Driver (contoh: "Masuk dari pintu belakang, hubungi pengelola dulu")
- Tombol [💾 Simpan]

**Catatan:** Koordinat gudang ini otomatis digunakan di:
- Peta driver (marker pickup)
- Halaman penawaran orderan (informasi lokasi pickup)
- Estimasi jarak dan rute OSRM

> Jika bisnis berkembang ke multi-gudang, tabel `pickup_points` sudah disiapkan untuk mendukung lebih dari satu titik.

---

### 7.4 Monitoring Driver (Live Map)

**Lokasi menu:** Driver → Monitoring Live

**Peta real-time (MapLibre + OSM):**
- Marker tiap driver Online dengan foto profil + nama
- Warna marker:
  - 🟢 Hijau: Online, tidak ada order aktif
  - 🔵 Biru: Sedang mengerjakan order
  - ⚫ Abu: Offline
- Tap marker driver → popup info: nama, rating, order aktif, status saat ini
- Marker gudang ditampilkan dengan ikon khusus 🏭
- Refresh posisi tiap 15 detik (Phase 1: manual refresh; Phase 2: real-time WebSocket)

**Panel samping (list driver):**
- List driver dengan status, rating, pesanan hari ini
- Klik baris → fokus ke posisi driver di peta

---

### 7.5 Manajemen Produk

#### Daftar Produk
- Tabel: Gambar | Nama | Kategori | Harga | Diskon | Status | Tampil di Home | Aksi
- Filter: kategori, status (aktif/nonaktif/habis)
- Search: nama produk
- Bulk action: nonaktifkan, aktifkan, hapus, pindah kategori
- Tombol [+ Tambah Produk]

#### Form Tambah/Edit Produk
- **Nama Produk** (wajib)
- **Deskripsi** (rich text: bold, italic, list, dll)
- **Kategori** (dropdown, wajib)
- **Gambar**: upload max 5 foto (max 2MB each, auto-compress ke WebP), drag-to-reorder, foto pertama = thumbnail
- **Harga Normal** (Rp, wajib)
- **Harga Diskon** (Rp, opsional — otomatis hitung % diskon)
- **Satuan**: dropdown pilihan (kg, gram, liter, ml, pcs, ikat, bungkus, lusin, dus, lonjor, dll) + opsi tambah satuan baru
- **Berat** (gram, opsional)
- **Varian**: tambah/hapus varian, tiap varian punya nama + harga tambahan (Rp)
- **Stok**: toggle Unlimited / Limited
  - Limited: input jumlah stok, alert jika stok ≤ 5
- **Status**: Aktif / Nonaktif / Habis
- **Tampilkan di Beranda**: toggle (produk unggulan)
- **Urutan di Beranda**: angka (sorting)
- Tombol [💾 Simpan]

---

### 7.6 Manajemen Kategori
- Daftar: nama, icon, warna, jumlah produk, status, drag-to-reorder
- Form tambah/edit: nama, icon (upload SVG/PNG max 200KB), warna background (color picker), status
- Hapus: warning jika masih ada produk aktif di kategori ini

---

### 7.7 Manajemen Hero Banner
- Daftar + preview thumbnail
- Form tambah/edit:
  - Upload gambar (rekomendasi 1200×480px, max 2MB)
  - Judul / teks overlay (opsional)
  - Aksi: ke Kategori / Produk / URL / Tanpa Aksi
  - Jadwal: tanggal + jam mulai & selesai
  - Urutan
  - Status aktif
- Preview mobile (simulasi tampilan di app)

---

### 7.8 Manajemen Banner Promosi
- Sama seperti Hero Banner
- Posisi berbeda (di bawah kategori)
- Multiple banner bisa aktif bersamaan (carousel)

---

### 7.9 Manajemen Pesanan

#### Daftar Pesanan
- Tabel: Kode | Pelanggan | Tanggal | Jadwal Kirim | Total | Metode Bayar | Status Bayar | Status Order | Driver | Aksi
- Filter: tanggal, status, metode bayar, driver, ada masalah
- Search: kode pesanan, nama pelanggan

#### Detail Pesanan (Admin)
- Semua info pesanan + info penerima + catatan kurir
- **Log perubahan status** (timeline: siapa mengubah, kapan, dari status apa ke apa)
- Tombol ubah status manual (dengan konfirmasi):
  - [✅ Konfirmasi Pesanan] → Pesanan Diterima
  - [🔄 Tandai Sedang Diproses]
  - [🚗 Assign Driver] → dropdown driver Online
  - [✅ Selesaikan Manual]
  - [❌ Batalkan Pesanan] → input alasan → trigger refund Midtrans jika non-COD
- Tombol [🖨 Cetak Invoice] (generate PDF)
- Tombol [💬 Hubungi Pelanggan via WA] → deep link
- Tombol [💬 Hubungi Driver via WA] → deep link (jika sudah diassign)
- Jika ada laporan masalah → section khusus tampilkan masalah + foto + tombol [✅ Tandai Terselesaikan]

#### Assign Driver
- Modal: dropdown driver Online + estimasi jarak driver ke gudang
- Opsi auto-assign: sistem broadcast ke driver sesuai prioritas (rating tinggi + beban rendah)
- Jika semua driver offline → notif ke admin + opsi kirim WA broadcast ke semua driver

---

### 7.10 Manajemen Driver

#### Daftar Driver
- Tabel: Foto | Nama | Status Verifikasi | Online/Offline | Rating | Total Order | Bergabung | Aksi
- Tab khusus: **⚠️ Menunggu Verifikasi** (dengan badge merah jika ada)
- Filter: status verifikasi, status online

#### Detail Driver (Admin)
- Info lengkap: nama, email, WA, tanggal daftar
- Foto KTP (lightbox untuk zoom, pastikan jelas)
- Status verifikasi + tanggal + nama admin yang verifikasi
- Tombol [✅ Setujui] / [❌ Tolak] (input alasan jika tolak → dikirim via push notif ke driver)
- Riwayat pesanan driver
- Laporan masalah yang pernah dibuat driver
- Rating & ulasan dari pelanggan (fase 2)
- Penghasilan driver (ringkasan)
- Tombol [🚫 Nonaktifkan] / [✅ Aktifkan] (beserta alasan)
- Tombol [💬 Hubungi Driver via WA]

---

### 7.11 Manajemen User/Pelanggan

- Tabel: Nama | Email | WA | Tanggal Daftar | Total Order | Status
- Search, filter (aktif/diblokir)
- Detail user: profil, daftar pesanan, daftar alamat
- Tombol [🚫 Blokir] / [✅ Unblokir] + alasan

---

### 7.12 Konfigurasi Jadwal Pengiriman

- **Hari reguler**: Tabel Senin–Minggu, per hari ada toggle aktif + daftar slot
- **Per slot**: nama (Pagi/Siang/Sore), jam mulai, jam selesai, kapasitas maks pesanan
- **Cut-off time**: berapa jam sebelum slot dimulai order masih bisa masuk (contoh: cut-off 3 jam sebelum slot)
- **Tanggal pengecualian**: kalender untuk tandai hari libur (tidak ada pengiriman) atau kapasitas khusus
- **Pengiriman Instant**: toggle aktif, harga (flat / per-km fase 2), area yang support Instant

---

### 7.13 Konfigurasi Pengiriman & Area

- Metode pengiriman: edit nama, deskripsi, harga, estimasi
- **Area layanan**: whitelist kecamatan / kelurahan yang dilayani
  - Upload CSV atau input manual
  - Pesanan dari luar area → error di checkout "Maaf, area Anda belum terjangkau"
- Minimum order value (global, default Rp 0)
- Minimum order per metode pengiriman (contoh: Instant min Rp 50.000)

---

### 7.14 Manajemen Kode Promo

- Daftar: kode | tipe | nilai | masa berlaku | total pakai / limit | status
- Form tambah:
  - Kode (unik, case-insensitive, auto-uppercase)
  - Tipe: Persentase (%) atau Nominal (Rp)
  - Nilai diskon
  - Minimum order (Rp)
  - Maksimum diskon (untuk tipe %)
  - Batas total penggunaan (0 = tidak terbatas)
  - Batas per user (0 = tidak terbatas)
  - Masa berlaku (tanggal + jam mulai & selesai)
  - Status aktif/nonaktif
- Tombol [⏸ Nonaktifkan] / [▶ Aktifkan] langsung dari tabel

---

### 7.15 Broadcast Notifikasi

**Lokasi menu:** Notifikasi → Broadcast

- Target penerima:
  - Semua User
  - Semua Driver
  - User dengan pesanan di rentang tanggal tertentu
  - User yang belum order dalam X hari
- Judul notifikasi (max 50 karakter)
- Isi notifikasi (max 200 karakter)
- Aksi saat notif di-tap (opsional): buka halaman kategori / produk / promo tertentu
- Preview tampilan notif
- Tombol [📅 Jadwalkan] (pilih tanggal & jam kirim) atau [📤 Kirim Sekarang]
- Riwayat broadcast: tanggal, target, jumlah terkirim, jumlah dibuka

---

### 7.16 Konfigurasi Aplikasi

**Tab: Info Umum**
- Nama aplikasi
- Logo (upload)
- Deskripsi singkat
- Nomor WhatsApp admin (untuk tombol Bantuan di app user & driver)
- Nomor WhatsApp gudang (untuk driver yang butuh konfirmasi saat pickup)

**Tab: Titik Pickup Gudang**
- (Lihat detail di 7.3)

**Tab: Driver**
- Fee driver: nominal flat per order atau persentase
- Sistem fee: langsung / mingguan / bulanan
- Timer penawaran orderan: detik (default 30)
- Maksimum tolak orderan per hari (sebelum driver di-suspend sementara)

**Tab: Pembayaran**
- Toggle aktif/nonaktif per metode (QRIS, VA, COD)
- Area yang support COD (whitelist kecamatan)
- Konfigurasi Midtrans (Merchant ID, Server Key — tersimpan enkripsi)

**Tab: Konten Legal**
- Syarat & Ketentuan (rich text)
- Kebijakan Privasi (rich text)
- Tampil di profil user

**Tab: Template Notifikasi**
- Edit teks push notification per event (dengan variabel: {nama}, {kode_order}, dst)

---

### 7.17 Laporan & Analitik

- **Laporan Penjualan**: harian/mingguan/bulanan, filter custom, total revenue, total order, rata-rata order value
- **Laporan Produk**: terlaris by qty dan by revenue, produk tidak pernah terjual
- **Laporan Driver**: order selesai, rating, penghasilan, masalah yang dilaporkan
- **Laporan Pesanan Bermasalah**: list pesanan dengan masalah + resolusinya
- **Laporan Pembatalan**: pesanan dibatalkan + alasan + refund status
- Export: CSV dan PDF
- Filter: rentang tanggal kustom

---

## 8. Fitur Lintas Role

### 8.1 Pencarian Produk
- Real-time search by nama
- Filter: kategori, harga min-max, diskon saja
- Sorting: Terbaru | Harga ↑ | Harga ↓ | Terpopuler
- Grid produk 2 kolom (sama seperti home)

### 8.2 Kode Promo
- Field input di checkout, validasi real-time
- Diskon tampil di ringkasan sebelum konfirmasi

### 8.3 Rating & Ulasan (Fase 2)
- Prompt ke user setelah pesanan selesai
- Rating 1–5 bintang + teks ulasan
- Muncul di card produk (opsional) dan profil driver
- Admin bisa moderate ulasan

---

## 9. Notifikasi & Real-time

### 9.1 Push Notification (FCM)

| Event | Penerima | Konten |
|---|---|---|
| Pesanan berhasil dibuat | User | "Pesanan #xxx berhasil! Kami segera memproses." |
| Pembayaran berhasil | User | "Pembayaran #xxx diterima. Terima kasih!" |
| Status pesanan berubah | User | "Update #xxx: [status baru]" |
| Driver assigned | User | "Driver [Nama] akan mengantarkan pesananmu!" |
| Driver dalam perjalanan | User | "[Nama Driver] sedang menuju rumahmu! 🚗" |
| Pesanan selesai | User | "Pesanan #xxx telah diterima. Selamat menikmati! 🎉" |
| Masalah pada pesanan | User | "Ada kendala pada pesanan #xxx. Tim kami akan menghubungi Anda." |
| Orderan masuk | Driver | "Ada orderan baru! Buka app segera." |
| Akun driver disetujui | Driver | "Akun Anda telah diverifikasi! Mulai terima orderan." |
| Akun driver ditolak | Driver | "Verifikasi ditolak: [alasan]. Silakan upload ulang." |
| Masalah dilaporkan | Admin | "⚠️ Masalah pada #xxx: [jenis masalah]" |
| Tidak ada driver | Admin | "⚠️ Tidak ada driver untuk #xxx. Assign manual." |
| Pesanan baru | Admin | "📦 Pesanan baru #xxx dari [Nama User]" |

### 9.2 Real-time
- **WebSocket (Socket.IO)** untuk:
  - Status pembayaran QRIS/VA (fallback: polling 5 detik) → **user_app**
  - Update status pesanan ke user (timeline real-time) → **user_app**
  - Broadcast orderan ke driver (penawaran) → **driver_app**
  - Posisi driver di peta admin (Phase 2) → **driver_app** kirim, **admin_web** terima
- Driver kirim koordinat GPS setiap 15 detik saat Online dan ada order aktif (background service di **driver_app** saja)

### 9.3 FCM Topic & Channel Separation

Karena User dan Driver adalah 2 app terpisah, Firebase project menggunakan **2 Firebase App registration** (1 per app) dengan FCM topic terpisah:

| App | Firebase App ID | FCM Topics | Android Channel |
|---|---|---|---|
| user_app | `com.dapurgizi.user` | `all_users`, `user_{id}` | `orders`, `promos`, `general` |
| driver_app | `com.dapurgizi.driver` | `all_drivers`, `driver_{id}` | `orders`, `verification`, `general` |

- Backend mengirim notif ke topic/token spesifik per app → tidak ada notif nyasar ke app yang salah
- `fcm_token` di tabel `users` menyimpan token per device — 1 user hanya bisa login di 1 app sesuai role-nya

---

## 10. Pembayaran Midtrans

### 10.1 Metode
- **QRIS**: QR universal semua e-wallet & bank
- **Virtual Account**: BCA, Mandiri, BNI, BRI, Permata
- **COD**: handled manual (tidak via Midtrans)

### 10.2 Flow Teknis
1. Backend buat transaksi → Midtrans API → dapat token/QR/nomor VA
2. Flutter tampilkan UI pembayaran
3. Midtrans kirim webhook ke `https://api.dapurgizi.com/api/payment/webhook`
4. Backend validasi signature, update status pesanan
5. Backend kirim FCM ke user
6. Semua response Midtrans disimpan di tabel `payment_logs`

### 10.3 Refund
- Dibatalkan sebelum diproses: refund otomatis via Midtrans API
- Sudah diproses: refund manual admin + konfirmasi WA ke user
- Catatan refund tersimpan di `refund_logs`

---

## 11. Peta & Pengiriman

### 11.1 Stack Peta

| Komponen | Teknologi | Keterangan |
|---|---|---|
| Flutter widget | flutter_map | Open source, gratis |
| Map tiles | OSM CDN (awal) → Protomaps self-host | Gratis |
| Geocoding | Nominatim self-host | Gratis, privasi terjaga |
| Routing | OSRM self-host | Estimasi jarak & waktu |
| Admin web | MapLibre GL JS | Gratis, open source |

### 11.2 Fitur Peta Per Role

| Fitur | User | Driver | Admin |
|---|---|---|---|
| Pin alamat pengiriman | ✅ (form alamat) | ❌ | ❌ |
| Lihat titik pickup gudang | ❌ | ✅ (di peta order aktif) | ✅ (set di pengaturan) |
| Lihat titik tujuan pengiriman | ❌ | ✅ | ✅ |
| Lihat posisi driver | ❌ (fase 2) | ✅ (posisi sendiri) | ✅ (semua driver) |
| Estimasi jarak/waktu | ❌ | ✅ (pickup → drop) | ✅ |

---

## 12. Database Schema

```sql
-- USERS
users
  id UUID PK
  name VARCHAR(100)
  email VARCHAR(150) UNIQUE
  phone_wa VARCHAR(20)
  password_hash VARCHAR
  avatar_url VARCHAR
  google_id VARCHAR UNIQUE NULLABLE
  role ENUM('user','driver','admin')
  is_active BOOLEAN DEFAULT true
  email_verified_at TIMESTAMP NULLABLE
  fcm_token VARCHAR NULLABLE
  created_at TIMESTAMP
  updated_at TIMESTAMP

-- DRIVER PROFILES
driver_profiles
  id UUID PK
  user_id UUID FK(users)
  ktp_photo_url VARCHAR
  verification_status ENUM('pending','approved','rejected')
  verified_at TIMESTAMP NULLABLE
  verified_by UUID FK(users) NULLABLE
  rejection_reason TEXT NULLABLE
  rating_avg DECIMAL(3,2) DEFAULT 0
  total_orders_done INT DEFAULT 0
  is_online BOOLEAN DEFAULT false
  last_lat DECIMAL(10,7) NULLABLE
  last_lng DECIMAL(10,7) NULLABLE
  last_location_at TIMESTAMP NULLABLE
  created_at TIMESTAMP

-- ADDRESSES
addresses
  id UUID PK
  user_id UUID FK(users)
  recipient_name VARCHAR(100)
  phone_wa VARCHAR(20)
  lat DECIMAL(10,7)
  lng DECIMAL(10,7)
  full_address TEXT
  notes TEXT NULLABLE
  is_primary BOOLEAN DEFAULT false
  created_at TIMESTAMP

-- PICKUP POINTS (GUDANG)
pickup_points
  id UUID PK
  name VARCHAR(100)
  lat DECIMAL(10,7)
  lng DECIMAL(10,7)
  full_address TEXT
  phone_wa VARCHAR(20)
  operational_hours VARCHAR(50)
  notes_for_driver TEXT NULLABLE
  is_active BOOLEAN DEFAULT true
  created_at TIMESTAMP

-- CATEGORIES
categories
  id UUID PK
  name VARCHAR(100)
  icon_url VARCHAR
  bg_color VARCHAR(7)
  sort_order INT DEFAULT 0
  is_active BOOLEAN DEFAULT true

-- PRODUCTS
products
  id UUID PK
  name VARCHAR(200)
  description TEXT
  category_id UUID FK(categories)
  price INT
  discount_price INT NULLABLE
  discount_percent INT NULLABLE
  unit VARCHAR(50)
  weight_gram INT NULLABLE
  images JSONB
  is_unlimited_stock BOOLEAN DEFAULT true
  stock_qty INT DEFAULT 0
  is_active BOOLEAN DEFAULT true
  is_featured BOOLEAN DEFAULT false
  sort_order INT DEFAULT 0
  created_at TIMESTAMP
  updated_at TIMESTAMP

-- PRODUCT VARIANTS
product_variants
  id UUID PK
  product_id UUID FK(products)
  name VARCHAR(100)
  price_addition INT DEFAULT 0
  is_active BOOLEAN DEFAULT true

-- BANNERS
banners
  id UUID PK
  type ENUM('hero','promo')
  image_url VARCHAR
  title VARCHAR NULLABLE
  action_type ENUM('none','category','product','url')
  action_value VARCHAR NULLABLE
  sort_order INT DEFAULT 0
  is_active BOOLEAN DEFAULT true
  start_at TIMESTAMP NULLABLE
  end_at TIMESTAMP NULLABLE

-- DELIVERY SLOTS
delivery_slots
  id UUID PK
  day_of_week SMALLINT (0=Minggu, 6=Sabtu)
  label VARCHAR(50)
  start_time TIME
  end_time TIME
  max_orders INT DEFAULT 50
  cutoff_hours INT DEFAULT 3
  is_active BOOLEAN DEFAULT true

-- DELIVERY SLOT EXCEPTIONS
delivery_slot_exceptions
  id UUID PK
  exception_date DATE
  slot_id UUID FK(delivery_slots) NULLABLE
  is_closed BOOLEAN DEFAULT false
  override_max_orders INT NULLABLE
  reason VARCHAR NULLABLE

-- ORDERS
orders
  id UUID PK
  code VARCHAR(20) UNIQUE
  user_id UUID FK(users)
  driver_id UUID FK(users) NULLABLE
  pickup_point_id UUID FK(pickup_points) NULLABLE
  address_snapshot JSONB
  delivery_type ENUM('regular','instant')
  delivery_slot_id UUID FK(delivery_slots) NULLABLE
  scheduled_date DATE NULLABLE
  payment_method ENUM('qris','va','cod')
  payment_status ENUM('pending','paid','failed','refunded')
  order_status ENUM('waiting_payment','received','processing','waiting_driver','in_delivery','delivered','completed','cancelled','problem')
  subtotal INT
  delivery_fee INT DEFAULT 0
  discount_amount INT DEFAULT 0
  grand_total INT
  midtrans_transaction_id VARCHAR NULLABLE
  midtrans_payment_type VARCHAR NULLABLE
  proof_photo_url VARCHAR NULLABLE
  notes TEXT NULLABLE
  problem_type VARCHAR NULLABLE
  problem_description TEXT NULLABLE
  problem_photo_url VARCHAR NULLABLE
  problem_resolved_at TIMESTAMP NULLABLE
  created_at TIMESTAMP
  updated_at TIMESTAMP

-- ORDER ITEMS
order_items
  id UUID PK
  order_id UUID FK(orders)
  product_id UUID FK(products) NULLABLE
  variant_id UUID FK(product_variants) NULLABLE
  product_snapshot JSONB
  qty INT
  unit_price INT
  total_price INT

-- PROMO CODES
promo_codes
  id UUID PK
  code VARCHAR(50) UNIQUE
  type ENUM('percent','nominal')
  value INT
  min_order INT DEFAULT 0
  max_discount INT NULLABLE
  total_usage_limit INT DEFAULT 0
  per_user_limit INT DEFAULT 0
  used_count INT DEFAULT 0
  is_active BOOLEAN DEFAULT true
  start_at TIMESTAMP NULLABLE
  end_at TIMESTAMP NULLABLE

-- PROMO CODE USAGES
promo_code_usages
  id UUID PK
  promo_code_id UUID FK(promo_codes)
  user_id UUID FK(users)
  order_id UUID FK(orders)
  discount_applied INT
  used_at TIMESTAMP

-- OTP / VERIFICATION CODES (disimpan di Redis, tabel ini untuk audit)
-- Redis key: otp:{type}:{email} → value: {6-digit-code}, TTL 10 menit

-- NOTIFICATIONS
notifications
  id UUID PK
  user_id UUID FK(users)
  title VARCHAR(100)
  body TEXT
  type VARCHAR(50)
  data JSONB NULLABLE
  is_read BOOLEAN DEFAULT false
  created_at TIMESTAMP

-- ORDER STATUS LOGS
order_status_logs
  id UUID PK
  order_id UUID FK(orders)
  from_status VARCHAR
  to_status VARCHAR
  changed_by UUID FK(users)
  notes TEXT NULLABLE
  created_at TIMESTAMP

-- PAYMENT LOGS
payment_logs
  id UUID PK
  order_id UUID FK(orders)
  midtrans_response JSONB
  event_type VARCHAR
  created_at TIMESTAMP

-- BROADCAST NOTIFICATIONS
broadcast_notifications
  id UUID PK
  title VARCHAR(100)
  body VARCHAR(200)
  target_type ENUM('all_users','all_drivers','custom')
  target_filter JSONB NULLABLE
  action_type VARCHAR NULLABLE
  action_value VARCHAR NULLABLE
  scheduled_at TIMESTAMP NULLABLE
  sent_at TIMESTAMP NULLABLE
  total_sent INT DEFAULT 0
  total_opened INT DEFAULT 0
  created_by UUID FK(users)
  created_at TIMESTAMP

-- APP SETTINGS
app_settings
  key VARCHAR(100) PK
  value TEXT
  updated_at TIMESTAMP
```

---

## 13. API Endpoint

### Auth
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/google
POST /api/auth/verify-email
POST /api/auth/resend-otp
POST /api/auth/forgot-password
POST /api/auth/verify-reset-otp
POST /api/auth/reset-password
POST /api/auth/logout
GET  /api/auth/me
PUT  /api/auth/fcm-token
```

### Products & Categories
```
GET  /api/categories
GET  /api/products?category=&search=&sort=&min_price=&max_price=&discount_only=&page=
GET  /api/products/:id
```

### Cart
```
POST /api/cart/validate   (validasi item cart — stok, harga, ketersediaan)
```
Cart state disimpan client-side (Hive), validasi via API saat checkout.

### Addresses
```
GET    /api/addresses
POST   /api/addresses
PUT    /api/addresses/:id
DELETE /api/addresses/:id
PUT    /api/addresses/:id/set-primary
```

### Delivery
```
GET /api/delivery/slots?date=YYYY-MM-DD   (slot tersedia di tanggal tertentu)
GET /api/delivery/options                  (Regular, Instant)
GET /api/delivery/areas                    (area yang dilayani)
```

### Promo
```
POST /api/promo/validate   { code, subtotal }
```

### Orders
```
POST /api/orders                    (buat pesanan + init payment)
GET  /api/orders                    (list pesanan user)
GET  /api/orders/:id
POST /api/orders/:id/cancel
GET  /api/orders/:id/payment-status
POST /api/payment/webhook           (Midtrans callback — public, no auth)
```

### Notifications
```
GET  /api/notifications
POST /api/notifications/:id/read
POST /api/notifications/read-all
```

### Driver
```
POST /api/driver/register
POST /api/driver/upload-ktp
GET  /api/driver/verification-status
PUT  /api/driver/online-status        { is_online: bool }
PUT  /api/driver/location             { lat, lng }
GET  /api/driver/orders/active
GET  /api/driver/orders/history
POST /api/driver/orders/:id/accept
POST /api/driver/orders/:id/reject
PUT  /api/driver/orders/:id/status    { status }
POST /api/driver/orders/:id/proof     (upload foto bukti — multipart)
POST /api/driver/orders/:id/problem   (laporkan masalah — multipart)
POST /api/driver/orders/:id/cod-confirm
GET  /api/driver/earnings?period=
```

### Admin — Products
```
GET/POST        /api/admin/products
GET/PUT/DELETE  /api/admin/products/:id
POST            /api/admin/products/:id/images
DELETE          /api/admin/products/:id/images/:imageId
```

### Admin — Categories
```
GET/POST        /api/admin/categories
GET/PUT/DELETE  /api/admin/categories/:id
PUT             /api/admin/categories/reorder
```

### Admin — Banners
```
GET/POST        /api/admin/banners
GET/PUT/DELETE  /api/admin/banners/:id
```

### Admin — Orders
```
GET             /api/admin/orders
GET             /api/admin/orders/:id
PUT             /api/admin/orders/:id/status
POST            /api/admin/orders/:id/assign-driver
POST            /api/admin/orders/:id/cancel
GET             /api/admin/orders/:id/invoice      (generate PDF)
POST            /api/admin/orders/:id/resolve-problem
```

### Admin — Drivers
```
GET             /api/admin/drivers
GET             /api/admin/drivers/:id
PUT             /api/admin/drivers/:id/verify      { status, rejection_reason? }
PUT             /api/admin/drivers/:id/activate
PUT             /api/admin/drivers/:id/deactivate
GET             /api/admin/drivers/live-locations
```

### Admin — Users
```
GET             /api/admin/users
GET             /api/admin/users/:id
PUT             /api/admin/users/:id/block
PUT             /api/admin/users/:id/unblock
```

### Admin — Config
```
GET/PUT         /api/admin/settings
GET/POST/PUT    /api/admin/delivery-slots
POST            /api/admin/delivery-slot-exceptions
GET/POST/PUT    /api/admin/promo-codes
PUT             /api/admin/promo-codes/:id/toggle
GET/POST/PUT    /api/admin/pickup-points
```

### Admin — Notifications
```
POST            /api/admin/broadcast
GET             /api/admin/broadcast/history
```

### Admin — Reports
```
GET             /api/admin/reports/revenue?from=&to=
GET             /api/admin/reports/products?from=&to=
GET             /api/admin/reports/drivers?from=&to=
GET             /api/admin/reports/problems?from=&to=
GET             /api/admin/reports/cancellations?from=&to=
POST            /api/admin/reports/export    { type, from, to, format: csv|pdf }
```

### Utilities
```
GET  /api/health
POST /api/geocode/reverse    { lat, lng }  (proxy ke Nominatim self-host)
POST /api/geocode/search     { q }
```

---

## 14. Non-Functional Requirements

### 14.1 Performa
- API response < 500ms untuk endpoint browse produk/order
- Gambar: WebP, lazy loading, dikompres otomatis saat upload, serve via Nginx
- Pagination wajib (20 item/halaman, cursor-based untuk list order driver)
- Redis cache untuk produk populer dan kategori (TTL 5 menit)

### 14.2 Keamanan
- Semua endpoint (kecuali browse publik & payment webhook) wajib JWT Bearer token
- JWT: access token 1 jam, refresh token 30 hari
- Rate limiting: 60 req/menit per IP (Nginx), 5 req/menit untuk endpoint auth
- Input validation + sanitasi di semua endpoint
- File upload: validasi MIME type (whitelist), max size, strip EXIF metadata
- Password: bcrypt hash cost 12
- Midtrans webhook: validasi signature key sebelum proses
- Admin panel: HTTPS only, session-based auth, opsional IP whitelist via Nginx
- OTP: simpan hash-nya (bukan plaintext) di Redis

### 14.3 Reliabilitas
- Target uptime: 99%
- Backup PostgreSQL harian via cron job, simpan 30 hari (lokal + opsional remote)
- Health check endpoint `/api/health`
- Error logging: gunakan Winston (Node.js) / Monolog (Laravel), rotate harian
- Queue untuk: kirim email OTP, kirim FCM notif, generate laporan besar (Redis + Bull/BeeQueue)

### 14.4 Aksesibilitas & UX
- Loading state (shimmer) di semua list & card
- Empty state (ilustrasi) di semua list kosong
- Error state dengan tombol retry di semua screen
- Semua aksi destructive (hapus, batalkan) harus ada konfirmasi dialog
- Offline state: deteksi koneksi, tampilkan banner "Tidak ada koneksi"

### 14.5 Monorepo & Build
- **Melos** untuk orchestrate build, test, lint, dan pub get di monorepo
- Shared packages (`core`, `ui_kit`, `map_kit`) menggunakan path dependency → tidak perlu publish ke pub.dev
- CI/CD: build user_app dan driver_app secara independen → hanya rebuild app yang berubah
- Code coverage: shared packages target ≥ 80%, app-level target ≥ 60%
- Linting: `flutter_lints` + custom rules, shared di `analysis_options.yaml` root
- Versioning: setiap app punya versi independen (`user_app 1.2.0`, `driver_app 1.1.3`)

---

## 15. Roadmap & Prioritas

### Fase 1 — MVP (Bulan 1–3)

**Infrastruktur & Monorepo:**
- [x] Setup monorepo Flutter dengan Melos
- [x] Setup shared packages: `core`, `ui_kit`, `map_kit`
- [x] Setup Firebase project dengan 2 app registration (user & driver)
- [x] Setup CI/CD pipeline (build user_app & driver_app independen)

**User App (`com.dapurgizi.user`):**
- [x] Onboarding guest + browse produk
- [x] Auth user: email + Google Sign-In + OTP + lupa password
- [x] Cart: lokal (Hive) + validasi saat checkout
- [x] Checkout lengkap: alamat, jadwal, metode kirim, promo, pembayaran
- [x] Integrasi Midtrans: QRIS, VA, COD
- [x] Orders: in-process + history + detail + timeline status
- [x] Profil user: edit + alamat dengan pin peta
- [x] Push notification semua event user

**Driver App (`com.dapurgizi.driver`):**
- [x] Registrasi & verifikasi driver (KTP + admin approval)
- [x] Dashboard driver: home, peta, state machine status
- [x] Penawaran orderan interruptive dengan timer
- [x] Driver hubungi penerima via WhatsApp
- [x] Upload bukti pengantaran
- [x] Laporan masalah driver
- [x] COD confirmation flow
- [x] Background GPS location service
- [x] Push notification semua event driver

**Admin Panel Web:**
- [x] Admin panel: semua modul operasional
- [x] Admin set titik pickup gudang di peta
- [x] Monitoring driver (live location — refresh manual)
- [x] Broadcast notifikasi admin

### Fase 2 — Growth (Bulan 4–6)
- [ ] Live tracking driver real-time (WebSocket, driver kirim GPS tiap 10 detik)
- [ ] Rating & ulasan produk dan driver
- [ ] Halaman ulasan di detail produk dan profil driver
- [ ] Laporan masalah: alur resolusi lebih terstruktur (admin assign, status resolusi)
- [ ] Export laporan PDF driver (penghasilan bulanan)
- [ ] Self-hosted Protomaps tile server (hemat bandwidth OSM CDN)
- [ ] Notifikasi email: konfirmasi pesanan, reminder pembayaran, pesanan selesai
- [ ] Estimasi ongkir berbasis jarak (Instant delivery)

### Fase 3 — Scale (Bulan 7+)
- [ ] Multi-gudang / multi-pickup point
- [ ] Sistem referral & poin reward
- [ ] Subscription paket mingguan
- [ ] Progressive Web App (PWA) versi user
- [ ] Integrasi akuntansi (export ke format Accurate/Jurnal)
- [ ] Aplikasi desktop admin (Electron — opsional)
- [ ] Multi-kota dengan admin per kota

---

## 16. Appendix

### A. Cart Guest — Strategi Merge
Cart guest disimpan di **Hive** (local storage Flutter). Format: `List<CartItem>` dengan `productId`, `variantId`, `qty`.

Saat user login:
1. Ambil cart lokal
2. POST `/api/cart/sync` dengan list item lokal
3. Backend merge: jika produk ada di cart server → ambil qty terbesar; jika tidak ada → tambah
4. Return cart hasil merge

### B. Format Nomor WhatsApp
- Simpan di DB: format internasional tanpa + → `628xxxxxxxxxx`
- Input user: bisa `08xx` atau `+628xx` — backend normalize
- Deep link: `https://wa.me/628xxxxxxxxxx`
- Template pesan: URL-encode untuk dimasukkan ke query `?text=`

### C. Upload Gambar — Pipeline
1. Flutter: compress dengan `flutter_image_compress` → max 800px, quality 85
2. Upload multipart ke backend
3. Backend: validasi MIME (image/jpeg, image/png, image/webp), max 2MB
4. Compress lagi dengan Sharp (Node) / Intervention Image (Laravel) → output WebP max 500KB
5. Simpan ke MinIO: `/{folder}/{uuid}.webp`
6. Return public URL via Nginx

### D. OTP — Spesifikasi Teknis
- Generate: 6 digit angka random (crypto.randomInt, bukan Math.random)
- Storage: Redis key `otp:{type}:{email}` → value `{bcrypt(code)}`, TTL 10 menit
- Validasi: bcrypt.compare(input, stored_hash)
- Max percobaan: counter di Redis key `otp_attempts:{type}:{email}`, increment per salah, TTL 10 menit
- Max 5 salah → set lock key `otp_lock:{type}:{email}` TTL 10 menit → return 429

### E. Midtrans Webhook — Validasi
```
signature = SHA512(order_id + status_code + gross_amount + server_key)
```
Verifikasi signature sebelum proses apapun. Jika tidak cocok → return 403, log anomali.

### F. Penugasan Driver — Algoritma Broadcast
```
Priority Score = (rating_avg × 10) - (orders_today × 2)
```
Broadcast ke driver Online yang belum punya order aktif, urut dari priority score tertinggi.
Timer 30 detik per driver → jika tolak/timeout → ke driver berikutnya.
Jika semua driver sudah dicoba dan tidak ada yang terima → notif admin.

### G. Foto Bukti Pengantaran
- Wajib dari **kamera langsung** (bukan galeri) → gunakan `image_picker` dengan `ImageSource.camera`
- Maksimum 5MB sebelum compress
- Setelah compress: simpan ke MinIO path `proofs/{order_id}/{timestamp}.webp`
- URL foto disimpan di `orders.proof_photo_url`
- Admin bisa lihat foto dari panel detail pesanan

### H. Struktur Kode Pesanan
Format: `DG-YYYYMMDD-XXXXX`
Contoh: `DG-20260412-00123`
Generate otomatis di backend saat pesanan dibuat. Unik, tidak auto-increment (gunakan sequence per hari di PostgreSQL).

### I. Melos Configuration (Monorepo)

```yaml
# melos.yaml
name: dapurgizi
packages:
  - apps/*
  - packages/*

command:
  bootstrap:
    usePubspecOverrides: true

scripts:
  analyze:
    run: melos exec -- flutter analyze
  test:
    run: melos exec -- flutter test
  build:user:
    run: cd apps/user_app && flutter build apk --release
  build:driver:
    run: cd apps/driver_app && flutter build apk --release
  clean:
    run: melos exec -- flutter clean
```

**Dependency rule:** App packages (`user_app`, `driver_app`) depend on shared packages. Shared packages **TIDAK BOLEH** depend pada app packages. Shared packages boleh depend satu sama lain (`ui_kit` → `core`, `map_kit` → `core`).

### J. Play Store Listing

| | User App | Driver App |
|---|---|---|
| Package Name | `com.dapurgizi.user` | `com.dapurgizi.driver` |
| App Name | Dapur Gizi | Dapur Gizi Driver |
| Category | Shopping | Business |
| Target Audience | Konsumen/pembeli | Driver mitra |
| Signing Key | Terpisah | Terpisah |
| Version | Independen | Independen |

---

*Dokumen ini adalah living document dan diperbarui seiring perkembangan produk.*

**Versi:** 2.1.0 — April 2026  
**Status:** Final Draft — Siap untuk Development  
