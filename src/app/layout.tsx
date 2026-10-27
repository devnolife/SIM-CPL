import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

// IBM Plex: satu keluarga untuk teks antarmuka (Sans) dan identitas data seperti
// kode CPL/MK/CPMK dan NIM (Mono). Angka memakai tabular figures lewat kelas .num.
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SIM-CPL · Fakultas Teknik Unismuh",
  description: "Sistem Informasi Capaian Pembelajaran Lulusan, Fakultas Teknik Universitas Muhammadiyah Makassar",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
