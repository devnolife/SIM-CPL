import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Wordmark } from '@/components/sim/AppShell';

const PRODI = [
  ['INF', 'S1 Teknik Informatika'],
  ['ARS', 'S1 Arsitektur'],
  ['PWK', 'S1 Perencanaan Wilayah dan Kota'],
  ['SIP', 'S1 Teknik Sipil'],
  ['ELK', 'S1 Teknik Elektro'],
];

// Contoh perhitungan dari Data-Example/contoh-import-informatika-sem1.csv.
const CONTOH = [
  ['INF101', 'Pancasila', 85],
  ['INF102', 'Bahasa Indonesia', 88],
  ['INF103', 'Pendidikan Agama Islam', 90],
] as const;

const TUGAS = [
  {
    title: 'Ringkasan',
    text: 'Profil CPL setiap mahasiswa per semester. Pilih satu CPL untuk melihat mata kuliah dan CPMK yang membentuk nilainya.',
  },
  {
    title: 'Input nilai & impor Excel',
    text: 'Masukkan nilai akhir mata kuliah satu per satu, atau impor satu file untuk satu semester. Sel yang tidak valid ditandai sebelum disimpan.',
  },
  {
    title: 'Laporan',
    text: 'Laporan per mahasiswa, per semester, dan per prodi dengan blok pengesahan dekan dan kaprodi. Unduh sebagai PDF atau Excel.',
  },
  {
    title: 'Kurikulum',
    text: 'Daftar mata kuliah, CPMK beserta bobotnya, dan CPL yang dipetakan. Bobot CPMK yang tidak berjumlah 100% ditandai.',
  },
];

export default function HomePage() {
  const cpl1 = Math.round((CONTOH.reduce((s, [, , v]) => s + v, 0) / CONTOH.length) * 10) / 10;

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-page items-center justify-between px-4 sm:px-6">
          <Wordmark />
          <Link href="/login" className="btn btn-primary">
            Masuk
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-page items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:py-24">
          <div>
            <h1 className="max-w-[18ch] text-[36px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[44px]">
              Capaian CPL mahasiswa, terhitung dari nilai mata kuliah.
            </h1>
            <p className="mt-5 max-w-[52ch] text-[16px] leading-relaxed text-ink-700">
              SIM-CPL membantu kaprodi Fakultas Teknik Universitas Muhammadiyah Makassar memantau Capaian Pembelajaran Lulusan:
              memasukkan nilai, melihat CPL mana yang belum tercapai beserta penyebabnya, dan menyusun laporan untuk evaluasi kurikulum.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/login" className="btn btn-primary h-10 px-5">
                Masuk ke SIM-CPL <ArrowRight aria-hidden />
              </Link>
              <a href="#perhitungan" className="btn btn-ghost h-10">
                Cara nilai CPL dihitung
              </a>
            </div>
          </div>

          <figure className="sheet overflow-hidden" aria-labelledby="contoh-cap">
            <div className="border-b border-line px-5 py-3">
              <p className="text-[13px] text-ink-500">Contoh · Ahmad Fauzi · Semester 1</p>
              <p className="mt-0.5 font-medium">
                <span className="code mr-2">CPL1</span>Bertakwa, beretika, dan bertanggung jawab
              </p>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Mata kuliah penyumbang</th>
                  <th scope="col" className="text-right">
                    Nilai
                  </th>
                </tr>
              </thead>
              <tbody>
                {CONTOH.map(([kode, nama, nilai]) => (
                  <tr key={kode}>
                    <td>
                      <span className="code mr-2">{kode}</span>
                      {nama}
                    </td>
                    <td className="num text-right">{nilai.toLocaleString('id-ID', { minimumFractionDigits: 1 })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>Nilai CPL1 (rata-rata)</td>
                  <td className="num text-right">{cpl1.toLocaleString('id-ID', { minimumFractionDigits: 1 })}</td>
                </tr>
              </tfoot>
            </table>
            <figcaption id="contoh-cap" className="border-t border-line px-5 py-3 text-[12.5px] text-ink-600">
              <span className="font-medium text-ok-fg">Tercapai</span> — di atas batas 70 yang ditetapkan prodi. Data dari berkas contoh
              impor di repositori.
            </figcaption>
          </figure>
        </section>

        <section id="perhitungan" className="scroll-mt-8 border-y border-line bg-canvas">
          <div className="mx-auto max-w-page px-4 py-16 sm:px-6">
            <h2 className="text-[24px] font-semibold tracking-[-0.01em]">Cara nilai CPL dihitung</h2>
            <ol className="mt-8 grid gap-8 md:grid-cols-3">
              <li>
                <p className="num text-[13px] font-medium text-ink-500">1</p>
                <h3 className="mt-1 text-[16px] font-semibold">Nilai mata kuliah masuk</h3>
                <p className="mt-2 text-[14px] text-ink-700">Dosen atau admin memasukkan nilai akhir 0–100, satu per satu atau lewat impor Excel per semester.</p>
              </li>
              <li>
                <p className="num text-[13px] font-medium text-ink-500">2</p>
                <h3 className="mt-1 text-[16px] font-semibold">CPMK menghubungkan MK ke CPL</h3>
                <p className="mt-2 text-[14px] text-ink-700">
                  Setiap mata kuliah punya CPMK berbobot, dan tiap CPMK dipetakan ke satu CPL. Dari sini sistem tahu mata kuliah mana menyumbang CPL mana.
                </p>
              </li>
              <li>
                <p className="num text-[13px] font-medium text-ink-500">3</p>
                <h3 className="mt-1 text-[16px] font-semibold">CPL dihitung per semester</h3>
                <p className="mt-2 text-[14px] text-ink-700">
                  Nilai CPL adalah rata-rata nilai mata kuliah penyumbangnya. Statusnya tercapai, cukup, atau belum menurut batas yang ditetapkan prodi.
                </p>
              </li>
            </ol>
            <p className="mt-10 max-w-[70ch] rounded-md border border-line bg-white px-4 py-3 font-mono text-[13px] text-ink-800">
              Nilai CPL = Σ(nilai MK × bobot MK) ÷ Σ bobot MK, dengan bobot MK = 1 ÷ jumlah MK penyumbang CPL tersebut.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-page gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div>
            <h2 className="text-[24px] font-semibold tracking-[-0.01em]">Yang dikerjakan di SIM-CPL</h2>
            <dl className="mt-6 divide-y divide-line border-y border-line">
              {TUGAS.map((t) => (
                <div key={t.title} className="grid gap-1 py-4 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-6">
                  <dt className="font-semibold">{t.title}</dt>
                  <dd className="text-[14px] text-ink-700">{t.text}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h2 className="text-[24px] font-semibold tracking-[-0.01em]">Program studi</h2>
            <ul className="mt-6 divide-y divide-line border-y border-line">
              {PRODI.map(([kode, nama]) => (
                <li key={kode} className="flex items-baseline gap-4 py-3">
                  <span className="code w-10">{kode}</span>
                  <span>{nama}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[13px] text-ink-500">Setiap program studi memakai 8 CPL.</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-page flex-col gap-2 px-4 py-6 text-[13px] text-ink-500 sm:flex-row sm:justify-between sm:px-6">
          <p>Fakultas Teknik · Universitas Muhammadiyah Makassar</p>
          <p>Dikembangkan oleh hacklab · COCONUT Computer Club</p>
        </div>
      </footer>
    </div>
  );
}
