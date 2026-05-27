import { LaunchCard } from "@/components/LaunchCard";
import { SpaceDigestSection } from "@/components/SpaceDigestSection";
import { Starfield } from "@/components/Starfield";
import type { Launch } from "@/lib/sources/launchLibrary";
import type { SpaceDigest } from "@/lib/space/digest";

interface Props {
  launches: Launch[];
  digest: SpaceDigest | null;
}

export function AerospaceSector({ launches, digest }: Props) {
  const imminent = launches.filter((l) => {
    const h = (new Date(l.net).getTime() - Date.now()) / 3_600_000;
    return h > 0 && h < 6;
  }).length;

  return (
    <div className="aero-scope aero-bg min-h-screen">
      <Starfield />
      <main className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <section className="mb-6 sm:mb-8">
          <div className="flex items-end justify-between gap-3 sm:gap-6 mb-1 flex-wrap">
            <div>
              <p className="aero-eyebrow mb-2">Aerospace</p>
              <h2 className="aero-title-gradient text-2xl sm:text-3xl font-semibold tracking-tight">
                다가오는 발사
              </h2>
            </div>
            <div className="hidden md:block">
              <StatusLegend />
            </div>
            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-mono font-medium tabular-nums text-zinc-100">
                {launches.length}
              </div>
              <div className="text-[11px] text-[var(--aero-text-muted)] uppercase tracking-wider">
                upcoming
              </div>
            </div>
          </div>

          <div className="md:hidden mt-4">
            <StatusLegend />
          </div>

          {imminent > 0 && (
            <div className="mt-4 sm:mt-5 inline-flex items-center gap-2 sm:gap-2.5 rounded-full bg-red-500/10 px-3 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base font-semibold text-red-300 ring-1 ring-inset ring-red-500/30 backdrop-blur">
              <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-red-400 animate-pulse" />
              <span className="font-mono tabular-nums text-red-200">{imminent}</span>
              <span>개 발사 임박</span>
              <span className="text-red-400/70 font-normal">· 6시간 이내</span>
            </div>
          )}
        </section>

        {launches.length === 0 ? (
          <div className="aero-glass rounded-2xl p-10 text-center">
            <p className="text-[var(--aero-text-secondary)] text-sm">발사 데이터를 불러올 수 없습니다.</p>
            <p className="text-[var(--aero-text-muted)] text-xs mt-1">잠시 후 다시 시도해주세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {launches.map((l) => (
              <LaunchCard key={l.id} launch={l} />
            ))}
          </div>
        )}

        {digest && <SpaceDigestSection digest={digest} />}

        <footer className="mt-10 sm:mt-16 pt-6 border-t border-[var(--aero-glass-border)] text-xs text-[var(--aero-text-muted)] flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <span>
            데이터:{" "}
            <a href="https://thespacedevs.com/llapi" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--aero-accent)] transition-colors">
              Launch Library 2
            </a>
          </span>
          <span>5분마다 자동 갱신</span>
        </footer>
      </main>
    </div>
  );
}

function StatusLegend() {
  const items = [
    { code: "GO", desc: "발사 확정", dot: "#34d399" },
    { code: "TBC", desc: "잠정 확정", dot: "#fbbf24" },
    { code: "TBD", desc: "발사일 미정", dot: "#a1a1aa" },
    { code: "Hold", desc: "발사 보류", dot: "#f87171" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 self-end">
      {items.map((it) => (
        <span key={it.code} className="aero-pill">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: it.dot }} />
          <span className="text-xs font-bold tracking-wide text-white">{it.code}</span>
          <span className="text-xs text-[var(--aero-text-secondary)]">{it.desc}</span>
        </span>
      ))}
    </div>
  );
}
