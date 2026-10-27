'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronRight } from 'lucide-react';
import {
  errorMessage,
  fetchAnalisisMK,
  fetchCPLMapping,
  fetchCPMKByMK,
  fetchMahasiswaSummary,
  fetchNilaiCPLByMahasiswa,
  type AnalisisMK,
  type CPLMappingItem,
  type CPMKMaster,
  type MahasiswaSummary,
} from '@/lib/simcplApi';
import { useThresholds } from '@/lib/config';
import { fmt1, mean, sortByKode } from '@/lib/format';
import { statusOf, rangeLabel, type CplStatus } from '@/lib/status';
import { useProdi } from '@/components/sim/useProdi';
import { StudentPicker } from '@/components/sim/StudentPicker';
import { RadarProfile } from '@/components/sim/RadarProfile';
import {
  EmptyState,
  Field,
  Notice,
  PageHeader,
  ScoreBar,
  SEMESTERS,
  Select,
  Skeleton,
  StatusTag,
} from '@/components/sim/ui';
import { cn } from '@/lib/utils';

type CplRow = { kode: string; deskripsi: string; nilai: number | null; mkCount: number; mapping: CPLMappingItem };

export default function RingkasanPage() {
  const thresholds = useThresholds();
  const prodi = useProdi();
  const [semester, setSemester] = useState(1);

  const [students, setStudents] = useState<MahasiswaSummary[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [nim, setNim] = useState<string | null>(null);

  const [mapping, setMapping] = useState<CPLMappingItem[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Pilihan pengguna hanya berlaku untuk konteks (prodi, semester, mahasiswa) saat ia memilih.
  const [picked, setPicked] = useState<{ ctx: string; kode: string } | null>(null);

  const idProdi = prodi.selected?.id_prodi ?? null;

  // Mahasiswa yang punya nilai di semester ini.
  useEffect(() => {
    if (!idProdi) return;
    const ctrl = new AbortController();
    setLoadingStudents(true);
    fetchMahasiswaSummary(idProdi, { semester, signal: ctrl.signal })
      .then((list) => {
        setStudents(list);
        setNim((cur) => (cur && list.some((s) => s.nim === cur) ? cur : list[0]?.nim ?? null));
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setStudents([]);
          setNim(null);
          setError(errorMessage(err));
        }
      })
      .finally(() => setLoadingStudents(false));
    return () => ctrl.abort();
  }, [idProdi, semester]);

  // Pemetaan CPL → MK semester ini + nilai CPL mahasiswa.
  useEffect(() => {
    if (!idProdi) return;
    const ctrl = new AbortController();
    setLoadingProfile(true);
    setError(null);
    Promise.all([
      fetchCPLMapping(idProdi, semester, ctrl.signal),
      nim ? fetchNilaiCPLByMahasiswa(nim, semester, ctrl.signal) : Promise.resolve(null),
    ])
      .then(([map, cpl]) => {
        setMapping(sortByKode(map, (m) => m.kode_cpl));
        const next: Record<string, number> = {};
        cpl?.cpl.forEach((c) => (next[c.kode_cpl] = c.nilai_angka));
        setScores(next);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(errorMessage(err));
      })
      .finally(() => setLoadingProfile(false));
    return () => ctrl.abort();
  }, [idProdi, semester, nim]);

  const rows: CplRow[] = useMemo(
    () =>
      mapping.map((m) => ({
        kode: m.kode_cpl,
        deskripsi: m.deskripsi,
        nilai: scores[m.kode_cpl] ?? null,
        mkCount: m.mk_list.length,
        mapping: m,
      })),
    [mapping, scores],
  );

  const measured = rows.filter((r) => r.nilai !== null);
  const counts = useMemo(() => {
    const c: Record<CplStatus, number> = { tercapai: 0, cukup: 0, belum: 0, kosong: 0 };
    rows.forEach((r) => c[statusOf(r.nilai, thresholds)]++);
    return c;
  }, [rows, thresholds]);

  // CPL terpilih: pilihan pengguna, atau CPL terukur dengan nilai terendah (yang paling perlu dibaca).
  const ctx = `${idProdi}|${semester}|${nim}`;
  const autoCpl = useMemo(() => {
    const lowest = rows.filter((r) => r.nilai !== null).sort((a, b) => (a.nilai ?? 0) - (b.nilai ?? 0))[0];
    return (lowest ?? rows[0])?.kode ?? null;
  }, [rows]);
  const selectedCpl = picked && picked.ctx === ctx && rows.some((r) => r.kode === picked.kode) ? picked.kode : autoCpl;
  const setSelectedCpl = (kode: string) => setPicked({ ctx, kode });

  const student = students.find((s) => s.nim === nim) ?? null;
  const selectedRow = rows.find((r) => r.kode === selectedCpl) ?? null;
  const avg = mean(measured.map((r) => r.nilai as number));
  const noMapping = !loadingProfile && rows.length > 0 && rows.every((r) => r.mkCount === 0);

  return (
    <>
      <PageHeader
        title={student ? student.nama : 'Profil capaian CPL'}
        description={
          student
            ? `NIM ${student.nim}${student.angkatan ? ` · angkatan ${student.angkatan}` : ''} · ${student.jumlah_mk} mata kuliah dinilai di semester ${semester}`
            : 'Pilih mahasiswa untuk melihat capaian setiap CPL dan mata kuliah yang menyumbangnya.'
        }
      />

      <div className="sheet mb-6 grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_200px_1.4fr]">
        <Field label="Program studi" htmlFor="f-prodi">
          <Select
            id="f-prodi"
            value={idProdi ?? ''}
            disabled={prodi.loading}
            onChange={(v) => {
              prodi.setSelectedId(Number(v));
              // Data mahasiswa milik prodi lama tidak boleh tampil di bawah prodi baru.
              setNim(null);
              setStudents([]);
              setScores({});
            }}
          >
            {prodi.list.map((p) => (
              <option key={p.id_prodi} value={p.id_prodi}>
                {p.nama_prodi}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Semester" htmlFor="f-semester">
          <Select id="f-semester" value={semester} onChange={(v) => setSemester(Number(v))}>
            {SEMESTERS.map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Mahasiswa" htmlFor="f-mhs" className="sm:col-span-2 lg:col-span-1">
          <StudentPicker id="f-mhs" students={students} value={nim} onChange={setNim} loading={loadingStudents} />
        </Field>
      </div>

      {(prodi.error || error) && (
        <Notice tone="error" title="Data tidak dapat dimuat" className="mb-6">
          {prodi.error || error}
        </Notice>
      )}

      {noMapping ? (
        <EmptyState
          title={`Belum ada mata kuliah semester ${semester} yang dipetakan ke CPL`}
          action={
            <Link href="/dashboard/manajemen" className="btn btn-secondary">
              Buka Data &amp; Import <ArrowRight aria-hidden />
            </Link>
          }
        >
          Tambahkan mata kuliah dan pemetaan CPL untuk {prodi.selected?.nama_prodi ?? 'prodi ini'}, atau pilih semester lain.
        </EmptyState>
      ) : !loadingStudents && students.length === 0 && !error ? (
        <EmptyState
          title={`Belum ada nilai mahasiswa di semester ${semester}`}
          action={
            <Link href="/dashboard/input-nilai" className="btn btn-secondary">
              Input nilai <ArrowRight aria-hidden />
            </Link>
          }
        >
          Nilai dapat dimasukkan satu per satu atau diimpor dari file Excel di halaman Data &amp; Import.
        </EmptyState>
      ) : (
        <>
          {/* Profil: jaring laba-laba + daftar CPL */}
          <section
            aria-labelledby="h-profil"
            aria-busy={loadingProfile}
            className={cn('sheet mb-6 overflow-hidden transition-opacity', loadingProfile && rows.length > 0 && 'opacity-60')}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-line px-4 py-3 sm:px-5">
              <h2 id="h-profil" className="text-[15px] font-semibold">
                Profil CPL
              </h2>
              <p className="num flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-600">
                <span>
                  Rata-rata <span className="font-semibold text-ink-900">{fmt1(avg)}</span>
                </span>
                <span>
                  {counts.tercapai} tercapai · {counts.cukup} cukup · {counts.belum} belum
                  {counts.kosong > 0 && ` · ${counts.kosong} tanpa nilai`}
                </span>
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
              <div className="flex flex-col justify-center border-b border-line p-4 lg:border-b-0 lg:border-r">
                {loadingProfile && rows.length === 0 ? (
                  <Skeleton className="mx-auto aspect-square w-full max-w-[300px] rounded-full" />
                ) : measured.length < 3 ? (
                  <p className="mx-auto max-w-[36ch] py-16 text-center text-[13.5px] text-ink-500">
                    Profil digambar bila minimal 3 CPL sudah bernilai. Semester ini baru {measured.length} CPL yang bernilai.
                  </p>
                ) : (
                  <RadarProfile
                    points={measured.map((r) => ({ kode: r.kode, nilai: r.nilai, deskripsi: r.deskripsi }))}
                    thresholds={thresholds}
                    selected={selectedCpl}
                    onSelect={setSelectedCpl}
                    className="h-[270px] sm:h-[340px]"
                  />
                )}
                <p className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[12px] text-ink-500">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-0 w-4 border-t border-dashed border-ink-700" aria-hidden />
                    Batas tercapai {thresholds.tercapai}
                  </span>
                  {counts.kosong > 0 && measured.length >= 3 && (
                    <span>
                      {rows
                        .filter((r) => r.nilai === null)
                        .map((r) => r.kode)
                        .join(', ')}{' '}
                      tidak digambar (belum bernilai)
                    </span>
                  )}
                </p>
              </div>

              <ul aria-label="Daftar CPL" className="divide-y divide-line">
                {loadingProfile && rows.length === 0
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <li key={i} className="px-4 py-3">
                        <Skeleton className="h-4 w-2/3" />
                      </li>
                    ))
                  : rows.map((r) => {
                      const status = statusOf(r.nilai, thresholds);
                      const active = r.kode === selectedCpl;
                      return (
                        <li key={r.kode}>
                          <button
                            type="button"
                            onClick={() => setSelectedCpl(r.kode)}
                            aria-pressed={active}
                            className={cn(
                              'grid w-full grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 px-4 py-2.5 text-left transition-colors sm:grid-cols-[56px_minmax(0,1fr)_120px_52px]',
                              active ? 'bg-brand-soft/60' : 'hover:bg-ink-50',
                            )}
                          >
                            <span className={cn('code col-start-1 row-start-1', active && 'font-semibold text-ink-950')}>{r.kode}</span>
                            <span className="col-start-2 row-start-1 min-w-0">
                              <span className="block truncate text-[13.5px] text-ink-800">{r.deskripsi}</span>
                              <span className="text-[12px] text-ink-500">
                                {r.mkCount === 0 ? 'Tidak ada MK di semester ini' : `${r.mkCount} MK menyumbang`}
                              </span>
                            </span>
                            <ScoreBar
                              value={r.nilai}
                              thresholds={thresholds}
                              className="col-span-3 col-start-1 row-start-2 sm:col-span-1 sm:col-start-3 sm:row-start-1"
                            />
                            <span
                              className={cn(
                                'num col-start-3 row-start-1 text-right text-[14px] font-semibold sm:col-start-4',
                                status === 'kosong' ? 'text-ink-500' : 'text-ink-900',
                              )}
                            >
                              {fmt1(r.nilai)}
                            </span>
                          </button>
                        </li>
                      );
                    })}
              </ul>
            </div>
          </section>

          {selectedRow && nim && (
            <CplTrace key={`${selectedRow.kode}-${nim}-${semester}`} row={selectedRow} nim={nim} semester={semester} />
          )}
        </>
      )}
    </>
  );
}

/* ── Penelusuran satu CPL: MK penyumbang → CPMK ────────────────────────── */

type MkDetail = { cpmk: CPMKMaster[]; analisis: AnalisisMK | null };

function CplTrace({ row, nim, semester }: { row: CplRow; nim: string; semester: number }) {
  const thresholds = useThresholds();
  const [details, setDetails] = useState<Record<string, MkDetail>>({});
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const mkList = row.mapping.mk_list;
  useEffect(() => {
    if (mkList.length === 0) {
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    Promise.all(
      mkList.map(async (mk) => {
        const [cpmk, analisis] = await Promise.all([
          fetchCPMKByMK(mk.id_mk, ctrl.signal),
          fetchAnalisisMK(nim, mk.id_mk, ctrl.signal).catch(() => null),
        ]);
        return [mk.id_mk, { cpmk, analisis }] as const;
      }),
    )
      .then((entries) => setDetails(Object.fromEntries(entries)))
      .catch((err) => {
        if (err.name !== 'AbortError') setFailed(true);
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [mkList, nim]);

  const status = statusOf(row.nilai, thresholds);
  const mkCount = mkList.length;
  const share = mkCount > 0 ? 1 / mkCount : 0;

  return (
    <section aria-labelledby="h-trace" className="sheet">
      <header className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <div className="min-w-0">
          <h2 id="h-trace" className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] font-semibold">
            <span className="code text-[14px]">{row.kode}</span>
            <StatusTag status={status} />
          </h2>
          <p className="mt-1 max-w-[70ch] text-[14px] text-ink-700">{row.deskripsi}</p>
        </div>
        <div className="shrink-0 sm:text-right">
          <p className="num text-[28px] font-semibold leading-none tracking-tight">{fmt1(row.nilai)}</p>
          <p className="mt-1 text-[12px] text-ink-500">
            {status === 'kosong' ? 'belum ada nilai' : `rentang ${rangeLabel(status, thresholds)}`}
          </p>
        </div>
      </header>

      {mkCount === 0 ? (
        <p className="px-5 py-6 text-[13.5px] text-ink-600">
          Tidak ada mata kuliah semester {semester} yang menyumbang {row.kode}. Nilai CPL ini dibentuk di semester lain.
        </p>
      ) : (
        <>
          <p className="border-b border-line bg-ink-50/60 px-4 py-2.5 text-[12.5px] text-ink-600 sm:px-5">
            Nilai {row.kode} = rata-rata nilai {mkCount} mata kuliah di bawah (bobot tiap MK 1/{mkCount}). Klik baris untuk melihat CPMK yang diukur.
          </p>
          <ul className="divide-y divide-line">
            {mkList.map((mk) => {
              const d = details[mk.id_mk];
              const nilaiMk = d?.analisis?.nilai_mk ?? null;
              const isOpen = open === mk.id_mk;
              const relevant = new Set(mk.relasi);
              return (
                <li key={mk.id_mk}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : mk.id_mk)}
                    aria-expanded={isOpen}
                    className="grid w-full grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 px-4 py-3 text-left hover:bg-ink-50 sm:grid-cols-[16px_76px_minmax(0,1fr)_140px_60px_70px] sm:px-5"
                  >
                    <ChevronRight className={cn('col-start-1 row-start-1 size-4 text-ink-400 transition-transform', isOpen && 'rotate-90')} aria-hidden />
                    <span className="code hidden sm:col-start-2 sm:row-start-1 sm:inline">{mk.kode_mk}</span>
                    <span className="col-start-2 row-start-1 min-w-0 sm:col-start-3">
                      <span className="code mr-2 sm:hidden">{mk.kode_mk}</span>
                      <span className="text-[13.5px] text-ink-900">{mk.nama_mk}</span>
                      <span className="block text-[12px] text-ink-500">
                        {mk.sks} SKS · {mk.cpmk_count} CPMK untuk {row.kode}
                      </span>
                    </span>
                    <span className="col-span-2 col-start-2 row-start-2 sm:col-span-1 sm:col-start-4 sm:row-start-1">
                      {loading ? <Skeleton className="h-1.5 w-full" /> : <ScoreBar value={nilaiMk} thresholds={thresholds} />}
                    </span>
                    <span className="num col-start-3 row-start-1 text-right text-[14px] font-semibold sm:col-start-5">
                      {loading ? '…' : fmt1(nilaiMk)}
                    </span>
                    <span className="num hidden text-right text-[12.5px] text-ink-500 sm:col-start-6 sm:row-start-1 sm:inline">
                      bobot {Math.round(share * 100)}%
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-line bg-ink-50/50 px-4 py-3 sm:pl-[52px] sm:pr-5">
                      {failed || !d ? (
                        <p className="text-[13px] text-ink-600">{loading ? 'Memuat CPMK…' : 'CPMK tidak dapat dimuat.'}</p>
                      ) : d.cpmk.length === 0 ? (
                        <p className="text-[13px] text-ink-600">Mata kuliah ini belum memiliki CPMK.</p>
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
                            {d.cpmk.map((c) => {
                              const isRel = relevant.has(c.kode_cpmk);
                              const subs = d.analisis?.cpmk.find((a) => a.kode_cpmk === c.kode_cpmk)?.sub_cpmks ?? [];
                              return (
                                <tr key={c.id} className={isRel ? '' : 'text-ink-500'}>
                                  <td>
                                    <span className={cn('code', !isRel && 'text-ink-500')}>{c.kode_cpmk}</span>
                                    {!isRel && <span className="block text-[11.5px]">untuk CPL lain</span>}
                                  </td>
                                  <td>
                                    <span className={isRel ? 'text-ink-800' : ''}>{c.deskripsi}</span>
                                    {isRel && subs.length > 0 && (
                                      <ul className="mt-1.5 space-y-0.5 text-[12.5px] text-ink-500">
                                        {subs.map((s) => (
                                          <li key={s.kode_sub_cpmk}>
                                            <span className="code text-[11.5px] text-ink-500">{s.kode_sub_cpmk}</span> {s.deskripsi}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </td>
                                  <td className="num text-right">{c.bobot === null ? '—' : `${Math.round(c.bobot * 100)}%`}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
