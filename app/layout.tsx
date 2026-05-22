import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SoundToggle } from "@/components/SoundToggle";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Deep Space — Aerospace & Tech Hub",
  description:
    "로켓 발사·AI·반도체 산업의 최신 소식을 한곳에서 보는 실시간 대시보드.",
  openGraph: {
    title: "Deep Space — Aerospace & Tech Hub",
    description:
      "로켓 발사·AI·반도체 산업의 최신 소식을 한곳에서 보는 실시간 대시보드.",
    type: "website",
    locale: "ko_KR",
    siteName: "Deep Space",
  },
  twitter: {
    card: "summary_large_image",
    title: "Deep Space — Aerospace & Tech Hub",
    description:
      "로켓 발사·AI·반도체 산업의 최신 소식을 한곳에서 보는 실시간 대시보드.",
  },
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#202124] text-zinc-100">
        <div className="relative z-10">
          {children}
          {modal}
        </div>
        <SoundToggle />
      </body>
    </html>
  );
}
