# Sistem Capaian Pembelajaran Lulusan (CPL)

**Universitas Muhammadiyah Makassar**

Sistem terintegrasi untuk mengukur, memantau, dan mengelola Capaian Pembelajaran Lulusan (CPL) di 5 Program Studi Fakultas Teknik.

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Daftar Isi

- [Tentang Sistem](#-tentang-sistem)
- [Fitur Utama](#-fitur-utama)
- [Screenshot](#-screenshot)
- [Tech Stack](#️-tech-stack)
- [Quick Start](#-quick-start)
- [Struktur Project](#-struktur-project)
- [Dokumentasi](#-dokumentasi)
- [Akun Demo](#-akun-demo)
- [Deployment](#-deployment)
- [Kontribusi](#-kontribusi)
- [Lisensi](#-lisensi)

---

## Tentang Sistem

Sistem CPL adalah aplikasi web modern untuk mengelola dan memantau Capaian Pembelajaran Lulusan (CPL) sesuai dengan standar SNPT (Standar Nasional Pendidikan Tinggi). Sistem ini dirancang untuk membantu:

- **Kaprodi**: Monitoring pencapaian CPL mahasiswa di program studi
- **Dosen**: Input dan evaluasi nilai mata kuliah
- **Admin**: Manajemen data dan konfigurasi sistem
- **Mahasiswa**: Melihat progress pencapaian pembelajaran

### Program Studi yang Didukung

1. **S1 Teknik Informatika (INF)** - 69 Mata Kuliah, 144 SKS
2. **S1 Arsitektur (ARS)** - 50+ Mata Kuliah, 145 SKS
3. **S1 Perencanaan Wilayah Kota (PWK)** - 50+ Mata Kuliah
4. **S1 Teknik Sipil (SIP)** - 50+ Mata Kuliah
5. **S1 Teknik Elektro (ELK)** - 50+ Mata Kuliah

Setiap program studi memiliki **8 CPL** yang terstruktur sesuai kurikulum masing-masing.

---

## Fitur Utama

### **Dashboard dengan Tree Diagram**
- Visualisasi hierarki **CPL → Mata Kuliah → CPMK**
- Expandable tree untuk eksplorasi detail
- Statistik cepat: Total mahasiswa, MK, CPL tercapai
- Grafik Radar Chart untuk overview 8 CPL

###  **Input Nilai Manual**
- Form input nilai per CPMK dengan bobot otomatis
- Kalkulasi real-time nilai MK
- Auto-distribusi ke CPL terkait
- Validasi nilai 0-100

### **Laporan CPL dengan CPMK Breakdown** ⭐ NEW!
- Generate laporan per mahasiswa & semester
- **Tabel CPL expandable**: Klik untuk melihat detail
- **Breakdown lengkap**: CPL → MK → CPMK dengan bobot
- Menampilkan:
  - Bobot setiap CPMK dalam MK
  - Nilai tertimbang (Nilai × Bobot)
  - Kontribusi ke CPL (persentase)
- Export PDF/Excel (mockup)

### **Manajemen Data & Import Nilai** ⭐ NEW!

**4 Tab Terintegrasi:**

#### 1️⃣ **Tab Import Nilai**
- Upload file Excel (.xlsx) atau CSV
- Preview data sebelum import
- Validasi otomatis NIM dan nilai
- Auto-kalkulasi CPL dari nilai MK
- Statistik hasil import (Total, Sukses, Gagal)

####  **Tab Mahasiswa**
- Monitoring mahasiswa dengan nilai
- Filter per prodi
- Status: 🟢 Terimport / 🔵 Mock Data / ⚪ Manual
- Statistik: Total nilai, dari import, kelengkapan

####  **Tab Mata Kuliah**
- Grid cards dengan statistik per MK
- Rata-rata nilai dengan color coding:
  - 🟢 Hijau (≥75): Baik
  - 🟡 Kuning (60-74): Cukup
  - 🔴 Merah (<60): Kurang
- Min-Max nilai, jumlah mahasiswa
- Progress bar visual

#### 4️⃣ **Tab CPL & CPMK**
- Summary cards: Tercapai, Cukup, Belum Tercapai
- Tabel CPL dengan distribusi
- Info kalkulasi otomatis
- Filter prodi & semester

**Integrasi Real-time:**
- Import → Auto refresh semua tab
- localStorage → Persist data
- Tombol refresh manual di setiap tab

### **CPL & Pemetaan Kurikulum**
- Matrix mapping CPL ↔ MK ↔ CPMK
- Visualisasi bobot kontribusi
- 8 CPL per prodi dengan deskripsi lengkap

### **UI/UX Modern**
- **Responsive Design**: Desktop, tablet, mobile
- **Dark Mode Compatible**: Siap untuk dark theme
- **Interactive Charts**: Recharts untuk visualisasi
- **Smooth Animations**: Tailwind CSS transitions
- **Accessible**: ARIA labels, keyboard navigation

---

## 📸 Screenshot

### Dashboard dengan Tree Diagram
```
┌─────────────────────────────────────────────────────────┐
│     Dashboard CPL - Teknik Informatika                  │
├─────────────────────────────────────────────────────────┤
│  📘 CPL1: Mampu menerapkan pemikiran logis              │
│    └─ 📗 Pemrograman Web (INF101) - 3 SKS              │
│         ├─ 🟣 CPMK1-1: Konsep dasar (20%)              │
│         ├─ 🟣 CPMK1-2: HTML/CSS (30%)                  │
│         ├─ 🟣 CPMK1-3: JavaScript (25%)                │
│         └─ 🟣 CPMK1-4: Framework (25%)                 │
│    └─ 📗 Struktur Data (INF102) - 3 SKS                │
│         ├─ 🟣 CPMK2-1: Array & Linked List (25%)       │
│         └─ 🟣 CPMK2-2: Tree & Graph (25%)              │
└─────────────────────────────────────────────────────────┘
```

### Laporan CPL dengan Breakdown
```
┌─────────────────────────────────────────────────────────┐
│      Laporan CPL - Andi Miftah (105841109601)           │
│      Semester 1 | 2023/2024 Ganjil                      │
├─────────────────────────────────────────────────────────┤
│  CPL3: Mampu menerapkan pemikiran logis [▼ Expand]      │
│  Nilai: 82.5 | Status: 🟢 Tercapai                      │
│                                                         │
│  📗 Pemrograman Web (INF101) - 3 SKS                    │
│  ┌────────────┬───────┬──────────────┬─────────────┐    │
│  │ CPMK       │ Bobot │ Nilai        │ Kontribusi  │    │
│  ├────────────┼───────┼──────────────┼─────────────┤    │
│  │ CPMK1-1    │ 20%   │ 85 → 17.0   │ 2.5% → CPL  │     │
│  │ CPMK1-2    │ 30%   │ 90 → 27.0   │ 3.75% → CPL │     │
│  │ CPMK1-3    │ 25%   │ 78 → 19.5   │ 3.13% → CPL │     │
│  │ CPMK1-4    │ 25%   │ 82 → 20.5   │ 3.13% → CPL │     │
│  └────────────┴───────┴──────────────┴─────────────┘    │
│  Nilai MK: 84.0 | Kontribusi ke CPL3: 12.5%             │
└─────────────────────────────────────────────────────────┘
```

### Manajemen Data - Import Tab
```
┌─────────────────────────────────────────────────────────┐
│     Manajemen Data - Import Nilai                       │
├─────────────────────────────────────────────────────────┤
│   Prodi: [Informatika ▼]  Semester: [1 ▼]               │
│                                                         │
│     pload File Excel/CSV                                │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Drag & drop file atau klik untuk pilih         │    │
│  │  Format: .xlsx, .csv | Max: 5MB                 │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│    Preview Data (10 rows)                               │
│  ┌────────┬─────────────┬───────┬───────┬───────┐       │
│  │ NIM    │ Nama        │ INF101│ INF102│ ...   │       │
│  ├────────┼─────────────┼───────┼───────┼───────┤       │
│  │ 105... │ Andi Miftah │ 85    │ 90    │ ...   │       │
│  │ 105... │ Annisya     │ 90    │ 85    │ ...   │       │
│  └────────┴─────────────┴───────┴───────┴───────┘       │
│                                                         │
│     [Import Data]  [📥 Download Template]               │
│                                                         │
│  ✓ Import berhasil: 10 data | 0 gagal                   │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend
- **Framework**: Next.js 14.2.33 (App Router)
- **UI Library**: React 19.0.0
- **Language**: TypeScript 5.x + JavaScript
- **Styling**: Tailwind CSS 3.3
- **Charts**: Recharts 2.10.x
- **Excel Parsing**: xlsx 0.18.5

### State & Data
- **State Management**: React Hooks (useState, useEffect, useCallback)
- **Data Storage**: localStorage (development) → PostgreSQL (production)
- **Data Integration**: Custom integration layer (`dataIntegration.ts`)

### Development Tools
- **Linter**: ESLint 9.x
- **Formatter**: Prettier (recommended)
- **Package Manager**: npm (recommended) / yarn / pnpm

---

## Quick Start

### Prerequisites

```bash
Node.js: 18+ or 20+
npm: 9+ (comes with Node.js)
```

### Installation

```bash
# 1. Clone repository
git clone https://github.com/Nur-Hidayat-FTI22E/CPL_Sign.git
cd CPL_Sign

# 2. Install dependencies
npm install

# 3. Run development server
npm run dev

# 4. Open browser
# Navigate to http://localhost:3000
```

### Menjalankan tanpa backend (data contoh)

Data contoh: kurikulum INF (semester 1–4) dan ARS (semester 1–2) dari `MK_CODES.md`, serta nilai dari
`Data-Example/*.csv`. Nilai CPL dihitung dengan rumus yang sama dengan backend Go
(`internal/service/cpl_service.go`). Data dan seluruh endpoint ada di `mock/api.mjs`, yang bisa dipakai
dengan dua cara:

| Cara | Pengaturan | Nilai yang diubah tersimpan di |
|---|---|---|
| Di peramban (bawaan branch ini, dipakai demo Vercel) | `.env`: `NEXT_PUBLIC_MOCK_API=1` | `localStorage` peramban masing-masing |
| Server HTTP `npm run mock` (port 8001) | `.env.local`: `NEXT_PUBLIC_MOCK_API=0` dan `NEXT_PUBLIC_API_URL=http://localhost:8001/api` | Memori server mock; hilang saat server dimatikan |

Untuk backend Go, isi `.env.local` dengan `NEXT_PUBLIC_MOCK_API=0`, `NEXT_PUBLIC_DEMO=0`, dan
`NEXT_PUBLIC_API_URL` alamat backend.

```bash
npm run dev   # mode peramban: cukup satu perintah, tanpa server lain
```

Masuk dengan `kaprodi` / `kaprodi123`. **Pengaturan → Atur ulang** mengembalikan data contoh di peramban
itu ke keadaan awal.

### Demo di Vercel

Branch `demo/vercel` bisa di-deploy ke Vercel apa adanya. Framework Next.js terdeteksi otomatis, dan
`.env` sudah menyalakan mode data contoh, jadi tidak perlu backend maupun variabel lingkungan tambahan.

```bash
npx vercel login          # sekali saja, setujui di browser
npx vercel deploy --prod  # pertama kali: jawab pertanyaan penyiapan, mis. nama proyek sim-cpl-demo
```

### Antarmuka

| Halaman | Isi |
|---|---|
| Ringkasan | Profil CPL mahasiswa per semester (jaring laba-laba + daftar CPL); pilih satu CPL untuk menelusuri MK dan CPMK penyumbangnya |
| Input Nilai | Nilai akhir satu MK untuk satu mahasiswa, dengan rincian poin per CPMK |
| Laporan | Per mahasiswa, per semester, per prodi; unduh PDF (dengan blok pengesahan) atau Excel |
| Data & Import | Impor Excel/CSV dengan pratinjau dan validasi per sel, daftar mahasiswa, kurikulum (MK → CPMK) |
| Pengaturan | Batas status tercapai/cukup (berlaku di semua halaman), tahun ajaran, nama penandatangan |

### Build for Production

```bash
# Build
npm run build

# Start production server
npm start

# Server runs on http://localhost:3000
```

---

## Struktur Project

```
kkp-plus-new/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── page.jsx             # Landing page
│   │   ├── (auth)/login/        # Login page
│   │   ├── dashboard/           # Dashboard + Tree diagram
│   │   ├── input-nilai/         # Manual input form
│   │   ├── laporan/             # Laporan dengan breakdown
│   │   ├── manajemen/           # 4 tabs: Import, Mahasiswa, MK, CPL
│   │   ├── cpl-mapping/         # CPL mapping matrix
│   │   ├── penilaian/           # Penilaian module
│   │   └── pengumuman/          # Announcement
│   │
│   ├── components/               # Reusable components
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── RadarCPL.jsx
│   │   ├── CpmkBreakdownDisplay.jsx
│   │   └── ...
│   │
│   ├── data/                     # Data layer
│   │   ├── mock.js              # Informatika data
│   │   ├── mock-arsitektur.js   # Arsitektur data
│   │   └── kurikulumArsitektur.js
│   │
│   └── utils/                    # Utilities
│       ├── dataIntegration.ts   # Core integration
│       └── gradeCalculator.js
│
├── public/                       # Static assets
├── contoh-import-*.xlsx         # Example files
├── QUICK_START.md               # Quick guide
├── TECHNICAL_DOC.md             # Technical docs
├── PANDUAN-IMPORT-NILAI.md      # Import guide
├── package.json
└── README.md                    # This file
```

**Key Files:**
- `src/utils/dataIntegration.ts`: Core logic untuk merge data & kalkulasi CPL
- `src/app/dashboard/manajemen/page.tsx`: 4-tab management system
- `src/app/dashboard/laporan/page.tsx`: Laporan dengan CPMK breakdown
- `src/data/mock.js`: Static data Informatika (69 MK, 8 CPL)

---

## Dokumentasi

### Dokumentasi Lengkap

| Dokumen | Deskripsi | Link |
|---------|-----------|------|
| **QUICK_START.md** | Panduan cepat untuk pengguna | [Buka](./QUICK_START.md) |
| **TECHNICAL_DOC.md** | Dokumentasi teknis untuk developer | [Buka](./TECHNICAL_DOC.md) |
| **PANDUAN-IMPORT-NILAI.md** | Cara import nilai dari Excel/CSV | [Buka](./PANDUAN-IMPORT-NILAI.md) |
| **MK_CODES.md** | Daftar kode mata kuliah semua prodi | [Akan dibuat] |

### Panduan Penggunaan

1. **Login**: Gunakan akun kaprodi sesuai prodi
2. **Dashboard**: Lihat overview CPL dengan tree diagram
3. **Input Nilai**: Input manual atau import batch dari Excel
4. **Laporan**: Generate laporan dengan breakdown detail CPMK
5. **Manajemen**: Monitor data mahasiswa, MK, dan CPL

### Cara Kerja Sistem

**Alur Kalkulasi CPL:**
```
Input Nilai MK (per CPMK)
    ↓
Nilai MK = Σ (Nilai CPMK × Bobot CPMK)
    ↓
Nilai CPL = Σ (Nilai CPMK × Bobot MK × Bobot CPMK) / Σ (Bobot MK × Bobot CPMK)
    ↓
Status: Tercapai (≥75) | Cukup (60-74) | Belum (<60)
```

**Contoh Perhitungan:**
```
CPL3: Mampu menerapkan pemikiran logis
├── MK: Pemrograman Web (Bobot: 12.5% dari 8 MK)
│   ├── CPMK1-1 (20%): Nilai 85 → Kontribusi: 85 × 0.125 × 0.20 = 2.125
│   ├── CPMK1-2 (30%): Nilai 90 → Kontribusi: 90 × 0.125 × 0.30 = 3.375
│   └── ...
└── Nilai CPL3 = Σ Kontribusi / Σ Bobot
```

---

## Akun Demo

Sistem menyediakan 5 akun demo untuk testing:

### Kaprodi (5 Program Studi)

| Program Studi | Email | Password | Kode |
|--------------|-------|----------|------|
| **Teknik Informatika** | kaprodi.informatika@unismuh.ac.id | kaprodi123 | INF |
| **Arsitektur** | kaprodi.arsitektur@unismuh.ac.id | kaprodi123 | ARS |
| **Perencanaan Wilayah Kota** | kaprodi.pwk@unismuh.ac.id | kaprodi123 | PWK |
| **Teknik Sipil** | kaprodi.sipil@unismuh.ac.id | kaprodi123 | SIP |
| **Teknik Elektro** | kaprodi.elektro@unismuh.ac.id | kaprodi123 | ELK |

**Cara Login:**
1. Buka http://localhost:3000/login
2. Pilih role dari dropdown
3. Klik **"Quick Login"** atau input manual
4. Redirect ke dashboard prodi

---

## Dependencies

### Production Dependencies

```json
{
  "next": "14.2.33",
  "react": "19.0.0",
  "react-dom": "19.0.0",
  "recharts": "^2.10.0",
  "xlsx": "^0.18.5"
}
```

### Development Dependencies

```json
{
  "@eslint/eslintrc": "^3.2.0",
  "eslint": "^9.17.0",
  "postcss": "^8.4.49",
  "tailwindcss": "^3.3.0"
}
```

---

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Docker

```bash
# Build image
docker build -t cpl-system .

# Run container
docker run -p 3000:3000 cpl-system
```

### Environment Variables

```env
# .env.local (development)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# .env.production
NEXT_PUBLIC_APP_URL=https://cpl.unismuh.ac.id
DATABASE_URL=postgresql://user:pass@host:5432/cpl
JWT_SECRET=your-secret-key
```

---

## Testing

```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

---

## Kontribusi

Kami menyambut kontribusi dari komunitas! Berikut cara berkontribusi:

### Workflow Git

```bash
# 1. Fork repository
# 2. Clone fork Anda
git clone https://github.com/YOUR_USERNAME/CPL_Sign.git

# 3. Buat branch baru
git checkout -b feature/nama-fitur

# 4. Commit changes
git commit -m "feat: tambah fitur X"

# 5. Push ke fork
git push origin feature/nama-fitur

# 6. Buat Pull Request ke branch FR_branch
```

### Commit Convention

Gunakan [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: menambah fitur baru
fix: memperbaiki bug
docs: update dokumentasi
style: formatting, missing semicolons, etc
refactor: refactoring code
test: menambah test
chore: update build tasks, package manager configs, etc
```

### Coding Standards

- **TypeScript**: Gunakan type-safe code
- **ESLint**: Follow linting rules
- **Prettier**: Format code sebelum commit
- **Comments**: Tulis komentar untuk logic kompleks
- **Tests**: Tambahkan tests untuk fitur baru

---

## Lisensi

Sistem ini dikembangkan untuk **Universitas Muhammadiyah Makassar** dan dilisensikan di bawah [MIT License](LICENSE).

```
MIT License

Copyright (c) 2025 Universitas Muhammadiyah Makassar

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

## Tim Pengembang

**Developer**: [hacklab](https://github.com/COCONUT-hacklab) 
**Organization**: COCONUT Computer Club 

---

## Acknowledgments

Terima kasih kepada:
- **Universitas Muhammadiyah Makassar** - Dukungan dan fasilitas
- **Fakultas Teknik** - Guidance dan requirements
- **Next.js Team** - Amazing framework
- **Recharts** - Beautiful charts library
- **SheetJS** - Excel parsing made easy
- **Open Source Community** - Inspirasi dan tools

---

## Kontak & Support

- **Email**: [contact@unismuh.ac.id]
- **Website**: [https://unismuh.ac.id](https://unismuh.ac.id)
- **GitHub Issues**: [Report Bug](https://github.com/COCONUT-hacklab/SIM-CPL/issues)
- **GitHub Discussions**: [Ask Question](https://github.com/COCONUT-hacklab/SIM-CPL/discussions)

---

## Star History

Jika sistem ini bermanfaat, berikan ⭐ di GitHub!

---

<div align="center">

**Sistem CPL** adalah bagian dari transformasi digital pendidikan tinggi di Indonesia.

Crafted with ❤️ by [hacklab](https://coconut.or.id/) 

**© 2025 Universitas Muhammadiyah Makassar**

[Website](https://unismuh.ac.id) • [Documentation](./QUICK_START.md) • [GitHub](https://github.com/COCONUT-hacklab/SIM-CPL)

</div>
