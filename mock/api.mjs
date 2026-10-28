// ============================================================================
// SIM-CPL — mock API (data contoh) untuk menjalankan frontend tanpa backend Go.
//
// Sumber data: MK_CODES.md (kurikulum INF & ARS) dan Data-Example/*.csv
// (nilai contoh mahasiswa). Nilai CPL dihitung dengan rumus yang sama dengan
// dokumentasi repo:
//   Nilai CPL = Σ(nilai CPMK × bobot MK × bobot CPMK) / Σ(bobot MK × bobot CPMK)
//   bobot MK  = 1 / jumlah MK yang menyumbang CPL tersebut pada semester itu
//
// Modul ini tidak bergantung pada Node maupun peramban. Dipakai oleh:
//   - mock-server.cjs        → `npm run mock`, http://localhost:8001/api
//   - src/lib/mockFetch.ts   → NEXT_PUBLIC_MOCK_API=1, dijalankan di peramban (demo Vercel)
// ============================================================================

/* ── utilitas deterministik ─────────────────────────────────────────────── */
function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
const noise = (key, range) => (hash(key) % (2 * range + 1)) - range;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const round1 = (v) => Math.round(v * 10) / 10;

/* ── master data ────────────────────────────────────────────────────────── */
const PRODI = [
  { id_prodi: 1, kode_prodi: "INF", nama_prodi: "S1 Teknik Informatika" },
  { id_prodi: 2, kode_prodi: "ARS", nama_prodi: "S1 Arsitektur" },
  { id_prodi: 3, kode_prodi: "PWK", nama_prodi: "S1 Perencanaan Wilayah dan Kota" },
  { id_prodi: 4, kode_prodi: "SIP", nama_prodi: "S1 Teknik Sipil" },
  { id_prodi: 5, kode_prodi: "ELK", nama_prodi: "S1 Teknik Elektro" },
];

// "CPL Standard untuk Semua Prodi" — MK_CODES.md §6.
const CPL_BASE = [
  ["CPL1", "Bertakwa, beretika, dan bertanggung jawab."],
  ["CPL2", "Menguasai konsep teoretis bidang ilmu."],
  ["CPL3", "Mampu menerapkan pemikiran logis dan analitis."],
  ["CPL4", "Menguasai teknologi dan perangkat kerja bidang."],
  ["CPL5", "Mampu merancang dan mengimplementasikan solusi."],
  ["CPL6", "Menguasai kemampuan teknis spesifik program studi."],
  ["CPL7", "Mampu mengelola pekerjaan dan berwirausaha."],
  ["CPL8", "Mampu berkomunikasi efektif dan bekerja sama dalam tim."],
];
const cplOf = (idProdi) =>
  CPL_BASE.map(([kode, deskripsi], i) => ({ id_cpl: idProdi * 100 + i + 1, kode_cpl: kode, deskripsi }));

// [kode, nama, sks, semester, [CPL terkait]] — MK_CODES.md.
const MK_ROWS = {
  1: [
    ["INF101", "Pancasila", 2, 1, ["CPL1"]],
    ["INF102", "Bahasa Indonesia", 2, 1, ["CPL1"]],
    ["INF103", "Pendidikan Agama Islam", 2, 1, ["CPL1"]],
    ["INF104", "Pengantar Teknologi Informasi", 3, 1, ["CPL2"]],
    ["INF105", "Matematika Dasar", 3, 1, ["CPL2"]],
    ["INF106", "Algoritma dan Pemrograman", 3, 1, ["CPL3", "CPL5"]],
    ["INF107", "Sistem Digital", 2, 1, ["CPL4", "CPL5"]],
    ["INF108", "Bahasa Inggris I", 2, 1, ["CPL8"]],
    ["INF201", "Kewarganegaraan", 2, 2, ["CPL1"]],
    ["INF202", "Kewirausahaan", 2, 2, ["CPL7"]],
    ["INF203", "Sistem Operasi", 3, 2, ["CPL4", "CPL5"]],
    ["INF204", "Matematika Diskrit", 3, 2, ["CPL2", "CPL3"]],
    ["INF205", "Struktur Data", 3, 2, ["CPL3", "CPL5"]],
    ["INF206", "Organisasi dan Arsitektur Komputer", 3, 2, ["CPL4"]],
    ["INF207", "Pemrograman Web", 3, 2, ["CPL6"]],
    ["INF208", "Bahasa Inggris II", 2, 2, ["CPL8"]],
    ["INF301", "Basis Data", 3, 3, ["CPL4", "CPL6"]],
    ["INF302", "Pemrograman Berorientasi Objek", 3, 3, ["CPL3", "CPL5"]],
    ["INF303", "Jaringan Komputer", 3, 3, ["CPL4", "CPL5"]],
    ["INF304", "Statistika dan Probabilitas", 3, 3, ["CPL2", "CPL3"]],
    ["INF305", "Interaksi Manusia dan Komputer", 2, 3, ["CPL6", "CPL8"]],
    ["INF306", "Rekayasa Perangkat Lunak", 3, 3, ["CPL3", "CPL7"]],
    ["INF307", "Analisis dan Desain Algoritma", 3, 3, ["CPL3", "CPL5"]],
    ["INF401", "Pemrograman Mobile", 3, 4, ["CPL6"]],
    ["INF402", "Sistem Manajemen Basis Data", 3, 4, ["CPL4", "CPL6"]],
    ["INF403", "Kecerdasan Buatan", 3, 4, ["CPL3", "CPL5"]],
    ["INF404", "Grafika Komputer", 3, 4, ["CPL6"]],
    ["INF405", "Keamanan Informasi", 2, 4, ["CPL4", "CPL7"]],
    ["INF406", "Metode Penelitian", 2, 4, ["CPL8"]],
    ["INF407", "Etika Profesi", 2, 4, ["CPL1", "CPL8"]],
  ],
  2: [
    ["ARS101", "Pancasila", 2, 1, ["CPL1"]],
    ["ARS102", "Bahasa Indonesia", 2, 1, ["CPL5", "CPL8"]],
    ["ARS103", "Pendidikan Agama Islam", 2, 1, ["CPL1"]],
    ["ARS104", "Pengantar Arsitektur", 3, 1, ["CPL2", "CPL3"]],
    ["ARS105", "Gambar Teknik", 3, 1, ["CPL3", "CPL4"]],
    ["ARS106", "Matematika Teknik", 3, 1, ["CPL2"]],
    ["ARS107", "Fisika Bangunan", 2, 1, ["CPL2", "CPL4"]],
    ["ARS108", "Estetika Bentuk", 3, 1, ["CPL3", "CPL5"]],
    ["ARS201", "Kewarganegaraan", 2, 2, ["CPL1"]],
    ["ARS202", "Sejarah Arsitektur", 2, 2, ["CPL2", "CPL5"]],
    ["ARS203", "Studio Perancangan Arsitektur I", 4, 2, ["CPL3", "CPL4", "CPL5"]],
    ["ARS204", "Struktur dan Konstruksi I", 3, 2, ["CPL4", "CPL6"]],
    ["ARS205", "Utilitas Bangunan", 2, 2, ["CPL4", "CPL6"]],
    ["ARS206", "Metode Perancangan", 2, 2, ["CPL3", "CPL5"]],
    ["ARS207", "Pengetahuan Bahan Bangunan", 2, 2, ["CPL4", "CPL6"]],
    ["ARS208", "Bahasa Inggris", 2, 2, ["CPL8"]],
    ["ARS209", "Komputer Arsitektur I", 2, 2, ["CPL7"]],
  ],
};

// CPMK yang terdokumentasi di MK_CODES.md dipakai apa adanya.
const CPMK_EXPLICIT = {
  INF207: [
    ["Memahami konsep dasar web", 0.25, "CPL6"],
    ["Menguasai HTML dan CSS", 0.2, "CPL6"],
    ["Mengimplementasikan JavaScript", 0.25, "CPL6"],
    ["Menggunakan framework web modern", 0.2, "CPL6"],
    ["Melakukan deployment aplikasi web", 0.1, "CPL6"],
  ],
  ARS203: [
    ["Menganalisis site perancangan", 0.25, "CPL3"],
    ["Merumuskan konsep desain", 0.25, "CPL5"],
    ["Mengembangkan desain", 0.2, "CPL4"],
    ["Mempresentasikan rancangan", 0.2, "CPL8"],
    ["Menyusun portofolio perancangan", 0.1, "CPL5"],
  ],
};

const TEMPLATE = {
  CPL1: ["Menunjukkan sikap bertanggung jawab dalam pembelajaran {t}", "Menjelaskan nilai etika yang terkandung dalam {t}"],
  CPL2: ["Menjelaskan konsep dasar {t}", "Menerapkan prinsip {t} pada soal terstruktur"],
  CPL3: ["Menganalisis persoalan {t} secara logis dan sistematis", "Mengevaluasi alternatif penyelesaian dalam {t}"],
  CPL4: ["Menggunakan perangkat dan teknologi {t}", "Mengonfigurasi lingkungan kerja {t}"],
  CPL5: ["Merancang solusi berbasis {t}", "Mengimplementasikan rancangan {t}"],
  CPL6: ["Membangun artefak {t} sesuai spesifikasi", "Menguji dan menyempurnakan artefak {t}"],
  CPL7: ["Menyusun rencana kerja {t}", "Mengelola sumber daya dalam proyek {t}"],
  CPL8: ["Menyajikan hasil kerja {t} secara lisan dan tertulis", "Bekerja sama dalam tim pada tugas {t}"],
};
const PROPER = new Set(["Pancasila", "Indonesia", "Islam", "Inggris", "I", "II", "Web"]);
const topic = (nama) => nama.split(" ").map((w) => (PROPER.has(w) ? w : w.toLowerCase())).join(" ");

function buildCPMK(mk) {
  const explicit = CPMK_EXPLICIT[mk.kode_mk];
  const rows = explicit
    ? explicit
    : (() => {
        const n = mk.sks >= 3 ? 3 : 2;
        const weights = n === 3 ? [0.3, 0.4, 0.3] : [0.5, 0.5];
        return weights.map((w, i) => {
          const cpl = mk.cplBase[i % mk.cplBase.length];
          const tpl = TEMPLATE[cpl][Math.floor(i / mk.cplBase.length) % 2];
          return [tpl.replace("{t}", topic(mk.nama_mk)), w, cpl];
        });
      })();
  return rows.map(([deskripsi, bobot, cpl], i) => {
    const kode = `CPMK-${mk.kode_mk}-${i + 1}`;
    return {
      id: `${mk.id_mk}-c${i + 1}`,
      kode_cpmk: kode,
      deskripsi,
      bobot,
      cpl,
      sub: [
        { kode_sub_cpmk: `${kode}.1`, deskripsi: `${deskripsi} pada latihan terbimbing` },
        { kode_sub_cpmk: `${kode}.2`, deskripsi: `${deskripsi} pada tugas mandiri` },
      ],
    };
  });
}

const MK = [];
for (const [idProdi, rows] of Object.entries(MK_ROWS)) {
  for (const [kode, nama, sks, semester, cplBase] of rows) {
    const mk = { id_mk: `mk-${kode.toLowerCase()}`, id_prodi: Number(idProdi), kode_mk: kode, nama_mk: nama, sks, semester, cplBase };
    mk.cpmk = buildCPMK(mk);
    mk.cpl_terkait = [...new Set(mk.cpmk.map((c) => c.cpl))].sort();
    MK.push(mk);
  }
}

/* ── mahasiswa & nilai contoh ───────────────────────────────────────────── */
// [nim, nama, nilai per kode MK] — Data-Example/contoh-import-*.csv
const CSV = {
  1: {
    1: "INF101,INF102,INF103,INF104,INF105,INF106,INF107,INF108",
    2: "INF201,INF202,INF203,INF204,INF205,INF206,INF207",
    rows: [
      ["2024001", "Ahmad Fauzi", "85,88,90,82,85,87,80,84", "86,90,88,84,82,85,89"],
      ["2024002", "Siti Aisyah", "92,89,95,88,92,90,85,91", "93,95,92,90,88,91,94"],
      ["2024003", "Budi Santoso", "78,82,85,75,80,83,78,80", "79,82,80,78,75,80,81"],
      ["2024004", "Citra Dewi", "88,90,92,85,89,88,82,87", "89,91,90,87,85,88,90"],
      ["2024005", "Dedi Prasetyo", "75,78,80,72,76,79,74,77", "76,80,78,75,73,77,79"],
      ["2024006", "Eka Putri", "90,92,94,88,91,89,86,90", "91,94,93,89,87,90,92"],
      ["2024007", "Fahri Rahman", "82,85,88,80,84,86,79,83", "83,87,85,82,80,84,86"],
      ["2024008", "Gita Sari", "86,88,90,83,87,85,81,86", "87,90,88,85,83,86,89"],
      ["2024009", "Hendra Wijaya", "79,81,84,77,80,82,76,80", "80,84,82,79,77,81,83"],
      ["2024010", "Indah Permata", "93,95,97,90,94,92,88,94", "94,97,95,92,90,93,96"],
    ],
  },
  2: {
    2: "ARS201,ARS202,ARS203,ARS204,ARS205,ARS206,ARS207,ARS208,ARS209",
    rows: [
      ["2023001", "Budi Hartono", null, "85,88,82,80,87,84,86,83,85"],
      ["2023002", "Citra Maharani", null, "90,92,88,85,91,89,90,87,89"],
      ["2023003", "Dedi Sutrisno", null, "78,80,75,77,79,76,78,74,77"],
      ["2023004", "Eka Wulandari", null, "88,90,86,84,89,87,88,85,87"],
      ["2023005", "Fajar Nugroho", null, "82,85,80,78,83,81,82,79,81"],
      ["2023006", "Gina Puspita", null, "92,94,90,88,93,91,92,89,91"],
      ["2023007", "Hadi Wijaya", null, "80,82,78,76,81,79,80,77,79"],
      ["2023008", "Ika Suryani", null, "86,89,84,82,87,85,86,83,85"],
      ["2023009", "Joko Prasetyo", null, "79,81,77,75,80,78,79,76,78"],
      ["2023010", "Kartika Sari", null, "94,96,92,90,95,93,94,91,93"],
    ],
  },
};

// Pergeseran kemampuan di semester lanjut (dibuat agar status Cukup/Belum ikut muncul).
const DRIFT = { "2024003": -9, "2024005": -26, "2024009": -15, "2023103": -32 };
const EXTRA_INF = [
  ["2023101", "Nurul Fadilah", 84],
  ["2023102", "Rizky Ramadhan", 74],
  ["2023103", "Muh. Ikhsan", 80],
];

const MAHASISWA = []; // { id_mhs, nim, nama, angkatan, id_prodi }
const BASE = new Map(); // `${nim}|${id_mk}` → nilai MK dasar
const OVERRIDE = new Map(); // `${nim}|${id_mk}` → nilai hasil import/input

function angkatanFromNim(nim) {
  const y = Number(String(nim).slice(0, 4));
  return y >= 2000 && y <= 2100 ? y : new Date().getFullYear();
}

function seed() {
  for (const [idProdiStr, data] of Object.entries(CSV)) {
    const idProdi = Number(idProdiStr);
    for (const [nim, nama, s1, s2] of data.rows) {
      MAHASISWA.push({ id_mhs: nim, nim, nama, angkatan: angkatanFromNim(nim), id_prodi: idProdi });
      const vals = [];
      [[1, s1], [2, s2]].forEach(([sem, csv]) => {
        if (!csv || !data[sem]) return;
        const kodes = data[sem].split(",");
        csv.split(",").forEach((v, i) => {
          const mk = MK.find((m) => m.kode_mk === kodes[i]);
          if (mk) {
            BASE.set(`${nim}|${mk.id_mk}`, Number(v));
            vals.push(Number(v));
          }
        });
      });
      const ability = vals.reduce((a, b) => a + b, 0) / vals.length;
      // Semester lain yang tidak ada di CSV: dibangkitkan dari kemampuan rata-rata.
      for (const mk of MK.filter((m) => m.id_prodi === idProdi)) {
        const key = `${nim}|${mk.id_mk}`;
        if (BASE.has(key)) continue;
        if (idProdi === 2 && mk.semester > 2) continue;
        const drift = mk.semester >= 3 ? DRIFT[nim] || noise(`${nim}drift`, 3) : 0;
        BASE.set(key, clamp(Math.round(ability + drift + noise(key, 6)), 30, 98));
      }
    }
  }
  for (const [nim, nama, ability] of EXTRA_INF) {
    MAHASISWA.push({ id_mhs: nim, nim, nama, angkatan: angkatanFromNim(nim), id_prodi: 1 });
    for (const mk of MK.filter((m) => m.id_prodi === 1)) {
      const key = `${nim}|${mk.id_mk}`;
      const drift = mk.semester >= 3 ? DRIFT[nim] || 0 : 0;
      BASE.set(key, clamp(Math.round(ability + drift + noise(key, 7)), 30, 98));
    }
  }
}
seed();

/* ── perhitungan (mengikuti backend Go: cpl_service.go & handler_mahasiswa.go) ──
 * - Nilai CPMK = nilai MK (backend memakai nilai MK untuk setiap CPMK).
 * - Nilai CPL per semester = Σ(nilai MK × bobot CPL–MK) / Σ(bobot CPL–MK),
 *   bobot CPL–MK = 1/N (sama untuk semua MK pada CPL yang sama) → rerata nilai
 *   MK penyumbang yang diambil mahasiswa pada semester tersebut.
 */
function mkGrade(nim, mk) {
  const key = `${nim}|${mk.id_mk}`;
  if (OVERRIDE.has(key)) return OVERRIDE.get(key);
  return BASE.has(key) ? BASE.get(key) : null;
}
const mkOfProdi = (idProdi, semester) =>
  MK.filter((m) => m.id_prodi === idProdi && (!semester || m.semester === semester));
const contributesTo = (mk, kodeCpl) => mk.cpmk.some((c) => c.cpl === kodeCpl);

// Nilai satu CPL untuk satu mahasiswa pada satu semester (null jika belum ada data).
function cplValue(nim, idProdi, kodeCpl, semester) {
  const grades = mkOfProdi(idProdi, semester)
    .filter((m) => contributesTo(m, kodeCpl))
    .map((m) => mkGrade(nim, m))
    .filter((v) => v !== null);
  return grades.length ? round1(grades.reduce((a, b) => a + b, 0) / grades.length) : null;
}
function cplCumulative(nim, idProdi, kodeCpl) {
  const vals = [1, 2, 3, 4, 5, 6, 7, 8].map((s) => cplValue(nim, idProdi, kodeCpl, s)).filter((v) => v !== null);
  return vals.length ? round1(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
}

/* ── bentuk respons ─────────────────────────────────────────────────────── */
const mkPublic = (mk) => ({
  id_mk: mk.id_mk,
  id_prodi: mk.id_prodi,
  kode_mk: mk.kode_mk,
  nama_mk: mk.nama_mk,
  sks: mk.sks,
  semester: mk.semester,
  cpl_terkait: mk.cpl_terkait,
});

function mahasiswaSummary(m, semester) {
  const graded = mkOfProdi(m.id_prodi, semester).filter((mk) => mkGrade(m.nim, mk) !== null);
  const values = graded.map((mk) => mkGrade(m.nim, mk));
  const allGraded = mkOfProdi(m.id_prodi).filter((mk) => mkGrade(m.nim, mk) !== null);
  return {
    id_mhs: m.id_mhs,
    nim: m.nim,
    nama: m.nama,
    angkatan: m.angkatan,
    // field backend (listMahasiswaDenganNilaiHandler)
    jumlah_mk: graded.length,
    rata_nilai: values.length ? round1(values.reduce((a, b) => a + b, 0) / values.length) : 0,
    // field tambahan yang dibaca frontend lama
    status: "AKTIF",
    semester_max: allGraded.reduce((mx, mk) => Math.max(mx, mk.semester), 0),
    total_nilai: allGraded.length,
    dari_import: allGraded.filter((mk) => OVERRIDE.has(`${m.nim}|${mk.id_mk}`)).length,
  };
}

function cplMapping(idProdi, semester) {
  return cplOf(idProdi).map((cpl) => ({
    id_cpl: cpl.id_cpl,
    kode_cpl: cpl.kode_cpl,
    deskripsi: cpl.deskripsi,
    mk_list: mkOfProdi(idProdi, semester)
      .filter((mk) => contributesTo(mk, cpl.kode_cpl))
      .map((mk) => {
        const relevant = mk.cpmk.filter((c) => c.cpl === cpl.kode_cpl).map((c) => c.kode_cpmk);
        return { ...mkPublic(mk), cpmk_count: relevant.length, relasi: relevant.join(", ") };
      }),
  }));
}

function cplStats(idProdi, semester) {
  const students = MAHASISWA.filter((m) => m.id_prodi === idProdi);
  return cplOf(idProdi).map((cpl) => {
    const vals = students
      .map((m) => (semester ? cplValue(m.nim, idProdi, cpl.kode_cpl, semester) : cplCumulative(m.nim, idProdi, cpl.kode_cpl)))
      .filter((v) => v !== null);
    const n = vals.length;
    return {
      id_cpl: cpl.id_cpl,
      kode_cpl: cpl.kode_cpl,
      deskripsi: cpl.deskripsi,
      jumlah_mahasiswa: n,
      rata_nilai: n ? round1(vals.reduce((a, b) => a + b, 0) / n) : 0,
      min_nilai: n ? Math.min(...vals) : 0,
      max_nilai: n ? Math.max(...vals) : 0,
      kategori_tinggi: vals.filter((v) => v >= 70).length,
      kategori_sedang: vals.filter((v) => v >= 50 && v < 70).length,
      kategori_rendah: vals.filter((v) => v < 50).length,
    };
  });
}

function prodiStats(idProdi) {
  const students = MAHASISWA.filter((m) => m.id_prodi === idProdi);
  const byAngkatan = {};
  students.forEach((m) => (byAngkatan[m.angkatan] = (byAngkatan[m.angkatan] || 0) + 1));
  const totalNilai = students.reduce((sum, m) => sum + mahasiswaSummary(m).total_nilai, 0);
  return {
    prodi: PRODI.find((p) => p.id_prodi === idProdi),
    total_mahasiswa: students.length,
    total_mk: mkOfProdi(idProdi).length,
    total_cpl: cplOf(idProdi).length,
    total_nilai_mk: totalNilai,
    distribusi_angkatan: Object.entries(byAngkatan)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([angkatan, jumlah]) => ({ angkatan: Number(angkatan), jumlah })),
    distribusi_status: students.length ? [{ status: "AKTIF", jumlah: students.length }] : [],
  };
}

function importNilai(body) {
  const prodi = PRODI.find((p) => p.kode_prodi === body.prodiKode);
  if (!prodi) return [404, { error: `prodi ${body.prodiKode} tidak ditemukan` }];
  const semester = Number(body.semester) || 1;
  let mkBaru = 0, mhsBaru = 0, inserted = 0, updated = 0, dilewati = 0;

  for (const item of body.matkulList || []) {
    const kode = String(item.kode || "").trim().toUpperCase();
    if (!kode || MK.some((m) => m.id_prodi === prodi.id_prodi && m.kode_mk === kode)) continue;
    const mk = { id_mk: `mk-${kode.toLowerCase()}`, id_prodi: prodi.id_prodi, kode_mk: kode, nama_mk: item.nama || kode, sks: Number(item.sks) || 2, semester, cplBase: ["CPL2"] };
    mk.cpmk = buildCPMK(mk);
    mk.cpl_terkait = [...new Set(mk.cpmk.map((c) => c.cpl))];
    MK.push(mk);
    mkBaru++;
  }

  for (const row of body.importData || []) {
    const nim = String(row.nim || "").trim();
    if (!nim) continue;
    if (!MAHASISWA.some((m) => m.nim === nim)) {
      MAHASISWA.push({ id_mhs: nim, nim, nama: row.nama || `Mahasiswa ${nim}`, angkatan: angkatanFromNim(nim), id_prodi: prodi.id_prodi });
      mhsBaru++;
    }
    for (const [kode, nilai] of Object.entries(row.nilaiMap || {})) {
      const mk = MK.find((m) => m.id_prodi === prodi.id_prodi && m.kode_mk.toLowerCase() === kode.toLowerCase());
      const v = Number(nilai);
      if (!mk || !Number.isFinite(v) || v < 0 || v > 100) {
        dilewati++;
        continue;
      }
      const key = `${nim}|${mk.id_mk}`;
      if (BASE.has(key) || OVERRIDE.has(key)) updated++;
      else inserted++;
      OVERRIDE.set(key, round1(v));
    }
  }
  return [200, { prodi: prodi.kode_prodi, semester, tahun_ajaran: body.tahunAjaran || "", mk_baru: mkBaru, mhs_baru: mhsBaru, nilai_inserted: inserted, nilai_updated: updated, nilai_dilewati: dilewati }];
}

/* ── router ─────────────────────────────────────────────────────────────── */
export const ROUTES = [
  "GET  /api/prodi",
  "GET  /api/prodi/:id/mk?semester=",
  "GET  /api/prodi/:id/cpl",
  "GET  /api/prodi/:id/cpl-mapping?semester=",
  "GET  /api/prodi/:id/cpl-stats?semester=",
  "GET  /api/prodi/:id/stats",
  "GET  /api/prodi/:id/mahasiswa-nilai",
  "POST /api/prodi/:id/recalc-bobot",
  "GET  /api/mk/:id/cpmk",
  "GET  /api/mahasiswa/:nim/cpl?semester=",
  "GET  /api/mahasiswa/:nim/nilai-mk",
  "GET  /api/mahasiswa/:nim/mk/:id/analisis",
  "POST /api/nilai-mk/import",
];

const reply = (status, data) => ({ status, data });

/**
 * Menjawab satu permintaan API.
 * @param {string} method
 * @param {string} url  absolut atau relatif, mis. "/api/prodi/1/mk?semester=2"
 * @param {unknown} [body]  JSON yang sudah di-parse; null bila body tidak valid
 * @returns {{ status: number, data: unknown }}
 */
export function handle(method, url, body) {
  const u = new URL(url, "http://mock.local");
  const p = u.pathname.replace(/\/+$/, "");
  const semParam = Number(u.searchParams.get("semester")) || undefined;
  let m;

  if (p === "/api" || p === "") return reply(200, { name: "SIM-CPL mock API", data: "contoh (MK_CODES.md + Data-Example)", routes: ROUTES });
  if (p === "/api/prodi") return reply(200, PRODI);

  if ((m = p.match(/^\/api\/prodi\/(\d+)\/(mk|cpl|cpl-mapping|cpl-stats|stats|mahasiswa-nilai|recalc-bobot)$/))) {
    const idProdi = Number(m[1]);
    if (!PRODI.some((x) => x.id_prodi === idProdi)) return reply(404, { error: "prodi tidak ditemukan" });
    switch (m[2]) {
      case "mk": return reply(200, mkOfProdi(idProdi, semParam).map(mkPublic));
      case "cpl": return reply(200, cplOf(idProdi));
      case "cpl-mapping": return reply(200, cplMapping(idProdi, semParam));
      case "cpl-stats": return reply(200, cplStats(idProdi, semParam));
      case "stats": return reply(200, prodiStats(idProdi));
      case "mahasiswa-nilai": {
        // Backend memfilter mahasiswa yang punya nilai pada semester yang diminta.
        const list = MAHASISWA.filter((x) => x.id_prodi === idProdi).map((x) => mahasiswaSummary(x, semParam));
        return reply(200, semParam ? list.filter((x) => x.jumlah_mk > 0) : list);
      }
      case "recalc-bobot": return reply(200, { status: "ok", message: "bobot dihitung ulang" });
    }
  }

  if ((m = p.match(/^\/api\/mk\/([\w-]+)\/cpmk$/))) {
    const mk = MK.find((x) => x.id_mk === m[1]);
    if (!mk) return reply(200, []);
    return reply(200, mk.cpmk.map((c) => ({ id: c.id, id_cpmk: c.id, id_mk: mk.id_mk, kode_cpmk: c.kode_cpmk, deskripsi: c.deskripsi, bobot: c.bobot, bobot_cpmk: c.bobot, cpl: c.cpl })));
  }

  if ((m = p.match(/^\/api\/mahasiswa\/([\w.-]+)\/(cpl|nilai-mk)$/))) {
    const mhs = MAHASISWA.find((x) => x.nim === m[1]);
    if (!mhs) return reply(404, { error: "mahasiswa tidak ditemukan" });
    if (m[2] === "nilai-mk") {
      return reply(200, mkOfProdi(mhs.id_prodi)
        .map((mk) => ({ ...mkPublic(mk), nilai_angka: mkGrade(mhs.nim, mk), sumber: OVERRIDE.has(`${mhs.nim}|${mk.id_mk}`) ? "import" : "contoh" }))
        .filter((x) => x.nilai_angka !== null));
    }
    const semester = semParam || 1;
    const cpl = cplOf(mhs.id_prodi)
      .map((c) => ({ ...c, nilai_angka: cplValue(mhs.nim, mhs.id_prodi, c.kode_cpl, semester), semester_eval: semester }))
      .filter((c) => c.nilai_angka !== null);
    return reply(200, { nim: mhs.nim, nama: mhs.nama, semester, cpl });
  }

  if ((m = p.match(/^\/api\/mahasiswa\/([\w.-]+)\/mk\/([\w-]+)\/analisis$/))) {
    const mhs = MAHASISWA.find((x) => x.nim === m[1]);
    const mk = MK.find((x) => x.id_mk === m[2]);
    if (!mhs) return reply(404, { error: "mahasiswa tidak ditemukan" });
    if (!mk) return reply(404, { error: "mata kuliah tidak ditemukan" });
    // Bentuk respons = getMKAnalisisMahasiswaHandler (nilai CPMK = nilai MK).
    const nilai = mkGrade(mhs.nim, mk) ?? 0;
    const peers = (kode) => mkOfProdi(mk.id_prodi).filter((x) => contributesTo(x, kode)).length;
    return reply(200, {
      mahasiswa: { nim: mhs.nim, nama: mhs.nama },
      matakuliah: { kode_mk: mk.kode_mk, nama_mk: mk.nama_mk, sks: mk.sks, nilai_angka: nilai, nilai_huruf: "-" },
      cpl_sumbangan: mk.cpl_terkait.map((kode) => {
        const cpl = cplOf(mk.id_prodi).find((c) => c.kode_cpl === kode);
        const bobot = Math.round((1 / peers(kode)) * 1000) / 1000;
        return { kode_cpl: kode, deskripsi: cpl ? cpl.deskripsi : "", bobot_mk_cpl: bobot, nilai_kontribusi: round1(nilai * bobot) };
      }),
      cpmk_analisis: mk.cpmk.map((c) => ({
        id_cpmk: c.id,
        kode_cpmk: c.kode_cpmk,
        deskripsi: c.deskripsi,
        nilai,
        sub_cpmks: c.sub.map((s) => ({ ...s, nilai })),
      })),
    });
  }

  if (p === "/api/nilai-mk/import" && method === "POST") {
    if (!body) return reply(400, { error: "body JSON tidak valid" });
    const [code, data] = importNilai(body);
    return reply(code, data);
  }

  return reply(404, { error: `route tidak dikenal: ${method} ${p}` });
}

export const summary = () => `${MAHASISWA.length} mahasiswa, ${MK.length} MK, data contoh`;
