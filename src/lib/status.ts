// Status capaian CPL. Satu sumber kebenaran untuk seluruh halaman:
// ambang dibaca dari Pengaturan (lihat lib/config.ts), default 70/50.

export type CplStatus = 'tercapai' | 'cukup' | 'belum' | 'kosong';

export type Thresholds = { tercapai: number; cukup: number };

export const DEFAULT_THRESHOLDS: Thresholds = { tercapai: 70, cukup: 50 };

export function statusOf(value: number | null | undefined, t: Thresholds = DEFAULT_THRESHOLDS): CplStatus {
  if (value === null || value === undefined || Number.isNaN(value)) return 'kosong';
  if (value >= t.tercapai) return 'tercapai';
  if (value >= t.cukup) return 'cukup';
  return 'belum';
}

export const STATUS_LABEL: Record<CplStatus, string> = {
  tercapai: 'Tercapai',
  cukup: 'Cukup',
  belum: 'Belum tercapai',
  kosong: 'Belum ada nilai',
};

// Warna grafik (SVG tidak bisa membaca kelas Tailwind).
export const STATUS_HEX: Record<CplStatus, string> = {
  tercapai: '#23804f',
  cukup: '#c48a12',
  belum: '#c8442e',
  kosong: '#9aa39f',
};

// Warna untuk TEKS berstatus di atas putih (kontras ≥ 4,5:1).
export const STATUS_TEXT: Record<CplStatus, string> = {
  tercapai: '#155c37',
  cukup: '#7a5206',
  belum: '#b3261e',
  kosong: '#646e69',
};

export function rangeLabel(status: CplStatus, t: Thresholds): string {
  switch (status) {
    case 'tercapai':
      return `≥ ${t.tercapai}`;
    case 'cukup':
      return `${t.cukup}–${t.tercapai - 1}`;
    case 'belum':
      return `< ${t.cukup}`;
    default:
      return 'tanpa nilai';
  }
}
