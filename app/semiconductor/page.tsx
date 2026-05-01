import { Header } from "@/components/Header";
import { SemiCompanyCard } from "@/components/SemiCompanyCard";
import { SemiGlossary } from "@/components/SemiGlossary";
import { SemiIntroHero } from "@/components/SemiIntroHero";
import { SemiNewsItem } from "@/components/SemiNewsItem";
import { getSemiNews, TOPIC_LABELS, type Topic } from "@/lib/sources/semiNews";
import { SEMI_COMPANIES } from "@/lib/semiCompanies";

export const metadata = { title: "반도체 — Deep Space" };
export const revalidate = 600;

export default async function SemiconductorPage() {
  const news = await getSemiNews({ hours: 48 });

  // Counts by company
  const newsByCompany = new Map<string, number>();
  for (const n of news) {
    for (const c of n.companies) {
      newsByCompany.set(c, (newsByCompany.get(c) ?? 0) + 1);
    }
  }

  // Counts by topic (excl "general")
  const topicCounts = new Map<Topic, number>();
  for (const n of news) {
    for (const t of n.topics) {
      if (t === "general") continue;
      topicCounts.set(t, (topicCounts.get(t) ?? 0) + 1);
    }
  }
  const topicsRanked = Array.from(topicCounts.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <div className="min-h-screen">
      <Header active="semiconductor" />

      <div className="w-full px-6 lg:px-8 py-10 space-y-12">
        {/* Hero */}
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-400 mb-2">
            Semiconductor
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-50">
            반도체 동향
          </h2>
          <p className="text-zinc-400 mt-2 text-base">
            처음 보시는 분도 이해할 수 있게 산업 구조부터 정리했습니다. 아래 4 갈래 카드 → 핵심 기업 → 용어 → 실시간 신호 순으로 보시면 됩니다.
          </p>
        </section>

        {/* Industry structure intro */}
        <SemiIntroHero />

        {/* Companies */}
        <section>
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-300 mb-5">
            핵심 기업
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {SEMI_COMPANIES.map((c) => (
              <SemiCompanyCard
                key={c.name}
                company={c}
                newsCount={newsByCompany.get(c.name) ?? 0}
              />
            ))}
          </div>
        </section>

        {/* Glossary */}
        <SemiGlossary />

        {/* News */}
        <section>
          <div className="flex items-end justify-between mb-3 flex-wrap gap-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-300">
                실시간 신호
              </h3>
              <p className="text-xs text-zinc-500 mt-1.5">
                해외 커뮤니티(영문)에서 지난 48시간 동안 가장 많이 언급된 글. 회사·주제 태그를 보고 클릭해서 들어가세요.
              </p>
            </div>
            <span className="text-xs font-mono text-zinc-500">
              {news.length} items · 48h
            </span>
          </div>
          {topicsRanked.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mb-4">
              {topicsRanked.map(([topic, count]) => (
                <span
                  key={topic}
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-900/70 px-3.5 py-1.5 ring-1 ring-inset ring-zinc-700"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <span className="text-xs text-zinc-100 font-medium">{TOPIC_LABELS[topic]}</span>
                  <span className="text-[11px] font-mono text-zinc-400">{count}</span>
                </span>
              ))}
            </div>
          )}
          {news.length === 0 ? (
            <div className="rounded-xl border border-zinc-700/60 bg-zinc-900 ring-1 ring-inset ring-white/5 p-10 text-center">
              <p className="text-zinc-400 text-sm">최근 48시간 동안 잡힌 신호가 없습니다.</p>
              <p className="text-zinc-600 text-xs mt-1">잠시 후 다시 시도해주세요.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {news.slice(0, 30).map((n) => (
                <SemiNewsItem key={`${n.source}-${n.id}`} item={n} />
              ))}
            </div>
          )}
        </section>

        <footer className="pt-6 border-t border-zinc-900 text-xs text-zinc-600 flex items-center justify-between flex-wrap gap-2">
          <span>
            데이터:{" "}
            <a
              href="https://news.ycombinator.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-400 transition-colors"
            >
              HackerNews
            </a>
            {" · "}
            <a
              href="https://www.reddit.com/r/hardware+semiconductors"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-400 transition-colors"
            >
              Reddit
            </a>
          </span>
          <span>10분마다 자동 갱신</span>
        </footer>
      </div>
    </div>
  );
}
