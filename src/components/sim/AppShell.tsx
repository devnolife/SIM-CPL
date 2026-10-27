'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Ringkasan' },
  { href: '/dashboard/input-nilai', label: 'Input Nilai' },
  { href: '/dashboard/laporan', label: 'Laporan' },
  { href: '/dashboard/manajemen', label: 'Data & Import' },
  { href: '/dashboard/settings', label: 'Pengaturan' },
];

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO === '1';

function isActive(pathname: string, href: string) {
  return href === '/dashboard' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function Wordmark({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className="flex items-baseline gap-2">
      <span className={cn('text-[15px] font-semibold tracking-tight', inverse ? 'text-white' : 'text-ink-950')}>
        SIM<span className={inverse ? 'text-brand-bright' : 'text-brand'}>·</span>CPL
      </span>
      <span className={cn('hidden text-[12px] sm:inline', inverse ? 'text-ink-300' : 'text-ink-500')}>Fakultas Teknik Unismuh</span>
    </span>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'simcpl_token=; path=/; max-age=0';
    router.push('/login');
  };

  return (
    <div className="min-h-screen">
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-ink-900"
      >
        Lewati ke konten
      </a>

      <header className="sticky top-0 z-40 bg-ink-950 text-white print:hidden">
        <div className="mx-auto flex h-14 max-w-page items-center gap-6 px-4 sm:px-6">
          <Link href="/dashboard" className="shrink-0 rounded-sm">
            <Wordmark inverse />
          </Link>

          <nav aria-label="Navigasi utama" className="hidden h-full items-stretch gap-1 md:flex">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative flex items-center px-3 text-[13.5px] transition-colors',
                    active ? 'font-medium text-white' : 'text-ink-300 hover:text-white',
                  )}
                >
                  {item.label}
                  {active && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-brand-bright" aria-hidden />}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {IS_DEMO && (
              <span
                title="Aplikasi berjalan dengan mock-server.cjs. Nilai berasal dari Data-Example, bukan database kampus."
                className="hidden rounded border border-white/15 px-2 py-0.5 text-[12px] text-ink-200 sm:inline"
              >
                Data contoh
              </span>
            )}
            <span className="hidden text-[13px] text-ink-300 lg:inline">Kaprodi</span>
            <button type="button" onClick={logout} className="btn btn-sm hidden text-ink-200 hover:bg-white/10 hover:text-white md:inline-flex">
              <LogOut aria-hidden />
              Keluar
            </button>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="menu-seluler"
              className="btn btn-sm text-ink-100 hover:bg-white/10 md:hidden"
            >
              {open ? <X aria-hidden /> : <Menu aria-hidden />}
              <span className="sr-only">{open ? 'Tutup menu' : 'Buka menu'}</span>
            </button>
          </div>
        </div>

        {open && (
          <nav id="menu-seluler" aria-label="Navigasi utama" className="border-t border-white/10 px-4 pb-3 pt-2 md:hidden">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-10 items-center rounded-md px-3 text-[14px]',
                    active ? 'bg-white/10 font-medium text-white' : 'text-ink-300 hover:text-white',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <button type="button" onClick={logout} className="flex h-10 w-full items-center gap-2 rounded-md px-3 text-[14px] text-ink-300 hover:text-white">
              <LogOut className="size-4" aria-hidden /> Keluar
            </button>
          </nav>
        )}
      </header>

      <main id="konten" className="mx-auto max-w-page px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
        {children}
      </main>
    </div>
  );
}
