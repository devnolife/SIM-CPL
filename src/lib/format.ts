// Format angka untuk konteks akademik Indonesia (koma desimal).

export function fmt1(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/** Dua desimal — untuk poin kontribusi agar penjumlahannya tepat sama dengan nilai MK. */
export function fmt2(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtPct(fraction: number): string {
  if (!Number.isFinite(fraction)) return '—';
  return `${Math.round(fraction * 100)}%`;
}

export function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Bobot CPMK dari backend bisa pecahan (0.25) atau persen (25). */
export function bobotFraction(raw: number | null | undefined): number | null {
  if (raw === null || raw === undefined || Number.isNaN(raw) || raw <= 0) return null;
  return raw <= 1 ? raw : raw / 100;
}

export function sortByKode<T>(items: T[], kode: (item: T) => string): T[] {
  const n = (s: string) => Number(s.replace(/\D/g, '')) || 0;
  return [...items].sort((a, b) => n(kode(a)) - n(kode(b)) || kode(a).localeCompare(kode(b)));
}
