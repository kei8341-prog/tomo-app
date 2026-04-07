import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const zenKaku = Zen_Kaku_Gothic_New({
  variable: "--font-zen-kaku",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Tomo — 夫婦カレンダー",
  description: "2人で使う、予定とタスクの共有アプリ",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${cormorant.variable} ${zenKaku.variable}`}>
      <body className="min-h-screen bg-cream text-charcoal">{children}</body>
    </html>
  );
}
