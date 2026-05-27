"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

type Section = "aerospace" | "ai" | "semiconductor";

const NAV = [
  { key: "aerospace" as Section, label: "항공우주", href: "/" },
  { key: "ai" as Section, label: "AI", href: "/ai" },
  { key: "semiconductor" as Section, label: "반도체", href: "/semiconductor" },
];

function pathToSection(pathname: string): Section {
  if (pathname.startsWith("/ai")) return "ai";
  if (pathname.startsWith("/semiconductor")) return "semiconductor";
  return "aerospace";
}

export function HeaderNavClient() {
  const pathname = usePathname();
  const [active, setActive] = useState<Section>(() => pathToSection(pathname));

  useEffect(() => {
    // pushState 기반 캐러셀 스와이프 이벤트
    const onSector = (e: Event) => {
      setActive(pathToSection((e as CustomEvent<string>).detail));
    };
    // 브라우저 뒤로/앞으로
    const onPop = () => setActive(pathToSection(window.location.pathname));

    window.addEventListener("sectorchange", onSector);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("sectorchange", onSector);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  // Next.js router.push 로 이동했을 때 (헤더 클릭 등)
  useEffect(() => {
    setActive(pathToSection(pathname));
  }, [pathname]);

  return (
    <nav className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium shrink-0 ml-auto md:ml-0">
      {NAV.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={
            active === item.key
              ? "rounded-lg bg-zinc-900 px-3 py-1.5 sm:px-4 sm:py-2 text-zinc-50 ring-1 ring-inset ring-zinc-800"
              : "rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60 transition-colors"
          }
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
