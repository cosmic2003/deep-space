import { Header } from "@/components/Header";
import { LaunchCard } from "@/components/LaunchCard";
import { Sidebar } from "@/components/Sidebar";
import { getUpcomingLaunches } from "@/lib/sources/launchLibrary";

export const revalidate = 300;

interface PageProps {
  searchParams: Promise<{ provider?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const { provider: selectedSlug } = await searchParams;
  const launches = await getUpcomingLaunches(12);
  const imminent = launches.filter((l) => {
    const h = (new Date(l.net).getTime() - Date.now()) / 3_600_000;
    return h > 0 && h < 6;
  }).length;

  return (
    <div className="min-h-screen">
      <Header active="aerospace" />

      <div className="w-full px-6 lg:px-8 py-10">
        <div className="lg:grid lg:grid-cols-[440px_1fr] xl:grid-cols-[500px_1fr] 2xl:grid-cols-[540px_1fr] lg:gap-8 xl:gap-10">
          <Sidebar launches={launches} selectedSlug={selectedSlug} />

          <main>
            <section className="mb-10">
              <div className="flex items-end justify-between gap-6 mb-1 flex-wrap">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-400 mb-2">
                    Aerospace
                  </p>
                  <h2 className="text-3xl font-semibold tracking-tight text-zinc-50">
                    다가오는 발사
                  </h2>
                </div>

                <StatusLegend />

                <div className="text-right">
                  <div className="text-3xl font-mono font-medium tabular-nums text-zinc-100">
                    {launches.length}
                  </div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">
                    upcoming
                  </div>
                </div>
              </div>

              {imminent > 0 && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-300 ring-1 ring-inset ring-red-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                  {imminent}개 발사 임박 (6시간 이내)
                </div>
              )}
            </section>

            {launches.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {launches.map((l) => (
                  <LaunchCard key={l.id} launch={l} />
                ))}
              </div>
            )}

            <footer className="mt-16 pt-6 border-t border-zinc-900 text-xs text-zinc-600 flex items-center justify-between">
              <span>
                데이터: <a href="https://thespacedevs.com/llapi" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 transition-colors">Launch Library 2</a>
              </span>
              <span>5분마다 자동 갱신</span>
            </footer>
          </main>
        </div>
      </div>
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
    <div className="flex items-center gap-2 self-end">
      {items.map((it) => (
        <span
          key={it.code}
          className={`inline-flex items-center gap-2.5 rounded-full bg-zinc-900/70 px-4 py-2.5 ring-1 ring-inset ${it.ring}`}
        >
          <span className={`h-3 w-3 rounded-full ${it.dot}`} />
          <span className={`text-base font-bold tracking-wide ${it.text}`}>{it.code}</span>
          <span className="text-base text-zinc-200">{it.desc}</span>
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
