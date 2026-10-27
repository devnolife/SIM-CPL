'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Wordmark } from '@/components/sim/AppShell';
import { Notice } from '@/components/sim/ui';

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO === '1';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Halaman masuk selalu memulai sesi baru.
  useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'simcpl_token=; path=/; max-age=0';
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError('Isi username dan kata sandi.');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    // Autentikasi masih memakai akun kaprodi bawaan (belum ada endpoint login di backend).
    if (username.trim() === 'kaprodi' && password === 'kaprodi123') {
      const token = 'secure-mock-token-kaprodi-access-granted';
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ id_user: 99, nama: 'Kaprodi', role: 'kaprodi', id_prodi: 1 }));
      document.cookie = `simcpl_token=${token}; path=/; max-age=86400; SameSite=Lax`;
      router.push('/dashboard');
      return;
    }
    setError('Username atau kata sandi tidak sesuai.');
    setLoading(false);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="hidden flex-col justify-between bg-ink-950 p-10 text-white lg:flex">
        <Link href="/" className="w-fit rounded-sm">
          <Wordmark inverse />
        </Link>
        <div className="max-w-md">
          <p className="text-[28px] font-semibold leading-tight tracking-[-0.01em]">
            Capaian pembelajaran lulusan, dari nilai mata kuliah sampai laporan akreditasi.
          </p>
          <p className="mt-4 text-[15px] text-ink-300">
            Sistem Informasi CPL untuk program studi di Fakultas Teknik Universitas Muhammadiyah Makassar.
          </p>
        </div>
        <p className="text-[12.5px] text-ink-400">Dikembangkan oleh hacklab · COCONUT Computer Club</p>
      </aside>

      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-[380px]">
          <Link href="/" className="mb-10 inline-block rounded-sm lg:hidden">
            <Wordmark />
          </Link>
          <h1 className="text-[24px] font-semibold tracking-[-0.01em]">Masuk</h1>
          <p className="mt-1 text-[14px] text-ink-600">Gunakan akun kaprodi atau admin prodi Anda.</p>

          <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
            <div>
              <label htmlFor="username" className="label">
                Username atau NIDN
              </label>
              <input
                id="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="control h-10"
                aria-invalid={error ? true : undefined}
              />
            </div>
            <div>
              <label htmlFor="password" className="label">
                Kata sandi
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="control h-10 pr-11"
                  aria-invalid={error ? true : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-md text-ink-500 hover:text-ink-900"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                </button>
              </div>
            </div>

            {error && <Notice tone="error">{error}</Notice>}

            <button type="submit" disabled={loading} className="btn btn-primary h-10 w-full">
              {loading && <Loader2 className="animate-spin" aria-hidden />}
              {loading ? 'Memeriksa…' : 'Masuk'}
            </button>
          </form>

          <p className="mt-6 text-[13px] text-ink-600">Lupa kata sandi? Hubungi admin program studi Anda.</p>

          {IS_DEMO && (
            <div className="mt-8 rounded-md border border-line bg-white px-4 py-3 text-[13px] text-ink-700">
              <p>
                Mode data contoh. Akun: <span className="code">kaprodi</span> / <span className="code">kaprodi123</span>
              </p>
              <button
                type="button"
                className="mt-2 text-[13px] font-medium text-ink-900 underline underline-offset-2"
                onClick={() => {
                  setUsername('kaprodi');
                  setPassword('kaprodi123');
                  setError(null);
                }}
              >
                Isi otomatis
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
