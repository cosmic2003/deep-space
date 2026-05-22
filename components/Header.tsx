import Image from "next/image";
import Link from "next/link";
import { getUpcomingLaunches } from "@/lib/sources/launchLibrary";
import { RocketTrack } from "./RocketTrack";

export type Section = "aerospace" | "semiconductor" | "ai";

const NAV: Array<{ key: Section; label: string; href: string }> = [
  { key: "aerospace", label: "항공우주", href: "/" },
  { key: "semiconductor", label: "반도체", href: "/semiconductor" },
  { key: "ai", label: "AI", href: "/ai" },
];

interface Props {
  active?: Section;
}

export async function Header({ active = "aerospace" }: Props) {
  // Fetch is cached at the lib level (5min revalidate), so this doesn't
  // multi-fire across pages within a single revalidate window.
  let nextLaunchIso: string | null = null;
  try {
    const launches = await getUpcomingLaunches(1);
    nextLaunchIso = launches[0]?.net ?? null;
  } catch {
    // Network blip — just skip the rocket track this render.
  }

  return (
    <header className="border-b border-zinc-900/80 bg-zinc-950/85 backdrop-blur-md sticky top-0 z-20">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-6 flex items-center gap-3 sm:gap-6">
        <Link href="/" className="group flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl overflow-hidden ring-1 ring-inset ring-white/10 shadow-lg shadow-sky-500/20 transition-shadow group-hover:shadow-sky-500/40">
            <Image
              src="/logo.png"
              alt="Deep Space"
              width={44}
              height={44}
              priority
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-bold tracking-tight text-zinc-50 leading-tight">
              Deep Space
            </h1>
            <p className="hidden sm:block text-xs text-zinc-400 uppercase tracking-[0.18em] font-medium">
              Aerospace & Tech Hub
            </p>
          </div>
        </Link>

        {/* Rocket countdown — hidden on small screens (no room) */}
        {nextLaunchIso && (
          <div className="hidden md:block flex-1 max-w-xl mx-auto px-4">
            <RocketTrack targetIso={nextLaunchIso} />
          </div>
        )}

        <nav className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium shrink-0 ml-auto md:ml-0">
          {NAV.map((item) => {
            const isActive = item.key === active;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={
                  isActive
                    ? "rounded-lg bg-zinc-900 px-3 py-1.5 sm:px-4 sm:py-2 text-zinc-50 ring-1 ring-inset ring-zinc-800"
                    : "rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60 transition-colors"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
