import { redirect } from 'next/navigation';

// Halaman pembersih localStorage versi lama. Data kini tersimpan di server;
// pengaturan lokal diatur ulang dari Pengaturan → Atur ulang.
export default function ClearDataPage() {
  redirect('/dashboard/settings');
}
