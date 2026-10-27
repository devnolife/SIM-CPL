'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import {
  errorMessage,
  fetchCPLByProdi,
  fetchCPLStats,
  fetchMahasiswaSummary,
  fetchMKByProdiSemester,
  fetchNilaiCPLByMahasiswa,
  fetchNilaiMK,
  fetchProdiStats,
  type CPL,
  type CPLStat,
  type MahasiswaSummary,
  type MK,
  type NilaiMKItem,
  type Prodi,
  type ProdiStats,
} from '@/lib/simcplApi';
import { useThresholds } from '@/lib/config';
import { fmt1, mean, round1, sortByKode } from '@/lib/format';
import { DEFAULT_THRESHOLDS, STATUS_HEX, STATUS_LABEL, STATUS_TEXT, statusOf, type Thresholds } from '@/lib/status';
import { useProdi } from '@/components/sim/useProdi';
import { StudentPicker } from '@/components/sim/StudentPicker';
import { RadarProfile } from '@/components/sim/RadarProfile';
import { ReportHeader, ReportSection, SignatureBlock } from '@/components/sim/report';
import { EmptyState, Field, Notice, PageHeader, ScoreBar, SegmentedTabs, SEMESTERS, Select, Skeleton, StatusTag } from '@/components/sim/ui';

type Mode = 'mahasiswa' | 'semester' | 'prodi';
const MODES: { id: Mode; label: string }[] = [
  { id: 'mahasiswa', label: 'Per mahasiswa' },
  { id: 'semester', label: 'Per semester' },
  { id: 'prodi', label: 'Per prodi' },
];

type ExportTable = { sheet: string; rows: Record<string, string | number>[]; landscape?: boolean };

export default function LaporanPage() {
  const thresholds = useThresholds();
  const prodi = useProdi();
  const [mode, setMode] = useState<Mode>('mahasiswa');
  const [semester, setSemester] = useState(1);
  const [students, setStudents] = useState<MahasiswaSummary[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [nim, setNim] = useState<string | null>(null);
  const [exportTable, setExportTable] = useState<ExportTable | null>(null);
  const [exporting, setExporting] = useState<'pdf' | 'xlsx' | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const idProdi = prodi.selected?.id_prodi ?? null;
  const { setSelectedId } = prodi;

  // Tautan langsung: /dashboard/laporan?prodi=1&nim=2024001
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const p = Number(q.get('prodi'));
    if (p) setSelectedId(p);
    const n = q.get('nim');
    if (n) {
      setNim(n);
      setMode('mahasiswa');
    }
  }, [setSelectedId]);

  useEffect(() => {
    if (!idProdi) return;
    const ctrl = new AbortController();
    setLoadingStudents(true);
    fetchMahasiswaSummary(idProdi, { signal: ctrl.signal })
      .then((list) => {
        const withGrades = list.filter((s) => s.jumlah_mk > 0);
        setStudents(withGrades);
        setNim((cur) => (cur && withGrades.some((s) => s.nim === cur) ? cur : withGrades[0]?.nim ?? null));
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setStudents([]);
      })
      .finally(() => setLoadingStudents(false));
    return () => ctrl.abort();
  }, [idProdi]);

  const student = students.find((s) => s.nim === nim) ?? null;
  const fileBase = `Laporan-CPL_${prodi.selected?.kode_prodi ?? 'prodi'}_${
    mode === 'mahasiswa' ? student?.nim ?? 'mahasiswa' : mode === 'semester' ? `semester-${semester}` : 'prodi'
  }`;

  const exportPdf = async () => {
    if (!sheetRef.current) return;
    setExporting('pdf');
    setExportError(null);
    try {
      const { default: html2pdf } = await import('html2pdf.js');
      // `pagebreak` didukung html2pdf.js tetapi tidak ada di deklarasi tipenya.
      // windowWidth: PDF selalu dirender dengan tata letak desktop, dari perangkat apa pun.
      const landscape = exportTable?.landscape ?? false;
      const options: Record<string, unknown> = {
        margin: [12, 12, 14, 12],
        filename: `${fileBase}.pdf`,
        image: { type: 'jpeg', quality: 0.96 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: 1200 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: landscape ? 'landscape' : 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', '.break-inside-avoid'] },
      };
      await html2pdf()
        .set(options as never)
        .from(sheetRef.current)
        .save();
    } catch (err) {
      setExportError(`PDF gagal dibuat: ${errorMessage(err)}`);
    } finally {
      setExporting(null);
    }
  };

  const exportXlsx = async () => {
    if (!exportTable) return;
    setExporting('xlsx');
    setExportError(null);
    try {
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(exportTable.rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, exportTable.sheet.slice(0, 31));
      XLSX.writeFile(wb, `${fileBase}.xlsx`);
    } catch (err) {
      setExportError(`Excel gagal dibuat: ${errorMessage(err)}`);
    } finally {
      setExporting(null);
    }
  };

  const ready = !!exportTable && exportTable.rows.length > 0;

  return (
    <>
      <PageHeader
        title="Laporan capaian CPL"
        description="Dokumen untuk evaluasi kurikulum dan akreditasi. Pilih jenis laporan, lalu unduh sebagai PDF bertanda tangan atau tabel Excel."
        actions={
          <>
            <button type="button" className="btn btn-secondary" onClick={exportXlsx} disabled={!ready || exporting !== null}>
              {exporting === 'xlsx' ? <Loader2 className="animate-spin" aria-hidden /> : <FileSpreadsheet aria-hidden />}
              Unduh Excel
            </button>
            <button type="button" className="btn btn-primary" onClick={exportPdf} disabled={!ready || exporting !== null}>
              {exporting === 'pdf' ? <Loader2 className="animate-spin" aria-hidden /> : <Download aria-hidden />}
              {exporting === 'pdf' ? 'Menyiapkan PDF…' : 'Unduh PDF'}
            </button>
          </>
        }
      />

      <div className="sheet mb-6 p-4">
        <SegmentedTabs
          label="Jenis laporan"
          items={MODES}
          value={mode}
          onChange={(m) => {
            setMode(m);
            setExportTable(null);
          }}
          className="mb-4"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_200px_1.4fr]">
          <Field label="Program studi" htmlFor="f-prodi">
            <Select
              id="f-prodi"
              value={idProdi ?? ''}
              disabled={prodi.loading}
              onChange={(v) => {
                prodi.setSelectedId(Number(v));
                setNim(null);
                setExportTable(null);
              }}
            >
              {prodi.list.map((p) => (
                <option key={p.id_prodi} value={p.id_prodi}>
                  {p.nama_prodi}
                </option>
              ))}
            </Select>
          </Field>
          {mode === 'semester' && (
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
          {mode === 'mahasiswa' && (
            <Field label="Mahasiswa" htmlFor="f-mhs" className="sm:col-span-1 lg:col-span-2">
              <StudentPicker id="f-mhs" students={students} value={nim} onChange={setNim} loading={loadingStudents} />
            </Field>
          )}
        </div>
      </div>

      {(prodi.error || exportError) && (
        <Notice tone="error" className="mb-6">
          {prodi.error || exportError}
        </Notice>
      )}

      {prodi.selected && (
        <div ref={sheetRef} className="sheet mx-auto max-w-[920px] px-6 py-8 sm:px-10">
          {mode === 'mahasiswa' &&
            (student ? (
              <MahasiswaReport key={student.nim} prodi={prodi.selected} student={student} thresholds={thresholds} onTable={setExportTable} />
            ) : (
              <EmptyState title={loadingStudents ? 'Memuat mahasiswa…' : 'Belum ada mahasiswa dengan nilai di prodi ini'} className="border-0" />
            ))}
          {mode === 'semester' && (
            <SemesterReport key={`${prodi.selected.id_prodi}-${semester}`} prodi={prodi.selected} semester={semester} thresholds={thresholds} onTable={setExportTable} />
          )}
          {mode === 'prodi' && <ProdiReport key={prodi.selected.id_prodi} prodi={prodi.selected} thresholds={thresholds} onTable={setExportTable} />}
        </div>
      )}
    </>
  );
}

/* ── Laporan per mahasiswa: matriks CPL × semester ─────────────────────── */

function MahasiswaReport({
  prodi,
  student,
  thresholds,
  onTable,
}: {
  prodi: Prodi;
  student: MahasiswaSummary;
  thresholds: Thresholds;
  onTable: (t: ExportTable | null) => void;
}) {
  const [cpls, setCpls] = useState<CPL[]>([]);
  const [matrix, setMatrix] = useState<Record<string, Record<number, number>>>({});
  const [mks, setMks] = useState<MK[]>([]);
  const [grades, setGrades] = useState<NilaiMKItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    Promise.all([
      fetchCPLByProdi(prodi.id_prodi, ctrl.signal),
      Promise.all(SEMESTERS.map((s) => fetchNilaiCPLByMahasiswa(student.nim, s, ctrl.signal).catch(() => null))),
      fetchMKByProdiSemester(prodi.id_prodi, undefined, ctrl.signal),
      fetchNilaiMK(student.nim, ctrl.signal),
    ])
      .then(([cplList, perSem, mkList, nilai]) => {
        const m: Record<string, Record<number, number>> = {};
        perSem.forEach((res, i) => res?.cpl.forEach((c) => ((m[c.kode_cpl] ??= {})[i + 1] = c.nilai_angka)));
        setCpls(sortByKode(cplList, (c) => c.kode_cpl));
        setMatrix(m);
        setMks(mkList);
        setGrades(nilai);
        setError(null);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(errorMessage(err));
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [prodi.id_prodi, student.nim]);

  const semesters = useMemo(
    () => SEMESTERS.filter((s) => Object.values(matrix).some((row) => row[s] !== undefined)),
    [matrix],
  );
  const rows = useMemo(
    () =>
      cpls.map((c) => {
        const vals = semesters.map((s) => matrix[c.kode_cpl]?.[s]).filter((v): v is number => v !== undefined);
        const avg = mean(vals);
        return { ...c, perSem: matrix[c.kode_cpl] ?? {}, avg: avg === null ? null : round1(avg) };
      }),
    [cpls, matrix, semesters],
  );
  const trend = semesters.map((s) => {
    const vals = rows.map((r) => r.perSem[s]).filter((v): v is number => v !== undefined);
    return { semester: `Sem ${s}`, rata: round1(mean(vals) ?? 0) };
  });
  const measured = rows.filter((r) => r.avg !== null);
  const overall = mean(measured.map((r) => r.avg as number));

  // CPL di bawah batas tercapai beserta MK penyumbang yang nilainya juga di bawah batas.
  const gradeByMk = new Map(grades.map((g) => [g.id_mk, g.nilai_angka]));
  const concerns = measured
    .filter((r) => (r.avg as number) < thresholds.tercapai)
    .sort((a, b) => (a.avg as number) - (b.avg as number))
    .map((r) => ({
      ...r,
      mks: mks
        .filter((m) => m.cpl_terkait?.includes(r.kode_cpl) && gradeByMk.has(m.id_mk) && (gradeByMk.get(m.id_mk) as number) < thresholds.tercapai)
        .map((m) => ({ ...m, nilai: gradeByMk.get(m.id_mk) as number }))
        .sort((a, b) => a.nilai - b.nilai),
    }));

  useEffect(() => {
    if (loading || error) {
      onTable(null);
      return;
    }
    onTable({
      sheet: `CPL ${student.nim}`,
      landscape: semesters.length > 5,
      rows: rows.map((r) => {
        const row: Record<string, string | number> = { 'Kode CPL': r.kode_cpl, Deskripsi: r.deskripsi };
        semesters.forEach((s) => (row[`Semester ${s}`] = r.perSem[s] ?? ''));
        row['Rata-rata'] = r.avg ?? '';
        row.Status = STATUS_LABEL[statusOf(r.avg, thresholds)];
        return row;
      }),
    });
  }, [loading, error, rows, semesters, thresholds, student.nim, onTable]);

  if (loading) return <ReportSkeleton />;
  if (error) return <Notice tone="error" title="Laporan tidak dapat dibuat">{error}</Notice>;

  return (
    <>
      <ReportHeader
        title="Laporan Capaian Pembelajaran Lulusan"
        subtitle={`${student.nama} · ${student.nim}`}
        meta={[
          ['Program studi', prodi.nama_prodi],
          ['Angkatan', student.angkatan ?? '—'],
          ['Rata-rata CPL', <span key="avg" className="num">{fmt1(overall)}</span>],
        ]}
      />

      <ReportSection
        title="Capaian CPL per semester"
        note={`Status dihitung dari rata-rata semua semester. Tercapai ≥ ${thresholds.tercapai}, cukup ≥ ${thresholds.cukup}.`}
      >
        <div className="overflow-x-auto">
          <table className="data-table min-w-[680px]">
            <thead>
              <tr>
                <th scope="col" className="w-[64px]">CPL</th>
                <th scope="col">Deskripsi</th>
                {semesters.map((s) => (
                  <th key={s} scope="col" className="w-[52px] text-right">
                    S{s}
                  </th>
                ))}
                <th scope="col" className="w-[72px] text-right">Rata-rata</th>
                <th scope="col" className="w-[132px]">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.kode_cpl}>
                  <td className="code">{r.kode_cpl}</td>
                  <td className="text-[13px] text-ink-700">{r.deskripsi}</td>
                  {semesters.map((s) => {
                    const v = r.perSem[s];
                    const st = statusOf(v ?? null, thresholds);
                    return (
                      <td key={s} className="num text-right" style={{ color: st === 'kosong' ? '#b3bab6' : st === 'tercapai' ? undefined : STATUS_TEXT[st] }}>
                        {v === undefined ? '·' : fmt1(v)}
                      </td>
                    );
                  })}
                  <td className="num text-right font-semibold">{fmt1(r.avg)}</td>
                  <td>
                    <StatusTag status={statusOf(r.avg, thresholds)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[12px] text-ink-500">“·” = CPL tidak diukur di semester itu. Angka berwarna = di bawah batas tercapai.</p>
        <p data-html2canvas-ignore className="mt-1 text-[12px] text-ink-500 sm:hidden">
          Geser tabel ke samping untuk melihat semua kolom.
        </p>
      </ReportSection>

      {semesters.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-8 break-inside-avoid md:grid-cols-2">
          <section>
            <h3 className="mb-3 text-[15px] font-semibold">Tren rata-rata CPL</h3>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                  <CartesianGrid stroke="#e5e9e6" vertical={false} />
                  <XAxis dataKey="semester" tick={{ fontSize: 12, fill: '#646e69' }} axisLine={{ stroke: '#c3cac6' }} tickLine={false} />
                  <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 12, fill: '#646e69' }} axisLine={false} tickLine={false} />
                  <ReferenceLine y={thresholds.tercapai} stroke="#39413d" strokeDasharray="3 4" />
                  <Tooltip
                    formatter={(v: number) => [fmt1(v), 'Rata-rata CPL']}
                    contentStyle={{ borderRadius: 6, border: '1px solid #dbe0dd', fontSize: 12.5 }}
                  />
                  <Line type="linear" dataKey="rata" stroke="#1d7a52" strokeWidth={2} dot={{ r: 3.5, fill: '#1d7a52' }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section>
            <h3 className="mb-3 text-[15px] font-semibold">Profil CPL kumulatif</h3>
            {measured.length >= 3 ? (
              <RadarProfile points={measured.map((r) => ({ kode: r.kode_cpl, nilai: r.avg, deskripsi: r.deskripsi }))} thresholds={thresholds} height={240} />
            ) : (
              <p className="text-[13px] text-ink-600">Profil digambar bila minimal 3 CPL bernilai.</p>
            )}
          </section>
        </div>
      )}

      <ReportSection title="Perlu perhatian">
        {concerns.length === 0 ? (
          <p className="text-[13.5px] text-ink-700">Semua CPL yang sudah diukur berada di atas batas tercapai ({thresholds.tercapai}).</p>
        ) : (
          <ul className="space-y-3">
            {concerns.map((c) => (
              <li key={c.kode_cpl} className="rounded-md border border-line px-4 py-3">
                <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="code">{c.kode_cpl}</span>
                  <span className="num font-semibold">{fmt1(c.avg)}</span>
                  <StatusTag status={statusOf(c.avg, thresholds)} />
                </p>
                <p className="mt-1 text-[13px] text-ink-700">{c.deskripsi}</p>
                {c.mks.length > 0 ? (
                  <p className="mt-2 text-[13px] text-ink-700">
                    Mata kuliah penyumbang di bawah {thresholds.tercapai}:{' '}
                    {c.mks.map((m, i) => (
                      <span key={m.id_mk}>
                        {i > 0 && ', '}
                        <span className="code text-[12px]">{m.kode_mk}</span> {m.nama_mk} (<span className="num">{fmt1(m.nilai)}</span>)
                      </span>
                    ))}
                    .
                  </p>
                ) : (
                  <p className="mt-2 text-[13px] text-ink-600">Tidak ada satu MK yang menonjol; nilai rendah tersebar di beberapa semester.</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </ReportSection>

      <SignatureBlock />
    </>
  );
}

/* ── Laporan per semester ──────────────────────────────────────────────── */

function SemesterReport({
  prodi,
  semester,
  thresholds,
  onTable,
}: {
  prodi: Prodi;
  semester: number;
  thresholds: Thresholds;
  onTable: (t: ExportTable | null) => void;
}) {
  const [stats, setStats] = useState<CPLStat[]>([]);
  const [mks, setMks] = useState<MK[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    Promise.all([
      fetchCPLStats(prodi.id_prodi, semester, ctrl.signal),
      fetchMKByProdiSemester(prodi.id_prodi, semester, ctrl.signal),
      fetchMahasiswaSummary(prodi.id_prodi, { semester, signal: ctrl.signal }),
    ])
      .then(([s, m, mhs]) => {
        setStats(sortByKode(s, (x) => x.kode_cpl));
        setMks(sortByKode(m, (x) => x.kode_mk));
        setStudentCount(mhs.length);
        setError(null);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(errorMessage(err));
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [prodi.id_prodi, semester]);

  useEffect(() => {
    if (loading || error) {
      onTable(null);
      return;
    }
    onTable({
      sheet: `CPL Semester ${semester}`,
      rows: stats.map((s) => ({
        'Kode CPL': s.kode_cpl,
        Deskripsi: s.deskripsi,
        'Jumlah mahasiswa': s.jumlah_mahasiswa,
        'Rata-rata': s.jumlah_mahasiswa ? s.rata_nilai : '',
        Minimum: s.jumlah_mahasiswa ? s.min_nilai : '',
        Maksimum: s.jumlah_mahasiswa ? s.max_nilai : '',
        Status: STATUS_LABEL[statusOf(s.jumlah_mahasiswa ? s.rata_nilai : null, thresholds)],
      })),
    });
  }, [loading, error, stats, semester, thresholds, onTable]);

  if (loading) return <ReportSkeleton />;
  if (error) return <Notice tone="error" title="Laporan tidak dapat dibuat">{error}</Notice>;

  const sks = mks.reduce((sum, m) => sum + m.sks, 0);
  const customBands = thresholds.tercapai !== DEFAULT_THRESHOLDS.tercapai || thresholds.cukup !== DEFAULT_THRESHOLDS.cukup;

  return (
    <>
      <ReportHeader
        title="Laporan Capaian CPL Semester"
        subtitle={`${prodi.nama_prodi} · Semester ${semester}`}
        meta={[
          ['Mahasiswa dinilai', <span key="n" className="num">{studentCount}</span>],
          ['Mata kuliah', <span key="mk" className="num">{mks.length}</span>],
          ['Total SKS', <span key="sks" className="num">{sks}</span>],
        ]}
      />

      {studentCount === 0 ? (
        <p className="mt-8 text-[13.5px] text-ink-600">Belum ada nilai mahasiswa di semester {semester}.</p>
      ) : (
        <ReportSection
          title="Capaian CPL"
          note={customBands ? 'Kolom sebaran memakai batas bawaan server: ≥ 70 / 50–69 / < 50.' : 'Sebaran: tercapai / cukup / belum.'}
        >
          <CplStatsTable stats={stats} thresholds={thresholds} />
        </ReportSection>
      )}

      <ReportSection title={`Mata kuliah semester ${semester}`}>
        {mks.length === 0 ? (
          <p className="text-[13.5px] text-ink-600">Tidak ada mata kuliah terdaftar.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col" className="w-[84px]">Kode</th>
                <th scope="col">Mata kuliah</th>
                <th scope="col" className="w-[52px] text-right">SKS</th>
                <th scope="col" className="w-[160px]">CPL terkait</th>
              </tr>
            </thead>
            <tbody>
              {mks.map((m) => (
                <tr key={m.id_mk}>
                  <td className="code">{m.kode_mk}</td>
                  <td>{m.nama_mk}</td>
                  <td className="num text-right">{m.sks}</td>
                  <td className="font-mono text-[12.5px] text-ink-700">{m.cpl_terkait?.join(', ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ReportSection>

      <SignatureBlock />
    </>
  );
}

/* ── Laporan per prodi ─────────────────────────────────────────────────── */

function ProdiReport({ prodi, thresholds, onTable }: { prodi: Prodi; thresholds: Thresholds; onTable: (t: ExportTable | null) => void }) {
  const [stats, setStats] = useState<CPLStat[]>([]);
  const [info, setInfo] = useState<ProdiStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    Promise.all([fetchCPLStats(prodi.id_prodi, undefined, ctrl.signal), fetchProdiStats(prodi.id_prodi, ctrl.signal)])
      .then(([s, i]) => {
        setStats(sortByKode(s, (x) => x.kode_cpl));
        setInfo(i);
        setError(null);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(errorMessage(err));
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [prodi.id_prodi]);

  useEffect(() => {
    if (loading || error) {
      onTable(null);
      return;
    }
    onTable({
      sheet: `CPL ${prodi.kode_prodi}`,
      rows: stats.map((s) => ({
        'Kode CPL': s.kode_cpl,
        Deskripsi: s.deskripsi,
        'Jumlah mahasiswa': s.jumlah_mahasiswa,
        'Rata-rata': s.jumlah_mahasiswa ? s.rata_nilai : '',
        Minimum: s.jumlah_mahasiswa ? s.min_nilai : '',
        Maksimum: s.jumlah_mahasiswa ? s.max_nilai : '',
        Status: STATUS_LABEL[statusOf(s.jumlah_mahasiswa ? s.rata_nilai : null, thresholds)],
      })),
    });
  }, [loading, error, stats, thresholds, prodi.kode_prodi, onTable]);

  if (loading) return <ReportSkeleton />;
  if (error) return <Notice tone="error" title="Laporan tidak dapat dibuat">{error}</Notice>;

  const hasData = stats.some((s) => s.jumlah_mahasiswa > 0);
  const customBands = thresholds.tercapai !== DEFAULT_THRESHOLDS.tercapai || thresholds.cukup !== DEFAULT_THRESHOLDS.cukup;

  return (
    <>
      <ReportHeader
        title="Laporan Capaian CPL Program Studi"
        subtitle={`${prodi.nama_prodi} (${prodi.kode_prodi})`}
        meta={[
          ['Mahasiswa', <span key="m" className="num">{info?.total_mahasiswa ?? 0}</span>],
          ['Mata kuliah', <span key="mk" className="num">{info?.total_mk ?? 0}</span>],
          ['Nilai MK tersimpan', <span key="n" className="num">{info?.total_nilai_mk ?? 0}</span>],
        ]}
      />

      {!hasData ? (
        <p className="mt-8 text-[13.5px] text-ink-600">
          Belum ada nilai untuk {prodi.nama_prodi}.{' '}
          <Link href="/dashboard/manajemen" className="font-medium text-ink-900 underline underline-offset-2" data-html2canvas-ignore>
            Impor nilai
          </Link>
        </p>
      ) : (
        <ReportSection
          title="Capaian CPL kumulatif (semua semester)"
          note={customBands ? 'Kolom sebaran memakai batas bawaan server: ≥ 70 / 50–69 / < 50.' : 'Sebaran: tercapai / cukup / belum.'}
        >
          <CplStatsTable stats={stats} thresholds={thresholds} />
        </ReportSection>
      )}

      {info && info.distribusi_angkatan.length > 0 && (
        <ReportSection title="Mahasiswa per angkatan">
          <table className="data-table max-w-sm">
            <thead>
              <tr>
                <th scope="col">Angkatan</th>
                <th scope="col" className="text-right">Mahasiswa</th>
              </tr>
            </thead>
            <tbody>
              {info.distribusi_angkatan.map((a) => (
                <tr key={String(a.angkatan)}>
                  <td className="num">{a.angkatan}</td>
                  <td className="num text-right">{a.jumlah}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ReportSection>
      )}

      <SignatureBlock />
    </>
  );
}

/* ── Tabel statistik CPL (dipakai laporan semester & prodi) ────────────── */

function CplStatsTable({ stats, thresholds }: { stats: CPLStat[]; thresholds: Thresholds }) {
  return (
    <>
    <div className="overflow-x-auto">
      <table className="data-table min-w-[720px]">
        <thead>
          <tr>
            <th scope="col" className="w-[64px]">CPL</th>
            <th scope="col">Deskripsi</th>
            <th scope="col" className="w-[44px] text-right">n</th>
            <th scope="col" className="w-[150px]">Rata-rata</th>
            <th scope="col" className="w-[96px] text-right">Min–maks</th>
            <th scope="col" className="w-[150px]">Sebaran</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => {
            const n = s.jumlah_mahasiswa;
            const avg = n ? s.rata_nilai : null;
            const parts = [
              { k: 'tercapai', v: s.kategori_tinggi },
              { k: 'cukup', v: s.kategori_sedang },
              { k: 'belum', v: s.kategori_rendah },
            ] as const;
            return (
              <tr key={s.kode_cpl}>
                <td className="code">{s.kode_cpl}</td>
                <td className="text-[13px] text-ink-700">{s.deskripsi}</td>
                <td className="num text-right">{n}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <span className="num w-9 text-right font-semibold">{fmt1(avg)}</span>
                    <ScoreBar value={avg} thresholds={thresholds} className="flex-1" />
                  </div>
                </td>
                <td className="num text-right text-ink-600">{n ? `${fmt1(s.min_nilai)}–${fmt1(s.max_nilai)}` : '—'}</td>
                <td>
                  {n ? (
                    <div>
                      <div className="flex h-2 overflow-hidden rounded-full bg-ink-100" aria-hidden>
                        {parts.map((p) => (
                          <div key={p.k} style={{ width: `${(p.v / n) * 100}%`, background: STATUS_HEX[p.k] }} />
                        ))}
                      </div>
                      <p className="num mt-1 text-[11.5px] text-ink-500">
                        {s.kategori_tinggi} / {s.kategori_sedang} / {s.kategori_rendah}
                      </p>
                    </div>
                  ) : (
                    <span className="text-ink-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    <p data-html2canvas-ignore className="mt-2 text-[12px] text-ink-500 sm:hidden">
      Geser tabel ke samping untuk melihat semua kolom.
    </p>
    </>
  );
}

function ReportSkeleton() {
  return (
    <div className="space-y-4" aria-busy>
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="mt-6 h-48 w-full" />
    </div>
  );
}
