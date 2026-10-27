'use client';

// Konfigurasi yang diatur di halaman Pengaturan. Disimpan di localStorage
// (seperti versi awal) dan dibaca lewat useSyncExternalStore agar semua halaman
// langsung mengikuti perubahan tanpa reload.

import { useMemo, useSyncExternalStore } from 'react';
import { DEFAULT_THRESHOLDS, type Thresholds } from './status';

export type SimConfig = {
  batasTercapai: number;
  batasCukup: number;
  tahunAjaran: string;
  namaDekan: string;
  nipDekan: string;
  namaKaprodi: string;
  nipKaprodi: string;
};

const KEY = 'simcpl_config';
export const CONFIG_EVENT = 'configUpdated';

/** Tahun ajaran berjalan: Agustus ke atas = awal tahun ajaran baru. */
export function currentTahunAjaran(date = new Date()): string {
  const y = date.getFullYear();
  return date.getMonth() >= 7 ? `${y}/${y + 1}` : `${y - 1}/${y}`;
}

export const DEFAULT_CONFIG: SimConfig = {
  batasTercapai: DEFAULT_THRESHOLDS.tercapai,
  batasCukup: DEFAULT_THRESHOLDS.cukup,
  tahunAjaran: currentTahunAjaran(),
  namaDekan: '',
  nipDekan: '',
  namaKaprodi: '',
  nipKaprodi: '',
};

export function validThresholds(tercapai: number, cukup: number): boolean {
  return (
    Number.isFinite(tercapai) &&
    Number.isFinite(cukup) &&
    cukup >= 0 &&
    tercapai <= 100 &&
    cukup < tercapai
  );
}

function parse(raw: string): SimConfig {
  if (!raw) return DEFAULT_CONFIG;
  try {
    const merged = { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<SimConfig>) };
    merged.batasTercapai = Number(merged.batasTercapai);
    merged.batasCukup = Number(merged.batasCukup);
    if (!validThresholds(merged.batasTercapai, merged.batasCukup)) {
      merged.batasTercapai = DEFAULT_CONFIG.batasTercapai;
      merged.batasCukup = DEFAULT_CONFIG.batasCukup;
    }
    return merged;
  } catch {
    return DEFAULT_CONFIG;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(CONFIG_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CONFIG_EVENT, onChange);
  };
}

export function useConfig(): SimConfig {
  const raw = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(KEY) ?? '',
    () => '',
  );
  return useMemo(() => parse(raw), [raw]);
}

export function useThresholds(): Thresholds {
  const { batasTercapai, batasCukup } = useConfig();
  return useMemo(() => ({ tercapai: batasTercapai, cukup: batasCukup }), [batasTercapai, batasCukup]);
}

export function saveConfig(config: SimConfig) {
  localStorage.setItem(KEY, JSON.stringify(config));
  window.dispatchEvent(new Event(CONFIG_EVENT));
}
