// ============================ SIMCPL API CLIENT ============================
// Satu-satunya tempat halaman berbicara dengan backend SIM-CPL (Go/Gin).
// Bentuk respons mengikuti handler di branch Backend; beberapa endpoint punya
// lebih dari satu bentuk historis, jadi dinormalisasi di sini.

export type Prodi = {
  id_prodi: number;
  kode_prodi: string;
  nama_prodi: string;
};

export type MK = {
  id_mk: string;
  id_prodi?: number;
  kode_mk: string;
  nama_mk: string;
  sks: number;
  semester: number;
  cpl_terkait?: string[];
};

export type MahasiswaSummary = {
  id_mhs: string;
  nim: string;
  nama: string;
  angkatan?: number | null;
  /** jumlah MK yang sudah dinilai (backend: jumlah_mk; versi lama: total_nilai) */
  jumlah_mk: number;
  rata_nilai: number | null;
};

export type ImportMatkulItem = { kode: string; nama: string; sks: number };
export type ImportMahasiswaItem = { nim: string; nama: string; nilaiMap: Record<string, number> };
export type ImportNilaiRequest = {
  prodiKode: string;
  semester: number;
  tahunAjaran: string;
  matkulList: ImportMatkulItem[];
  importData: ImportMahasiswaItem[];
};
export type ImportNilaiResult = {
  mk_baru?: number;
  mhs_baru?: number;
  nilai_inserted?: number;
  nilai_updated?: number;
  nilai_dilewati?: number;
  recalc_error?: string;
};

export type CPL = { id_cpl: number; kode_cpl: string; deskripsi: string };

export type NilaiCPLItem = {
  id_cpl?: number;
  kode_cpl: string;
  deskripsi?: string;
  nilai_angka: number;
  semester_eval?: number;
};

export type NilaiCPLByMahasiswaResponse = {
  nim: string;
  nama: string;
  semester: number;
  cpl: NilaiCPLItem[];
};

export type MappingMK = {
  id_mk: string;
  kode_mk: string;
  nama_mk: string;
  sks: number;
  semester: number;
  /** jumlah CPMK yang relevan dengan CPL ini */
  cpmk_count: number;
  /** kode CPMK yang relevan, dipisah koma */
  relasi: string[];
};

export type CPLMappingItem = {
  id_cpl: number;
  kode_cpl: string;
  deskripsi: string;
  mk_list: MappingMK[];
};

export type CPMKMaster = {
  id: string;
  kode_cpmk: string;
  deskripsi: string;
  /** pecahan 0–1, null jika belum ditentukan */
  bobot: number | null;
};

export type SubCPMK = { kode_sub_cpmk: string; deskripsi: string };

export type AnalisisMK = {
  nilai_mk: number | null;
  cpmk: { id_cpmk: string; kode_cpmk: string; deskripsi: string; sub_cpmks: SubCPMK[] }[];
};

export type NilaiMKItem = {
  id_mk: string;
  kode_mk: string;
  nama_mk: string;
  sks: number;
  semester?: number;
  nilai_angka: number;
};

export type CPLStat = {
  id_cpl: number;
  kode_cpl: string;
  deskripsi: string;
  jumlah_mahasiswa: number;
  rata_nilai: number;
  min_nilai: number;
  max_nilai: number;
  kategori_tinggi: number;
  kategori_sedang: number;
  kategori_rendah: number;
};

export type ProdiStats = {
  total_mahasiswa: number;
  total_mk: number;
  total_cpl: number;
  total_nilai_mk: number;
  distribusi_angkatan: { angkatan: number | string; jumlah: number }[];
};

// ============================ INTERNAL HELPERS ============================

function normalizeBaseUrl(raw: unknown): string {
  const s = typeof raw === 'string' ? raw : '';
  const base = (s || 'http://localhost:8001/api').trim();
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

export const API_BASE: string = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL);

function apiUrl(path: string): string {
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(apiUrl(path), {
      ...init,
      headers: { 'ngrok-skip-browser-warning': 'true', ...(init?.headers ?? {}) },
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new ApiError(0, `Server SIM-CPL tidak dapat dihubungi (${API_BASE}).`);
  }
  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = body?.error ?? '';
    } catch {
      /* respons bukan JSON */
    }
    throw new ApiError(res.status, detail || `Permintaan gagal (${res.status}).`);
  }
  return (await res.json()) as T;
}

const enc = (v: string | number) => encodeURIComponent(String(v));
const qsSemester = (semester?: number) => (semester ? `?semester=${enc(semester)}` : '');
const asArray = <T,>(v: unknown, key?: string): T[] => {
  if (Array.isArray(v)) return v as T[];
  if (key && v && typeof v === 'object' && Array.isArray((v as Record<string, unknown>)[key])) {
    return (v as Record<string, unknown>)[key] as T[];
  }
  return [];
};

// ============================ ENDPOINTS: MASTER ============================

export function fetchProdiList(signal?: AbortSignal): Promise<Prodi[]> {
  return fetchJson<Prodi[]>('/prodi', { signal }).then((d) => asArray<Prodi>(d));
}

export async function fetchMKByProdiSemester(idProdi: number, semester?: number, signal?: AbortSignal): Promise<MK[]> {
  const data = await fetchJson<unknown>(`/prodi/${enc(idProdi)}/mk${qsSemester(semester)}`, { signal });
  return asArray<MK>(data).map((mk) => ({ ...mk, cpl_terkait: Array.from(new Set(mk.cpl_terkait ?? [])) }));
}

export async function fetchMahasiswaSummary(
  idProdi: number,
  opts: { semester?: number; signal?: AbortSignal } = {},
): Promise<MahasiswaSummary[]> {
  const data = await fetchJson<unknown>(`/prodi/${enc(idProdi)}/mahasiswa-nilai${qsSemester(opts.semester)}`, {
    signal: opts.signal,
  });
  return asArray<Record<string, unknown>>(data).map((r) => ({
    id_mhs: String(r.id_mhs ?? r.nim ?? ''),
    nim: String(r.nim ?? ''),
    nama: String(r.nama ?? ''),
    angkatan: (r.angkatan as number | null | undefined) ?? null,
    jumlah_mk: Number(r.jumlah_mk ?? r.total_nilai ?? 0),
    rata_nilai: r.rata_nilai === undefined || r.rata_nilai === null ? null : Number(r.rata_nilai),
  }));
}

export function fetchCPLByProdi(idProdi: number, signal?: AbortSignal): Promise<CPL[]> {
  return fetchJson<CPL[]>(`/prodi/${enc(idProdi)}/cpl`, { signal }).then((d) => asArray<CPL>(d));
}

export async function fetchCPLMapping(idProdi: number, semester?: number, signal?: AbortSignal): Promise<CPLMappingItem[]> {
  const data = await fetchJson<unknown>(`/prodi/${enc(idProdi)}/cpl-mapping${qsSemester(semester)}`, { signal });
  return asArray<Record<string, unknown>>(data).map((c) => ({
    id_cpl: Number(c.id_cpl),
    kode_cpl: String(c.kode_cpl),
    deskripsi: String(c.deskripsi ?? ''),
    mk_list: asArray<Record<string, unknown>>(c.mk_list).map((m) => ({
      id_mk: String(m.id_mk),
      kode_mk: String(m.kode_mk),
      nama_mk: String(m.nama_mk),
      sks: Number(m.sks ?? 0),
      semester: Number(m.semester ?? 0),
      cpmk_count: Number(m.cpmk_count ?? 0),
      relasi: String(m.relasi ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    })),
  }));
}

export async function fetchCPMKByMK(idMK: string, signal?: AbortSignal): Promise<CPMKMaster[]> {
  const data = await fetchJson<unknown>(`/mk/${enc(idMK)}/cpmk`, { signal });
  return asArray<Record<string, unknown>>(data).map((c) => {
    const raw = (c.bobot ?? c.bobot_cpmk) as number | null | undefined;
    const bobot = raw === null || raw === undefined || Number(raw) <= 0 ? null : Number(raw) <= 1 ? Number(raw) : Number(raw) / 100;
    return {
      id: String(c.id ?? c.id_cpmk ?? c.kode_cpmk),
      kode_cpmk: String(c.kode_cpmk),
      deskripsi: String(c.deskripsi ?? ''),
      bobot,
    };
  });
}

export function fetchCPLStats(idProdi: number, semester?: number, signal?: AbortSignal): Promise<CPLStat[]> {
  return fetchJson<unknown>(`/prodi/${enc(idProdi)}/cpl-stats${qsSemester(semester)}`, { signal }).then((d) =>
    asArray<CPLStat>(d),
  );
}

export async function fetchProdiStats(idProdi: number, signal?: AbortSignal): Promise<ProdiStats> {
  const d = await fetchJson<Partial<ProdiStats>>(`/prodi/${enc(idProdi)}/stats`, { signal });
  return {
    total_mahasiswa: d.total_mahasiswa ?? 0,
    total_mk: d.total_mk ?? 0,
    total_cpl: d.total_cpl ?? 0,
    total_nilai_mk: d.total_nilai_mk ?? 0,
    distribusi_angkatan: d.distribusi_angkatan ?? [],
  };
}

// ============================ ENDPOINTS: MAHASISWA ============================

export async function fetchNilaiCPLByMahasiswa(
  nim: string,
  semester: number,
  signal?: AbortSignal,
): Promise<NilaiCPLByMahasiswaResponse> {
  const d = await fetchJson<Partial<NilaiCPLByMahasiswaResponse>>(`/mahasiswa/${enc(nim)}/cpl?semester=${enc(semester)}`, {
    signal,
  });
  return { nim: d.nim ?? nim, nama: d.nama ?? '', semester: d.semester ?? semester, cpl: asArray<NilaiCPLItem>(d.cpl) };
}

export async function fetchNilaiMK(nim: string, signal?: AbortSignal): Promise<NilaiMKItem[]> {
  const data = await fetchJson<unknown>(`/mahasiswa/${enc(nim)}/nilai-mk`, { signal });
  return asArray<NilaiMKItem>(data, 'nilai_mk');
}

export async function fetchAnalisisMK(nim: string, idMK: string, signal?: AbortSignal): Promise<AnalisisMK> {
  const data = await fetchJson<unknown>(`/mahasiswa/${enc(nim)}/mk/${enc(idMK)}/analisis`, { signal });
  const obj = (Array.isArray(data) ? { cpmk_analisis: data } : data) as Record<string, unknown>;
  const mk = obj.matakuliah as { nilai_angka?: number } | undefined;
  return {
    nilai_mk: mk?.nilai_angka ?? null,
    cpmk: asArray<Record<string, unknown>>(obj.cpmk_analisis).map((c) => ({
      id_cpmk: String(c.id_cpmk ?? c.kode_cpmk),
      kode_cpmk: String(c.kode_cpmk),
      deskripsi: String(c.deskripsi ?? ''),
      sub_cpmks: asArray<SubCPMK>(c.sub_cpmks),
    })),
  };
}

// ============================ ENDPOINTS: NILAI ============================

export function importNilai(payload: ImportNilaiRequest, signal?: AbortSignal): Promise<ImportNilaiResult> {
  return fetchJson<ImportNilaiResult>('/nilai-mk/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });
}

export function recalcBobotProdi(idProdi: number, signal?: AbortSignal): Promise<{ status: string; message?: string }> {
  return fetchJson<{ status: string; message?: string }>(`/prodi/${enc(idProdi)}/recalc-bobot`, { method: 'POST', signal });
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Terjadi kesalahan yang tidak diketahui.';
}
