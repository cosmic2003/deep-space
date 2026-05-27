import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { SoundToggle } from "@/components/SoundToggle";
import { SectorCarouselClient } from "@/components/SectorCarouselClient";
import { AerospaceSector } from "@/components/sectors/AerospaceSector";
import { AiSector } from "@/components/sectors/AiSector";
import { SemiconductorSector } from "@/components/sectors/SemiconductorSector";
import { getUpcomingLaunches } from "@/lib/sources/launchLibrary";
import { getLatestSpaceDigest } from "@/lib/space/digest";
import "./globals.css";

export const revalidate = 300;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://deep-space-umber-gamma.vercel.app"),
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

export default async function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  const [launches, digest] = await Promise.all([
    getUpcomingLaunches(12),
    getLatestSpaceDigest(),
  ]);

  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#202124] text-zinc-100">
        <Suspense fallback={<>{children}{modal}</>}>
          <SectorCarouselClient
            aerospace={<AerospaceSector launches={launches} digest={digest} />}
            ai={<AiSector />}
            semiconductor={<SemiconductorSector />}
            modal={modal}
          >
            {children}
          </SectorCarouselClient>
        </Suspense>
        <SoundToggle />
      </body>
    </html>
  );
}
