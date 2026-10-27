'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
import {
  errorMessage,
  fetchCPMKByMK,
  fetchMahasiswaSummary,
  fetchMKByProdiSemester,
  fetchNilaiMK,
  importNilai,
  type CPMKMaster,
  type MahasiswaSummary,
  type MK,
} from '@/lib/simcplApi';
import { useConfig, useThresholds } from '@/lib/config';
import { fmt1, fmt2, round1, sortByKode } from '@/lib/format';
import { statusOf } from '@/lib/status';
import { useProdi } from '@/components/sim/useProdi';
import { StudentPicker } from '@/components/sim/StudentPicker';
import { EmptyState, Field, Notice, PageHeader, SEMESTERS, Select, Skeleton, StatusTag } from '@/components/sim/ui';
import { cn } from '@/lib/utils';

type Saved = { mk: string; nama: string; nilai: number; replaced: boolean };

function parseNilai(raw: string): { value: number | null; error: string | null } {
  const t = raw.trim().replace(',', '.');
  if (!t) return { value: null, error: null };
  const n = Number(t);
  if (!Number.isFinite(n)) return { value: null, error: 'Masukkan angka, mis. 78 atau 78,5.' };
  if (n < 0 || n > 100) return { value: null, error: 'Nilai harus di antara 0 dan 100.' };
  return { value: round1(n), error: null };
}

export default function InputNilaiPage() {
  const config = useConfig();
  const thresholds = useThresholds();
  const prodi = useProdi();
  const [semester, setSemester] = useState(1);

  const [students, setStudents] = useState<MahasiswaSummary[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [nim, setNim] = useState<string | null>(null);

  const [mkList, setMkList] = useState<MK[]>([]);
  const [loadingMk, setLoadingMk] = useState(false);
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [gradesVersion, setGradesVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [selectedMk, setSelectedMk] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const idProdi = prodi.selected?.id_prodi ?? null;

  // Semua mahasiswa prodi (input nilai juga untuk mahasiswa yang belum punya nilai semester ini).
  useEffect(() => {
    if (!idProdi) return;
    const ctrl = new AbortController();
    setLoadingStudents(true);
    fetchMahasiswaSummary(idProdi, { signal: ctrl.signal })
      .then((list) => {
        setStudents(list);
        setNim((cur) => (cur && list.some((s) => s.nim === cur) ? cur : list[0]?.nim ?? null));
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(errorMessage(err));
      })
      .finally(() => setLoadingStudents(false));
    return () => ctrl.abort();
  }, [idProdi]);

  useEffect(() => {
    if (!idProdi) return;
    const ctrl = new AbortController();
    setLoadingMk(true);
    setSelectedMk(null);
    fetchMKByProdiSemester(idProdi, semester, ctrl.signal)
      .then((list) => setMkList(sortByKode(list, (m) => m.kode_mk)))
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setMkList([]);
          setError(errorMessage(err));
        }
      })
      .finally(() => setLoadingMk(false));
    return () => ctrl.abort();
  }, [idProdi, semester]);

  // Nilai yang sudah tersimpan untuk mahasiswa terpilih.
  useEffect(() => {
    if (!nim) {
      setGrades({});
      return;
    }
    const ctrl = new AbortController();
    fetchNilaiMK(nim, ctrl.signal)
      .then((list) => {
        const next: Record<string, number> = {};
        list.forEach((n) => (next[n.id_mk] = n.nilai_angka));
        setGrades(next);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setGrades({});
      });
    return () => ctrl.abort();
  }, [nim, gradesVersion]);

  const student = students.find((s) => s.nim === nim) ?? null;
  const mk = mkList.find((m) => m.id_mk === selectedMk) ?? null;
  const filled = mkList.filter((m) => grades[m.id_mk] !== undefined).length;

  const choose = (id: string) => {
    setSelectedMk(id);
    // Di layar sempit editor ada di bawah daftar.
    if (window.matchMedia('(max-width: 1023px)').matches) {
      requestAnimationFrame(() => editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  };

  return (
    <>
      <PageHeader
        title="Input nilai"
        description="Masukkan nilai akhir mata kuliah satu per satu. Nilai CPMK dan CPL mahasiswa dihitung ulang setelah disimpan. Untuk banyak mahasiswa sekaligus, gunakan impor Excel."
        actions={
          <Link href="/dashboard/manajemen" className="btn btn-secondary">
            Impor dari Excel
          </Link>
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
              setNim(null);
              setStudents([]);
              setGrades({});
            }}
          >
            {prodi.list.map((p) => (
              <option key={p.id_prodi} value={p.id_prodi}>
                {p.nama_prodi}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Semester mata kuliah" htmlFor="f-semester">
          <Select id="f-semester" value={semester} onChange={(v) => setSemester(Number(v))}>
            {SEMESTERS.map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Mahasiswa" htmlFor="f-mhs" className="sm:col-span-2 lg:col-span-1">
          <StudentPicker
            id="f-mhs"
            students={students}
            value={nim}
            onChange={(v) => {
              setNim(v);
              setSelectedMk(null);
            }}
            loading={loadingStudents}
          />
        </Field>
      </div>

      {(prodi.error || error) && (
        <Notice tone="error" title="Data tidak dapat dimuat" className="mb-6">
          {prodi.error || error}
        </Notice>
      )}

      {!loadingStudents && students.length === 0 && !error ? (
        <EmptyState
          title={`Belum ada mahasiswa di ${prodi.selected?.nama_prodi ?? 'prodi ini'}`}
          action={
            <Link href="/dashboard/manajemen" className="btn btn-secondary">
              Impor data mahasiswa <ArrowRight aria-hidden />
            </Link>
          }
        >
          Mahasiswa ditambahkan melalui impor nilai dari file Excel.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section aria-labelledby="h-mk" className="sheet overflow-hidden">
            <div className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3">
              <h2 id="h-mk" className="text-[15px] font-semibold">
                Mata kuliah semester {semester}
              </h2>
              {mkList.length > 0 && student && (
                <p className="num text-[13px] text-ink-500">
                  {filled}/{mkList.length} sudah bernilai
                </p>
              )}
            </div>

            {loadingMk ? (
              <ul className="divide-y divide-line">
                {Array.from({ length: 6 }).map((_, i) => (
                  <li key={i} className="px-4 py-3">
                    <Skeleton className="h-4 w-3/4" />
                  </li>
                ))}
              </ul>
            ) : mkList.length === 0 ? (
              <p className="px-4 py-8 text-center text-[13.5px] text-ink-600">Tidak ada mata kuliah terdaftar di semester {semester}.</p>
            ) : (
              <ul className="divide-y divide-line">
                {mkList.map((m) => {
                  const nilai = grades[m.id_mk];
                  const active = m.id_mk === selectedMk;
                  return (
                    <li key={m.id_mk}>
                      <button
                        type="button"
                        onClick={() => choose(m.id_mk)}
                        aria-pressed={active}
                        disabled={!student}
                        className={cn(
                          'grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-4 py-2.5 text-left transition-colors disabled:cursor-not-allowed',
                          active ? 'bg-brand-soft/60' : 'hover:bg-ink-50',
                        )}
                      >
                        <span className="min-w-0">
                          <span className="flex items-baseline gap-2">
                            <span className="code shrink-0">{m.kode_mk}</span>
                            <span className="truncate text-[13.5px] text-ink-900">{m.nama_mk}</span>
                          </span>
                          <span className="mt-0.5 block text-[12px] text-ink-500">
                            {m.sks} SKS{m.cpl_terkait && m.cpl_terkait.length > 0 ? ` · ${m.cpl_terkait.join(', ')}` : ''}
                          </span>
                        </span>
                        <span className="text-right">
                          {nilai === undefined ? (
                            <span className="text-[12.5px] text-ink-500">belum ada</span>
                          ) : (
                            <span className="num text-[14px] font-semibold">{fmt1(nilai)}</span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <div ref={editorRef} className="scroll-mt-20">
            {mk && student ? (
              <GradeEditor
                key={`${mk.id_mk}-${student.nim}`}
                mk={mk}
                student={student}
                semester={semester}
                prodiKode={prodi.selected?.kode_prodi ?? ''}
                tahunAjaran={config.tahunAjaran}
                current={grades[mk.id_mk]}
                thresholds={thresholds}
                onSaved={() => setGradesVersion((v) => v + 1)}
              />
            ) : (
              <div className="rounded-lg border border-dashed border-line-strong px-6 py-12 text-center text-[13.5px] text-ink-600">
                {student ? 'Pilih mata kuliah di sebelah kiri untuk memasukkan nilai.' : 'Pilih mahasiswa terlebih dahulu.'}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ── Editor nilai satu MK ──────────────────────────────────────────────── */

function GradeEditor({
  mk,
  student,
  semester,
  prodiKode,
  tahunAjaran,
  current,
  thresholds,
  onSaved,
}: {
  mk: MK;
  student: MahasiswaSummary;
  semester: number;
  prodiKode: string;
  tahunAjaran: string;
  current: number | undefined;
  thresholds: { tercapai: number; cukup: number };
  onSaved: () => void;
}) {
  const [raw, setRaw] = useState(current === undefined ? '' : String(current).replace('.', ','));
  const [touched, setTouched] = useState(false);
  const [cpmk, setCpmk] = useState<CPMKMaster[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchCPMKByMK(mk.id_mk, ctrl.signal)
      .then(setCpmk)
      .catch((err) => {
        if (err.name !== 'AbortError') setCpmk([]);
      });
    return () => ctrl.abort();
  }, [mk.id_mk]);

  const { value, error } = parseNilai(raw);
  const showError = touched && error;
  const unchanged = value !== null && current !== undefined && value === current;

  // Bobot CPMK; jika belum ditentukan, dibagi rata (aturan yang sama dengan backend).
  const rows = useMemo(() => {
    if (!cpmk) return [];
    const even = cpmk.length ? 1 / cpmk.length : 0;
    return cpmk.map((c) => {
      const w = c.bobot ?? even;
      return { ...c, w, poin: value === null ? null : value * w };
    });
  }, [cpmk, value]);
  const weightsGuessed = cpmk?.some((c) => c.bobot === null) ?? false;

  const save = async () => {
    setTouched(true);
    if (value === null || error) return;
    setSaving(true);
    setSaveError(null);
    setSaved(null);
    try {
      await importNilai({
        prodiKode,
        semester,
        tahunAjaran,
        matkulList: [{ kode: mk.kode_mk, nama: mk.nama_mk, sks: mk.sks }],
        importData: [{ nim: student.nim, nama: student.nama, nilaiMap: { [mk.kode_mk]: value } }],
      });
      setSaved({ mk: mk.kode_mk, nama: student.nama, nilai: value, replaced: current !== undefined });
      onSaved();
    } catch (err) {
      setSaveError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-labelledby="h-editor" className="sheet">
      <header className="border-b border-line px-4 py-3">
        <p className="text-[13px] text-ink-500">
          {student.nama} · <span className="code text-[12px] text-ink-500">{student.nim}</span>
        </p>
        <h2 id="h-editor" className="mt-0.5 text-[15px] font-semibold">
          <span className="code mr-2 text-[14px]">{mk.kode_mk}</span>
          {mk.nama_mk}
        </h2>
      </header>

      <form
        className="space-y-5 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        noValidate
      >
        <div className="flex flex-wrap items-end gap-4">
          <Field
            label="Nilai akhir (0–100)"
            htmlFor="nilai"
            error={showError ? error : null}
            hint={current !== undefined ? `Nilai tersimpan saat ini ${fmt1(current)}.` : 'Belum ada nilai tersimpan.'}
            className="w-44"
          >
            <input
              id="nilai"
              inputMode="decimal"
              autoComplete="off"
              autoFocus
              value={raw}
              onChange={(e) => {
                setRaw(e.target.value);
                setSaved(null);
              }}
              onBlur={() => setTouched(true)}
              aria-invalid={showError ? true : undefined}
              aria-describedby={showError ? 'nilai-error' : 'nilai-hint'}
              placeholder="mis. 78,5"
              className="control num h-10 text-[16px] font-semibold"
            />
          </Field>
          {value !== null && !error && (
            <div className="pb-7">
              <StatusTag status={statusOf(value, thresholds)} />
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-[13.5px] font-semibold">Rincian per CPMK</h3>
          {cpmk === null ? (
            <Skeleton className="h-24 w-full" />
          ) : cpmk.length === 0 ? (
            <p className="text-[13px] text-ink-600">Mata kuliah ini belum memiliki CPMK; nilai hanya tercatat sebagai nilai MK.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-line">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">CPMK</th>
                    <th scope="col" className="w-[64px] text-right">
                      Bobot
                    </th>
                    <th scope="col" className="w-[64px] text-right">
                      Poin
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <span className="code">{c.kode_cpmk}</span>
                        <span className="mt-0.5 block text-[12.5px] text-ink-600">{c.deskripsi}</span>
                      </td>
                      <td className="num text-right">{Math.round(c.w * 100)}%</td>
                      <td className="num text-right font-medium">{fmt2(c.poin)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Nilai mata kuliah</td>
                    <td className="num text-right">100%</td>
                    <td className="num text-right">{fmt2(value)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
          <p className="mt-2 text-[12.5px] text-ink-500">
            Poin = nilai × bobot CPMK.{weightsGuessed && ' Sebagian bobot belum ditentukan, jadi dibagi rata.'}
            {mk.cpl_terkait && mk.cpl_terkait.length > 0 && ` Nilai ini ikut membentuk ${mk.cpl_terkait.join(', ')} semester ${semester}.`}
          </p>
        </div>

        {saveError && <Notice tone="error" title="Nilai belum tersimpan">{saveError}</Notice>}
        {saved && (
          <Notice
            tone="success"
            title={`${saved.replaced ? 'Nilai diperbarui' : 'Nilai tersimpan'}: ${saved.mk} untuk ${saved.nama} = ${fmt1(saved.nilai)}`}
            action={
              <Link href="/dashboard" className="text-[13px] font-medium underline underline-offset-2">
                Lihat profil
              </Link>
            }
          >
            Nilai CPL semester {semester} dihitung ulang · tahun ajaran {tahunAjaran}.
          </Notice>
        )}

        <div className="flex items-center gap-3 border-t border-line pt-4">
          <button type="submit" className="btn btn-primary" disabled={saving || value === null || !!error || unchanged}>
            {saving && <Loader2 className="animate-spin" aria-hidden />}
            {saving ? 'Menyimpan…' : current !== undefined ? 'Perbarui nilai' : 'Simpan nilai'}
          </button>
          {unchanged && !saved && <span className="text-[12.5px] text-ink-500">Sama dengan nilai tersimpan.</span>}
        </div>
      </form>
    </section>
  );
}
