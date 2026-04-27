# 🏠 Roomly — Laundry & Cleaning Service

Website interaktif untuk pemesanan layanan **Laundry** dan **Cleaning Service**.
Dibangun dengan **React.js (Vite)** untuk frontend dan **Node.js + Express** untuk backend.

## 🌟 Fitur

### 1. Booking Laundry Service
- Pilih jenis layanan (Cuci Kering, Cuci+Setrika, Dry Clean, Express, dll.)
- Input detail pelanggan, alamat penjemputan, jumlah (kg/pcs), dan tanggal
- Kalkulasi harga otomatis
- Konfirmasi pesanan dengan ID unik

### 2. Booking Cleaning Service
- Pilih layanan cleaning (Standar, Deep Cleaning, Dapur, Kamar Mandi, Pasca Renovasi)
- Pilih tanggal dan jam slot kunjungan
- Input alamat dan jumlah sesi
- Kalkulasi total otomatis

### Halaman Pesanan
- Daftar semua pesanan (Laundry & Cleaning)
- Filter berdasarkan jenis layanan
- Update status pesanan (Menunggu, Diproses, Selesai, Dibatalkan)

## 🛠️ Tech Stack

| Bagian   | Teknologi                              |
|----------|----------------------------------------|
| Frontend | React 18 + Vite + React Router         |
| Backend  | Node.js + Express + CORS               |
| Storage  | In-memory (untuk demo)                 |

## 🚀 Cara Menjalankan

### 1. Backend
```bash
cd backend
npm install
npm run dev
```
Server berjalan di `http://localhost:5000`

### 2. Frontend (terminal baru)
```bash
cd frontend
npm install
npm run dev
```
Aplikasi berjalan di `http://localhost:5173`

Frontend otomatis melakukan proxy `/api/*` ke backend lewat konfigurasi Vite.

## 📡 Endpoint API

| Method | Endpoint                          | Deskripsi                      |
|--------|-----------------------------------|--------------------------------|
| GET    | `/api/health`                     | Health check                   |
| GET    | `/api/laundry/services`           | Daftar layanan laundry         |
| POST   | `/api/laundry/bookings`           | Buat booking laundry           |
| GET    | `/api/cleaning/services`          | Daftar layanan cleaning        |
| POST   | `/api/cleaning/bookings`          | Buat booking cleaning          |
| GET    | `/api/bookings`                   | Semua pesanan                  |
| PATCH  | `/api/bookings/:id/status`        | Update status pesanan          |

## 📁 Struktur Folder

```
manprod-roomly/
├── backend/
│   ├── package.json
│   └── server.js          # Express API + data layanan
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api.js          # Wrapper fetch API
        ├── styles.css
        └── pages/
            ├── Home.jsx
            ├── LaundryBooking.jsx
            ├── CleaningBooking.jsx
            └── Bookings.jsx
```
