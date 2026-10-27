'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Download, FileUp, Loader2, Search, X } from 'lucide-react';
import {
  errorMessage,
  fetchCPMKByMK,
  fetchMahasiswaSummary,
  fetchMKByProdiSemester,
  importNilai,
  type CPMKMaster,
  type ImportNilaiResult,
  type MahasiswaSummary,
  type MK,
  type Prodi,
} from '@/lib/simcplApi';
import { useConfig } from '@/lib/config';
import { fmt1, round1, sortByKode } from '@/lib/format';
import { useProdi } from '@/components/sim/useProdi';
import { EmptyState, Field, Notice, PageHeader, SegmentedTabs, SEMESTERS, Select, Skeleton } from '@/components/sim/ui';
import { cn } from '@/lib/utils';

type Tab = 'impor' | 'mahasiswa' | 'kurikulum';
const TABS: { id: Tab; label: string }[] = [
  { id: 'impor', label: 'Impor nilai' },
  { id: 'mahasiswa', label: 'Mahasiswa' },
  { id: 'kurikulum', label: 'Kurikulum' },
];

export default function DataPage() {
  const prodi = useProdi();
  const [tab, setTab] = useState<Tab>('impor');
  const [semester, setSemester] = useState(1);

  return (
    <>
      <PageHeader
        title="Data & impor"
        description="Impor nilai dari Excel, periksa daftar mahasiswa, dan tinjau kurikulum (mata kuliah, CPMK, dan CPL yang dipetakan)."
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SegmentedTabs label="Bagian" items={TABS} value={tab} onChange={setTab} />
        <div className="grid grid-cols-1 gap-3 sm:w-auto sm:grid-cols-[minmax(240px,1fr)_160px]">
          <Field label="Program studi" htmlFor="f-prodi">
            <Select id="f-prodi" value={prodi.selected?.id_prodi ?? ''} disabled={prodi.loading} onChange={(v) => prodi.setSelectedId(Number(v))}>
              {prodi.list.map((p) => (
                <option key={p.id_prodi} value={p.id_prodi}>
                  {p.nama_prodi}
                </option>
              ))}
            </Select>
          </Field>
          {tab !== 'mahasiswa' && (
            <Field label="Semester" htmlFor="f-semester">
              <Select id="f-semester" value={semester} onChange={(v) => setSemester(Number(v))}>
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </div>
      </div>

      {prodi.error && (
        <Notice tone="error" title="Data tidak dapat dimuat" className="mb-6">
          {prodi.error}
        </Notice>
      )}

      {prodi.selected && tab === 'impor' && <ImportPanel key={`${prodi.selected.id_prodi}-${semester}`} prodi={prodi.selected} semester={semester} />}
      {prodi.selected && tab === 'mahasiswa' && <StudentsPanel key={prodi.selected.id_prodi} prodi={prodi.selected} />}
      {prodi.selected && tab === 'kurikulum' && <CurriculumPanel key={`${prodi.selected.id_prodi}-${semester}`} prodi={prodi.selected} semester={semester} />}
    </>
  );
}

/* ── Impor nilai ───────────────────────────────────────────────────────── */

type CellIssue = { row: number; col: string; message: string };
type Parsed = {
  fileName: string;
  headers: string[];
  matched: { header: string; mk: MK }[];
  unknown: string[];
  rows: { nim: string; nama: string; values: Record<string, number | null>; raw: Record<string, string> }[];
  issues: CellIssue[];
  missingNim: number;
};

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '');

function toCellString(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(v);
  return String(v).trim();
}

function parseSheet(fileName: string, table: unknown[][], mks: MK[]): Parsed {
  const [headerRow = [], ...body] = table;
  const headers = headerRow.map((h) => toCellString(h));
  const nimIdx = headers.findIndex((h) => norm(h) === 'nim' || norm(h) === 'npm');
  const namaIdx = headers.findIndex((h) => norm(h) === 'nama');
  const byCode = new Map(mks.map((m) => [norm(m.kode_mk), m]));

  const matched: Parsed['matched'] = [];
  const unknown: string[] = [];
  headers.forEach((h, i) => {
    if (i === nimIdx || i === namaIdx || !h) return;
    const mk = byCode.get(norm(h));
    if (mk) matched.push({ header: h, mk });
    else unknown.push(h);
  });

  const issues: CellIssue[] = [];
  let missingNim = 0;
  const rows: Parsed['rows'] = [];
  body.forEach((cells, r) => {
    if (!cells || cells.every((c) => toCellString(c) === '')) return;
    const nim = nimIdx >= 0 ? toCellString(cells[nimIdx]).replace(/\.0$/, '') : '';
    const nama = namaIdx >= 0 ? toCellString(cells[namaIdx]) : '';
    if (!nim) missingNim++;
    const values: Record<string, number | null> = {};
    const raw: Record<string, string> = {};
    matched.forEach(({ header }) => {
      const i = headers.indexOf(header);
      const s = toCellString(cells[i]);
      raw[header] = s;
      if (s === '') {
        values[header] = null;
        return;
      }
      const n = Number(s.replace(',', '.'));
      if (!Number.isFinite(n)) {
        values[header] = null;
        issues.push({ row: r, col: header, message: `“${s}” bukan angka` });
      } else if (n < 0 || n > 100) {
        values[header] = null;
        issues.push({ row: r, col: header, message: `${s} di luar 0–100` });
      } else {
        values[header] = round1(n);
      }
    });
    rows.push({ nim, nama, values, raw });
  });

  return { fileName, headers, matched, unknown, rows, issues, missingNim };
}

function ImportPanel({ prodi, semester }: { prodi: Prodi; semester: number }) {
  const config = useConfig();
  const [mks, setMks] = useState<MK[] | null>(null);
  const [mkError, setMkError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ res: ImportNilaiResult; count: number; students: number } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchMKByProdiSemester(prodi.id_prodi, semester, ctrl.signal)
      .then((list) => setMks(sortByKode(list, (m) => m.kode_mk)))
      .catch((err) => {
        if (err.name !== 'AbortError') setMkError(errorMessage(err));
      });
    return () => ctrl.abort();
  }, [prodi.id_prodi, semester]);

  const readFile = async (file: File) => {
    if (!mks) return;
    setReading(true);
    setParseError(null);
    setResult(null);
    setImportError(null);
    try {
      if (!/\.(xlsx|xls|csv)$/i.test(file.name)) throw new Error('Format file harus .xlsx, .xls, atau .csv.');
      const XLSX = await import('xlsx');
      // CSV dibaca sebagai teks: parser SheetJS menganggap koma sebagai pemisah ribuan,
      // sehingga "7,5" (desimal Indonesia) akan terbaca 75. Angka diurai di parseSheet.
      const isCsv = /\.csv$/i.test(file.name);
      const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', raw: isCsv });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const table = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false, raw: true });
      if (table.length < 2) throw new Error('File tidak berisi data selain baris judul.');
      const p = parseSheet(file.name, table, mks);
      if (!p.headers.some((h) => norm(h) === 'nim' || norm(h) === 'npm')) throw new Error('Kolom NIM tidak ditemukan pada baris pertama.');
      if (p.matched.length === 0) {
        throw new Error(`Tidak ada kolom yang cocok dengan kode mata kuliah semester ${semester} (${mks.map((m) => m.kode_mk).join(', ')}).`);
      }
      setParsed(p);
    } catch (err) {
      setParsed(null);
      setParseError(errorMessage(err));
    } finally {
      setReading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const downloadTemplate = async () => {
    if (!mks) return;
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.aoa_to_sheet([['NIM', 'Nama', ...mks.map((m) => m.kode_mk)]]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Semester ${semester}`);
    XLSX.writeFile(wb, `Template-nilai_${prodi.kode_prodi}_semester-${semester}.xlsx`);
  };

  const ready = useMemo(() => {
    if (!parsed) return { students: 0, values: 0 };
    let values = 0;
    let students = 0;
    parsed.rows.forEach((r) => {
      if (!r.nim) return;
      const n = Object.values(r.values).filter((v) => v !== null).length;
      if (n > 0) {
        students++;
        values += n;
      }
    });
    return { students, values };
  }, [parsed]);

  const runImport = async () => {
    if (!parsed) return;
    setImporting(true);
    setImportError(null);
    try {
      const importData = parsed.rows
        .filter((r) => r.nim)
        .map((r) => {
          const nilaiMap: Record<string, number> = {};
          parsed.matched.forEach(({ header, mk }) => {
            const v = r.values[header];
            if (v !== null && v !== undefined) nilaiMap[mk.kode_mk] = v;
          });
          return { nim: r.nim, nama: r.nama, nilaiMap };
        })
        .filter((r) => Object.keys(r.nilaiMap).length > 0);
      const res = await importNilai({
        prodiKode: prodi.kode_prodi,
        semester,
        tahunAjaran: config.tahunAjaran,
        matkulList: parsed.matched.map(({ mk }) => ({ kode: mk.kode_mk, nama: mk.nama_mk, sks: mk.sks })),
        importData,
      });
      setResult({ res, count: ready.values, students: ready.students });
      setParsed(null);
    } catch (err) {
      setImportError(errorMessage(err));
    } finally {
      setImporting(false);
    }
  };

  const issueAt = (row: number, col: string) => parsed?.issues.find((i) => i.row === row && i.col === col);
  const PREVIEW = 50;

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-4">
        {mkError && <Notice tone="error" title="Daftar mata kuliah tidak dapat dimuat">{mkError}</Notice>}

        {result && (
          <Notice
            tone={result.res.recalc_error ? 'warning' : 'success'}
            title={`${result.count} nilai dari ${result.students} mahasiswa diimpor ke ${prodi.kode_prodi} semester ${semester}`}
            action={
              <Link href="/dashboard" className="text-[13px] font-medium underline underline-offset-2">
                Lihat ringkasan
              </Link>
            }
          >
            <span className="num">
              {result.res.nilai_inserted ?? 0} baru · {result.res.nilai_updated ?? 0} diperbarui · {result.res.nilai_dilewati ?? 0} dilewati
              {(result.res.mhs_baru ?? 0) > 0 && ` · ${result.res.mhs_baru} mahasiswa baru`}
            </span>
            {result.res.recalc_error && <span className="block">Nilai tersimpan, tetapi perhitungan ulang CPL gagal: {result.res.recalc_error}</span>}
          </Notice>
        )}

        {!parsed ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) readFile(f);
            }}
            className={cn(
              'rounded-lg border border-dashed bg-white px-6 py-10 text-center transition-colors',
              dragOver ? 'border-brand bg-brand-soft/40' : 'border-line-strong',
            )}
          >
            <FileUp className="mx-auto size-6 text-ink-400" aria-hidden />
            <p className="mt-3 font-medium text-ink-900">Seret file nilai ke sini, atau pilih dari komputer</p>
            <p className="mt-1 text-[13px] text-ink-600">Excel (.xlsx) atau CSV. Baris pertama berisi NIM, Nama, dan kode mata kuliah.</p>
            <input
              ref={inputRef}
              id="file-nilai"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) readFile(f);
              }}
            />
            <label htmlFor="file-nilai" className={cn('btn btn-primary mt-5 cursor-pointer', (!mks || reading) && 'pointer-events-none opacity-50')}>
              {reading ? <Loader2 className="animate-spin" aria-hidden /> : null}
              {reading ? 'Membaca file…' : 'Pilih file'}
            </label>
            {parseError && (
              <Notice tone="error" className="mx-auto mt-5 max-w-xl text-left">
                {parseError}
              </Notice>
            )}
          </div>
        ) : (
          <section aria-labelledby="h-preview" className="sheet overflow-hidden">
            <header className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 id="h-preview" className="truncate text-[15px] font-semibold">
                  Pratinjau · {parsed.fileName}
                </h2>
                <p className="num text-[13px] text-ink-600">
                  {ready.students} mahasiswa · {ready.values} nilai siap diimpor
                  {parsed.issues.length > 0 && <span className="text-bad-fg"> · {parsed.issues.length} sel dilewati</span>}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" className="btn btn-ghost" onClick={() => setParsed(null)} disabled={importing}>
                  <X aria-hidden /> Batal
                </button>
                <button type="button" className="btn btn-primary" onClick={runImport} disabled={importing || ready.values === 0}>
                  {importing && <Loader2 className="animate-spin" aria-hidden />}
                  {importing ? 'Mengimpor…' : `Impor ${ready.values} nilai`}
                </button>
              </div>
            </header>

            <div className="space-y-2 border-b border-line px-4 py-3 text-[13px]">
              <p>
                <span className="text-ink-600">Kolom dikenali: </span>
                <span className="font-mono text-[12.5px]">{parsed.matched.map((m) => m.mk.kode_mk).join(', ')}</span>
              </p>
              {parsed.unknown.length > 0 && (
                <p className="text-warn-fg">
                  Kolom diabaikan (bukan kode MK semester {semester}): <span className="font-mono text-[12.5px]">{parsed.unknown.join(', ')}</span>
                </p>
              )}
              {parsed.missingNim > 0 && <p className="text-warn-fg">{parsed.missingNim} baris tanpa NIM diabaikan.</p>}
            </div>

            {importError && (
              <Notice tone="error" title="Impor gagal" className="m-4">
                {importError}
              </Notice>
            )}

            <div className="max-h-[480px] overflow-auto">
              <table className="data-table">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th scope="col" className="w-[110px]">NIM</th>
                    <th scope="col">Nama</th>
                    {parsed.matched.map((m) => (
                      <th key={m.header} scope="col" className="text-right font-mono">
                        {m.mk.kode_mk}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, PREVIEW).map((r, ri) => (
                    <tr key={ri} className={r.nim ? '' : 'opacity-50'}>
                      <td className="code">{r.nim || '—'}</td>
                      <td className="whitespace-nowrap">{r.nama || <span className="text-ink-400">—</span>}</td>
                      {parsed.matched.map((m) => {
                        const issue = issueAt(ri, m.header);
                        const v = r.values[m.header];
                        return (
                          <td
                            key={m.header}
                            className={cn('num text-right', issue && 'bg-bad-bg font-medium text-bad-fg')}
                            title={issue?.message}
                          >
                            {issue ? r.raw[m.header] : v === null ? <span className="text-ink-300">·</span> : fmt1(v)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsed.rows.length > PREVIEW && (
              <p className="border-t border-line px-4 py-2 text-[12.5px] text-ink-500">
                Menampilkan {PREVIEW} dari {parsed.rows.length} baris. Semua baris ikut diimpor.
              </p>
            )}
            {parsed.issues.length > 0 && (
              <p className="border-t border-line px-4 py-2 text-[12.5px] text-ink-600">
                Sel merah tidak ikut diimpor. Arahkan kursor ke sel untuk melihat alasannya, atau perbaiki file lalu unggah ulang.
              </p>
            )}
          </section>
        )}
      </div>

      <aside className="sheet p-4 text-[13.5px]" aria-labelledby="h-format">
        <h2 id="h-format" className="text-[15px] font-semibold">
          Format file
        </h2>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-ink-700">
          <li>Baris pertama: <span className="font-mono text-[12.5px]">NIM</span>, <span className="font-mono text-[12.5px]">Nama</span>, lalu kode mata kuliah.</li>
          <li>Satu baris per mahasiswa, nilai 0–100 (koma atau titik desimal).</li>
          <li>Sel kosong dilewati; nilai yang sudah ada akan diperbarui.</li>
        </ol>

        <div className="mt-4 border-t border-line pt-4">
          <p className="font-medium text-ink-900">Kode MK semester {semester}</p>
          {mks === null ? (
            <Skeleton className="mt-2 h-16 w-full" />
          ) : mks.length === 0 ? (
            <p className="mt-1 text-ink-600">Belum ada mata kuliah di semester ini.</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {mks.map((m) => (
                <li key={m.id_mk} className="flex gap-2">
                  <span className="code w-[64px] shrink-0">{m.kode_mk}</span>
                  <span className="truncate text-ink-700">{m.nama_mk}</span>
                </li>
              ))}
            </ul>
          )}
          <button type="button" className="btn btn-secondary mt-4 w-full" onClick={downloadTemplate} disabled={!mks || mks.length === 0}>
            <Download aria-hidden /> Unduh template Excel
          </button>
        </div>

        <p className="mt-4 border-t border-line pt-4 text-[12.5px] text-ink-500">
          Tahun ajaran impor: <span className="font-medium text-ink-800">{config.tahunAjaran}</span>.{' '}
          <Link href="/dashboard/settings" className="underline underline-offset-2">
            Ubah
          </Link>
        </p>
      </aside>
    </div>
  );
}

/* ── Mahasiswa ─────────────────────────────────────────────────────────── */

function StudentsPanel({ prodi }: { prodi: Prodi }) {
  const [list, setList] = useState<MahasiswaSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const ctrl = new AbortController();
    fetchMahasiswaSummary(prodi.id_prodi, { signal: ctrl.signal })
      .then((l) => setList([...l].sort((a, b) => a.nim.localeCompare(b.nim))))
      .catch((err) => {
        if (err.name !== 'AbortError') setError(errorMessage(err));
      });
    return () => ctrl.abort();
  }, [prodi.id_prodi]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!list) return [];
    return q ? list.filter((s) => s.nim.toLowerCase().includes(q) || s.nama.toLowerCase().includes(q)) : list;
  }, [list, query]);

  if (error) return <Notice tone="error" title="Daftar mahasiswa tidak dapat dimuat">{error}</Notice>;
  if (list === null) return <Skeleton className="h-64 w-full" />;
  if (list.length === 0)
    return (
      <EmptyState title={`Belum ada mahasiswa di ${prodi.nama_prodi}`}>Mahasiswa ditambahkan otomatis saat nilainya diimpor.</EmptyState>
    );

  return (
    <section aria-labelledby="h-students" className="sheet overflow-hidden">
      <header className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="h-students" className="text-[15px] font-semibold">
          {list.length} mahasiswa · {prodi.nama_prodi}
        </h2>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
          <label htmlFor="cari-mhs" className="sr-only">
            Cari mahasiswa
          </label>
          <input
            id="cari-mhs"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari NIM atau nama"
            className="control pl-9"
          />
        </div>
      </header>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col" className="w-[120px]">NIM</th>
              <th scope="col">Nama</th>
              <th scope="col" className="w-[90px] text-right">Angkatan</th>
              <th scope="col" className="w-[110px] text-right">MK dinilai</th>
              <th scope="col" className="w-[120px] text-right">Rata-rata MK</th>
              <th scope="col" className="w-[90px]">
                <span className="sr-only">Aksi</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.nim}>
                <td className="code">{s.nim}</td>
                <td>{s.nama}</td>
                <td className="num text-right">{s.angkatan ?? '—'}</td>
                <td className="num text-right">{s.jumlah_mk}</td>
                <td className="num text-right font-medium">{s.jumlah_mk ? fmt1(s.rata_nilai) : '—'}</td>
                <td className="text-right">
                  <Link
                    href={`/dashboard/laporan?prodi=${prodi.id_prodi}&nim=${encodeURIComponent(s.nim)}`}
                    className="text-[13px] text-ink-700 underline-offset-2 hover:underline"
                    aria-label={`Laporan CPL ${s.nama}`}
                  >
                    Laporan
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-ink-500">
                  Tidak ada mahasiswa yang cocok dengan “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ── Kurikulum: MK → CPMK ──────────────────────────────────────────────── */

function CurriculumPanel({ prodi, semester }: { prodi: Prodi; semester: number }) {
  const [mks, setMks] = useState<MK[] | null>(null);
  const [cpmk, setCpmk] = useState<Record<string, CPMKMaster[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchMKByProdiSemester(prodi.id_prodi, semester, ctrl.signal)
      .then(async (list) => {
        const sorted = sortByKode(list, (m) => m.kode_mk);
        setMks(sorted);
        const entries = await Promise.all(sorted.map(async (m) => [m.id_mk, await fetchCPMKByMK(m.id_mk, ctrl.signal)] as const));
        setCpmk(Object.fromEntries(entries));
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(errorMessage(err));
      });
    return () => ctrl.abort();
  }, [prodi.id_prodi, semester]);

  if (error) return <Notice tone="error" title="Kurikulum tidak dapat dimuat">{error}</Notice>;
  if (mks === null) return <Skeleton className="h-64 w-full" />;
  if (mks.length === 0)
    return <EmptyState title={`Tidak ada mata kuliah semester ${semester}`}>Mata kuliah ditambahkan saat nilai diimpor dengan kode baru.</EmptyState>;

  const loaded = Object.keys(cpmk).length === mks.length;
  const problems = mks.filter((m) => {
    const list = cpmk[m.id_mk];
    if (!list) return false;
    if (list.length === 0) return true;
    const total = list.reduce((s, c) => s + (c.bobot ?? 0), 0);
    return list.every((c) => c.bobot !== null) && Math.abs(total - 1) > 0.005;
  });
  const sks = mks.reduce((s, m) => s + m.sks, 0);

  return (
    <div className="space-y-4">
      {loaded && problems.length > 0 && (
        <Notice tone="warning" title={`${problems.length} mata kuliah perlu diperiksa`}>
          CPMK belum ada atau bobotnya tidak berjumlah 100%: {problems.map((m) => m.kode_mk).join(', ')}.
        </Notice>
      )}

      <section aria-labelledby="h-kurikulum" className="sheet overflow-hidden">
        <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line px-4 py-3">
          <h2 id="h-kurikulum" className="text-[15px] font-semibold">
            Semester {semester} · {mks.length} mata kuliah · <span className="num">{sks}</span> SKS
          </h2>
          <p className="text-[13px] text-ink-500">
            Statistik capaian per CPL ada di{' '}
            <Link href="/dashboard/laporan" className="text-ink-800 underline underline-offset-2">
              Laporan
            </Link>
            .
          </p>
        </header>
        <ul className="divide-y divide-line">
          {mks.map((m) => {
            const list = cpmk[m.id_mk];
            const isOpen = open === m.id_mk;
            const total = list ? list.reduce((s, c) => s + (c.bobot ?? 0), 0) : 0;
            const problem = problems.includes(m);
            return (
              <li key={m.id_mk}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : m.id_mk)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-x-3 px-4 py-2.5 text-left hover:bg-ink-50 sm:grid-cols-[16px_72px_minmax(0,1fr)_56px_150px_90px]"
                >
                  <ChevronRight className={cn('size-4 text-ink-400 transition-transform', isOpen && 'rotate-90')} aria-hidden />
                  <span className="code hidden sm:inline">{m.kode_mk}</span>
                  <span className="min-w-0">
                    <span className="code mr-2 sm:hidden">{m.kode_mk}</span>
                    <span className="text-[13.5px] text-ink-900">{m.nama_mk}</span>
                  </span>
                  <span className="num hidden text-right text-[13px] text-ink-600 sm:inline">{m.sks} SKS</span>
                  <span className="hidden font-mono text-[12.5px] text-ink-700 sm:inline">{m.cpl_terkait?.join(', ') || '—'}</span>
                  <span className={cn('text-right text-[12.5px]', problem ? 'font-medium text-warn-fg' : 'text-ink-500')}>
                    {!list ? '…' : list.length === 0 ? 'tanpa CPMK' : `${list.length} CPMK`}
                  </span>
                </button>
                {isOpen && list && (
                  <div className="border-t border-line bg-ink-50/50 px-4 py-3 sm:pl-[52px]">
                    {list.length === 0 ? (
                      <p className="text-[13px] text-ink-600">Belum ada CPMK untuk mata kuliah ini.</p>
                    ) : (
                      <table className="data-table overflow-hidden rounded-md border border-line bg-white">
                        <thead>
                          <tr>
                            <th scope="col" className="w-[150px]">CPMK</th>
                            <th scope="col">Kemampuan yang diukur</th>
                            <th scope="col" className="w-[72px] text-right">Bobot</th>
                          </tr>
                        </thead>
                        <tbody>
                          {list.map((c) => (
                            <tr key={c.id}>
                              <td className="code">{c.kode_cpmk}</td>
                              <td>{c.deskripsi}</td>
                              <td className="num text-right">{c.bobot === null ? '—' : `${Math.round(c.bobot * 100)}%`}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={2}>Jumlah bobot</td>
                            <td className={cn('num text-right', Math.abs(total - 1) > 0.005 && 'text-warn-fg')}>{Math.round(total * 100)}%</td>
                          </tr>
                        </tfoot>
                      </table>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
