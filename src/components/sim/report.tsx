'use client';

import Link from 'next/link';
import { useConfig } from '@/lib/config';
import { cn } from '@/lib/utils';

/** Kop dokumen laporan. */
export function ReportHeader({ title, subtitle, meta }: { title: string; subtitle?: string; meta: [string, React.ReactNode][] }) {
  const config = useConfig();
  return (
    <header className="border-b-2 border-ink-900 pb-4">
      <p className="text-[12px] font-medium text-ink-600">Fakultas Teknik · Universitas Muhammadiyah Makassar</p>
      <h2 className="mt-1 text-[20px] font-semibold leading-tight">{title}</h2>
      {subtitle && <p className="mt-0.5 text-[14px] text-ink-700">{subtitle}</p>}
      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-[13px] sm:grid-cols-4">
        {meta.map(([k, v]) => (
          <div key={k}>
            <dt className="text-ink-500">{k}</dt>
            <dd className="font-medium text-ink-900">{v}</dd>
          </div>
        ))}
        <div>
          <dt className="text-ink-500">Tahun ajaran</dt>
          <dd className="font-medium text-ink-900">{config.tahunAjaran}</dd>
        </div>
      </dl>
    </header>
  );
}

/** Blok pengesahan; nama & nomor diambil dari Pengaturan. */
export function SignatureBlock() {
  const config = useConfig();
  const tanggal = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const missing = !config.namaDekan || !config.namaKaprodi;

  return (
    <footer className="mt-10 break-inside-avoid">
      {missing && (
        <p data-html2canvas-ignore className="mb-4 rounded-md border border-dashed border-line-strong px-3 py-2 text-[12.5px] text-ink-600 print:hidden">
          Nama penandatangan belum lengkap.{' '}
          <Link href="/dashboard/settings" className="font-medium text-ink-900 underline underline-offset-2">
            Isi di Pengaturan
          </Link>
          .
        </p>
      )}
      <div className="grid grid-cols-2 gap-8 text-[13px] text-ink-900">
        <div>
          <p>Mengetahui,</p>
          <p>Dekan Fakultas Teknik</p>
          <p className={cn('mt-16 font-semibold', config.namaDekan && 'underline underline-offset-2')}>
            {config.namaDekan || '..............................'}
          </p>
          <p>NBM {config.nipDekan || '..............'}</p>
        </div>
        <div>
          <p>Makassar, {tanggal}</p>
          <p>Ketua Program Studi</p>
          <p className={cn('mt-16 font-semibold', config.namaKaprodi && 'underline underline-offset-2')}>
            {config.namaKaprodi || '..............................'}
          </p>
          <p>NBM {config.nipKaprodi || '..............'}</p>
        </div>
      </div>
    </footer>
  );
}

export function ReportSection({ title, note, children }: { title: string; note?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-8 break-inside-avoid">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-[15px] font-semibold">{title}</h3>
        {note && <p className="text-[12.5px] text-ink-500">{note}</p>}
      </div>
      {children}
    </section>
  );
}
