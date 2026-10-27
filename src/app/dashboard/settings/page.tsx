'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { currentTahunAjaran, saveConfig, useConfig, validThresholds, type SimConfig } from '@/lib/config';
import { STATUS_HEX } from '@/lib/status';
import { Field, PageHeader } from '@/components/sim/ui';

export default function PengaturanPage() {
  const config = useConfig();
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  return (
    <>
      <PageHeader title="Pengaturan" description="Berlaku untuk seluruh aplikasi di peramban ini: status capaian, impor nilai, dan laporan." />
      <SettingsForm
        key={JSON.stringify(config)}
        initial={config}
        savedAt={savedAt}
        onSave={(next) => {
          saveConfig(next);
          setSavedAt(new Date());
        }}
      />
    </>
  );
}

function tahunOptions(current: string): string[] {
  const base = Number(currentTahunAjaran().slice(0, 4));
  const list = [-2, -1, 0, 1].map((d) => `${base + d}/${base + d + 1}`);
  return list.includes(current) ? list : [current, ...list];
}

function SettingsForm({ initial, savedAt, onSave }: { initial: SimConfig; savedAt: Date | null; onSave: (c: SimConfig) => void }) {
  const router = useRouter();
  const [draft, setDraft] = useState<SimConfig>(initial);
  const [confirmReset, setConfirmReset] = useState(false);

  const set = <K extends keyof SimConfig>(key: K, value: SimConfig[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

  const t = Number(draft.batasTercapai);
  const c = Number(draft.batasCukup);
  const thresholdError = !Number.isFinite(t) || !Number.isFinite(c)
    ? 'Isi kedua batas dengan angka.'
    : t > 100 || c < 0
      ? 'Batas harus di antara 0 dan 100.'
      : c >= t
        ? 'Batas cukup harus lebih kecil dari batas tercapai.'
        : null;

  const resetAll = () => {
    localStorage.clear();
    document.cookie = 'simcpl_token=; path=/; max-age=0';
    router.push('/login');
  };

  return (
    <form
      className="space-y-6 pb-24"
      onSubmit={(e) => {
        e.preventDefault();
        if (!thresholdError && validThresholds(t, c)) onSave({ ...draft, batasTercapai: t, batasCukup: c });
      }}
      noValidate
    >
      <SettingsSection
        title="Status capaian CPL"
        description="Dipakai di Ringkasan, Input Nilai, dan Laporan untuk menentukan status setiap nilai CPL."
      >
        <div className="grid max-w-md grid-cols-2 gap-4">
          <Field label="Tercapai jika nilai ≥" htmlFor="batas-tercapai">
            <input
              id="batas-tercapai"
              type="number"
              inputMode="numeric"
              min={1}
              max={100}
              value={draft.batasTercapai}
              onChange={(e) => set('batasTercapai', e.target.value === '' ? NaN : Number(e.target.value))}
              aria-invalid={thresholdError ? true : undefined}
              aria-describedby={thresholdError ? 'batas-error' : undefined}
              className="control num"
            />
          </Field>
          <Field label="Cukup jika nilai ≥" htmlFor="batas-cukup">
            <input
              id="batas-cukup"
              type="number"
              inputMode="numeric"
              min={0}
              max={99}
              value={draft.batasCukup}
              onChange={(e) => set('batasCukup', e.target.value === '' ? NaN : Number(e.target.value))}
              aria-invalid={thresholdError ? true : undefined}
              aria-describedby={thresholdError ? 'batas-error' : undefined}
              className="control num"
            />
          </Field>
        </div>
        {thresholdError ? (
          <p id="batas-error" className="mt-2 text-[12.5px] text-bad-fg">
            {thresholdError}
          </p>
        ) : (
          <ThresholdScale tercapai={t} cukup={c} />
        )}
      </SettingsSection>

      <SettingsSection title="Tahun ajaran" description="Dicatat bersama nilai yang diinput atau diimpor, dan dicetak di kop laporan.">
        <Field label="Tahun ajaran berjalan" htmlFor="tahun-ajaran" className="max-w-[220px]">
          <select id="tahun-ajaran" value={draft.tahunAjaran} onChange={(e) => set('tahunAjaran', e.target.value)} className="control">
            {tahunOptions(draft.tahunAjaran).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </Field>
      </SettingsSection>

      <SettingsSection
        title="Penandatangan laporan"
        description={
          <>
            Muncul di blok pengesahan setiap laporan PDF.{' '}
            <Link href="/dashboard/laporan" className="underline underline-offset-2">
              Lihat di Laporan
            </Link>
          </>
        }
      >
        <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
          <fieldset className="space-y-3">
            <legend className="mb-2 text-[13.5px] font-semibold">Dekan Fakultas Teknik</legend>
            <Field label="Nama lengkap dan gelar" htmlFor="nama-dekan">
              <input id="nama-dekan" autoComplete="off" value={draft.namaDekan} onChange={(e) => set('namaDekan', e.target.value)} placeholder="mis. Dr. Ir. Nama Lengkap, S.T., M.T." className="control" />
            </Field>
            <Field label="NBM / NIDN" htmlFor="nip-dekan">
              <input id="nip-dekan" autoComplete="off" inputMode="numeric" value={draft.nipDekan} onChange={(e) => set('nipDekan', e.target.value)} className="control num" />
            </Field>
          </fieldset>
          <fieldset className="space-y-3">
            <legend className="mb-2 text-[13.5px] font-semibold">Ketua Program Studi</legend>
            <Field label="Nama lengkap dan gelar" htmlFor="nama-kaprodi">
              <input id="nama-kaprodi" autoComplete="off" value={draft.namaKaprodi} onChange={(e) => set('namaKaprodi', e.target.value)} className="control" />
            </Field>
            <Field label="NBM / NIDN" htmlFor="nip-kaprodi">
              <input id="nip-kaprodi" autoComplete="off" inputMode="numeric" value={draft.nipKaprodi} onChange={(e) => set('nipKaprodi', e.target.value)} className="control num" />
            </Field>
          </fieldset>
        </div>
      </SettingsSection>

      <SettingsSection title="Atur ulang" description="Menghapus pengaturan dan sesi yang tersimpan di peramban ini, lalu kembali ke halaman masuk. Nilai di server tidak terhapus.">
        {!confirmReset ? (
          <button type="button" className="btn btn-danger" onClick={() => setConfirmReset(true)}>
            Atur ulang dan keluar…
          </button>
        ) : (
          <div role="alertdialog" aria-labelledby="reset-q" className="flex flex-wrap items-center gap-3 rounded-md border border-bad/30 bg-bad-bg px-3 py-2.5">
            <p id="reset-q" className="text-[13.5px] text-bad-fg">
              Pengaturan dan penandatangan akan kembali kosong. Lanjutkan?
            </p>
            <div className="flex gap-2">
              <button type="button" className="btn btn-sm bg-bad text-white hover:bg-bad-fg" onClick={resetAll} autoFocus>
                Ya, atur ulang
              </button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setConfirmReset(false)}>
                Batal
              </button>
            </div>
          </div>
        )}
      </SettingsSection>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white print:hidden">
        <div className="mx-auto flex h-16 max-w-page items-center justify-end gap-4 px-4 sm:px-6">
          <p className="text-[13px] text-ink-600" role="status">
            {dirty ? (
              'Ada perubahan yang belum disimpan.'
            ) : savedAt ? (
              <span className="inline-flex items-center gap-1.5 text-ok-fg">
                <Check className="size-4" aria-hidden /> Tersimpan pukul {savedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            ) : null}
          </p>
          {dirty && (
            <button type="button" className="btn btn-ghost" onClick={() => setDraft(initial)}>
              Batalkan
            </button>
          )}
          <button type="submit" className="btn btn-primary" disabled={!dirty || !!thresholdError}>
            Simpan perubahan
          </button>
        </div>
      </div>
    </form>
  );
}

function SettingsSection({ title, description, children }: { title: string; description?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="sheet grid gap-4 p-5 md:grid-cols-[260px_minmax(0,1fr)] md:gap-8">
      <div>
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {description && <p className="mt-1 text-[13px] text-ink-600">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

/** Skala 0–100 yang memperlihatkan arti kedua batas secara langsung. */
function ThresholdScale({ tercapai, cukup }: { tercapai: number; cukup: number }) {
  const parts = [
    { label: 'Belum tercapai', from: 0, to: cukup, color: STATUS_HEX.belum },
    { label: 'Cukup', from: cukup, to: tercapai, color: STATUS_HEX.cukup },
    { label: 'Tercapai', from: tercapai, to: 100, color: STATUS_HEX.tercapai },
  ];
  return (
    <div className="mt-4 max-w-xl" aria-hidden>
      <div className="flex h-2 overflow-hidden rounded-full">
        {parts.map((p) => (
          <div key={p.label} style={{ width: `${p.to - p.from}%`, background: p.color }} />
        ))}
      </div>
      <div className="relative mt-1.5 h-4 text-[11.5px] text-ink-500">
        <span className="num absolute left-0">0</span>
        <span className="num absolute -translate-x-1/2" style={{ left: `${cukup}%` }}>
          {cukup}
        </span>
        <span className="num absolute -translate-x-1/2" style={{ left: `${tercapai}%` }}>
          {tercapai}
        </span>
        <span className="num absolute right-0">100</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-ink-700">
        {parts.map((p) => (
          <span key={p.label} className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: p.color }} />
            {p.label} <span className="num text-ink-500">{p.label === 'Tercapai' ? `≥ ${p.from}` : p.from === 0 ? `< ${p.to}` : `${p.from}–${p.to - 1}`}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
