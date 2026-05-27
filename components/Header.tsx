import Image from "next/image";
import Link from "next/link";
import { getUpcomingLaunches } from "@/lib/sources/launchLibrary";
import { RocketTrack } from "./RocketTrack";
import { HeaderNavClient } from "./HeaderNavClient";

export async function Header() {
  let nextLaunchIso: string | null = null;
  try {
    const launches = await getUpcomingLaunches(1);
    nextLaunchIso = launches[0]?.net ?? null;
  } catch {}

  return (
    <header className="border-b border-zinc-900/80 bg-zinc-950/85 backdrop-blur-md z-20 shrink-0">
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

        {nextLaunchIso && (
          <div className="hidden md:block flex-1 max-w-xl mx-auto px-4">
            <RocketTrack targetIso={nextLaunchIso} />
          </div>
        )}

        <HeaderNavClient />
      </div>
    </header>
  );
}
