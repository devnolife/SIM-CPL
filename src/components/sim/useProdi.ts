'use client';

import { useEffect, useState } from 'react';
import { fetchProdiList, errorMessage, type Prodi } from '@/lib/simcplApi';

/** Daftar prodi + prodi terpilih (dipakai semua halaman). */
export function useProdi() {
  const [list, setList] = useState<Prodi[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchProdiList(ctrl.signal)
      .then((data) => {
        setList(data);
        setSelectedId((cur) => cur ?? data[0]?.id_prodi ?? null);
        setError(null);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(errorMessage(err));
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, []);

  const selected = list.find((p) => p.id_prodi === selectedId) ?? null;
  return { list, selected, setSelectedId, loading, error };
}
