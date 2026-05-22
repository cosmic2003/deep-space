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
  description: "Real-time dashboard for rocket launches, semiconductor, and AI events.",
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
