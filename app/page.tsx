import { Header } from "@/components/Header";
import { LaunchCard } from "@/components/LaunchCard";
import { Starfield } from "@/components/Starfield";
import { getUpcomingLaunches } from "@/lib/sources/launchLibrary";

export const revalidate = 300;

export default async function Home() {
  const launches = await getUpcomingLaunches(12);
  const imminent = launches.filter((l) => {
    const h = (new Date(l.net).getTime() - Date.now()) / 3_600_000;
    return h > 0 && h < 6;
  }).length;

  return (
    <div className="min-h-screen">
      <Starfield />
      <Header active="aerospace" />

      <main className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <section className="mb-6 sm:mb-8">
          <div className="flex items-end justify-between gap-3 sm:gap-6 mb-1 flex-wrap">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-400 mb-2">
                Aerospace
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-50">
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
              <div className="text-xs text-zinc-500 uppercase tracking-wider">
                upcoming
              </div>
            </div>
          </div>

          <div className="md:hidden mt-4">
            <StatusLegend />
          </div>

          {imminent > 0 && (
            <div className="mt-4 sm:mt-5 inline-flex items-center gap-2 sm:gap-2.5 rounded-full bg-red-500/10 px-3 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base font-semibold text-red-300 ring-1 ring-inset ring-red-500/30">
              <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-red-400 animate-pulse" />
              <span className="font-mono tabular-nums text-red-200">{imminent}</span>
              <span>개 발사 임박</span>
              <span className="text-red-400/70 font-normal">· 6시간 이내</span>
            </div>
          )}
        </section>

        {launches.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {launches.map((l) => (
              <LaunchCard key={l.id} launch={l} />
            ))}
          </div>
        )}

        <footer className="mt-10 sm:mt-16 pt-6 border-t border-zinc-900 text-xs text-zinc-600 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <span>
            데이터:{" "}
            <a
              href="https://thespacedevs.com/llapi"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-400 transition-colors"
            >
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
    { code: "GO", desc: "발사 확정", dot: "bg-emerald-400", text: "text-emerald-300", ring: "ring-emerald-500/30" },
    { code: "TBC", desc: "잠정 확정", dot: "bg-amber-400", text: "text-amber-300", ring: "ring-amber-500/30" },
    { code: "TBD", desc: "발사일 미정", dot: "bg-zinc-400", text: "text-zinc-200", ring: "ring-zinc-600/40" },
    { code: "Hold", desc: "발사 보류", dot: "bg-red-400", text: "text-red-300", ring: "ring-red-500/30" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 self-end">
      {items.map((it) => (
        <span
          key={it.code}
          className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-zinc-900/70 px-2.5 sm:px-3 py-1.5 sm:py-2 ring-1 ring-inset ${it.ring}`}
        >
          <span className={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full ${it.dot}`} />
          <span className={`text-xs sm:text-sm font-bold tracking-wide ${it.text}`}>
            {it.code}
          </span>
          <span className="text-xs sm:text-sm text-zinc-200">{it.desc}</span>
        </span>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-zinc-700/60 bg-zinc-900 ring-1 ring-inset ring-white/5 p-10 text-center">
      <p className="text-zinc-400 text-sm">
        발사 데이터를 불러올 수 없습니다.
      </p>
      <p className="text-zinc-600 text-xs mt-1">
        잠시 후 다시 시도해주세요.
      </p>
    </div>
  );
}
