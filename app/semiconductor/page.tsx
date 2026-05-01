import { Header } from "@/components/Header";
import { SemiCompanyCard } from "@/components/SemiCompanyCard";
import { SemiGlossary } from "@/components/SemiGlossary";
import { SemiIntroHero } from "@/components/SemiIntroHero";
import { SemiNewsItem } from "@/components/SemiNewsItem";
import { SemiTrendCard } from "@/components/SemiTrendCard";
import {
  getSemiNews,
  groupByTopic,
  summarizeTrends,
  TOPIC_LABELS,
  type Topic,
} from "@/lib/sources/semiNews";
import { SEMI_COMPANIES } from "@/lib/semiCompanies";

export const metadata = { title: "반도체 — Deep Space" };
export const revalidate = 600;

const TOPIC_DESC: Record<Topic, string> = {
  memory: "DRAM · HBM · NAND — AI 시대 가장 비싸지는 칩",
  process: "2nm · 3nm — 더 작고 빠른 칩 만들기 경쟁",
  equipment: "EUV 등 반도체 생산 장비 동향",
  "ai-accelerator": "AI 학습/추론 전용 칩 (NVIDIA H200, AMD MI300 등)",
  general: "기타 반도체 신호",
};

const TOPIC_ORDER: Topic[] = ["ai-accelerator", "memory", "process", "equipment", "general"];

const PER_TOPIC_LIMIT = 5;

export default async function SemiconductorPage() {
  const news = await getSemiNews({ hours: 48 });
  const trend = summarizeTrends(news);
  const grouped = groupByTopic(news);

  // Counts by company for company cards
  const newsByCompany = new Map<string, number>();
  for (const n of news) {
    for (const c of n.companies) {
      newsByCompany.set(c, (newsByCompany.get(c) ?? 0) + 1);
    }
  }

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
            처음 보시는 분도 이해할 수 있게 산업 구조부터 정리했습니다. 산업 구조 → 핵심 기업 → 용어 → 실시간 신호 순으로 보시면 됩니다.
          </p>
        </section>

        {/* Trend summary */}
        <SemiTrendCard trend={trend} />

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

        {/* News grouped by topic */}
        <section>
          <div className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-300 mb-1.5">
              주제별 핵심 신호
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              해외 커뮤니티(영문) 글을 자동 분류해서 주제별로 묶었습니다. 노란 줄이 한국어 컨텍스트 — 회사 + 어떤 종류의 뉴스인지 자동 추출.
            </p>
          </div>

          {news.length === 0 ? (
            <div className="rounded-xl border border-zinc-700/60 bg-zinc-900 ring-1 ring-inset ring-white/5 p-10 text-center">
              <p className="text-zinc-400 text-sm">최근 48시간 동안 잡힌 신호가 없습니다.</p>
              <p className="text-zinc-600 text-xs mt-1">잠시 후 다시 시도해주세요.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {TOPIC_ORDER.map((topic) => {
                const items = grouped.get(topic);
                if (!items || items.length === 0) return null;
                return (
                  <div key={topic}>
                    <div className="flex items-baseline justify-between gap-3 mb-3 pb-2 border-b border-zinc-800">
                      <div>
                        <h4 className="text-base font-bold text-amber-300 inline-block">
                          {TOPIC_LABELS[topic]}
                        </h4>
                        <span className="ml-2.5 text-xs text-zinc-500">{TOPIC_DESC[topic]}</span>
                      </div>
                      <span className="text-xs font-mono text-zinc-500 shrink-0">
                        {items.length}건
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {items.slice(0, PER_TOPIC_LIMIT).map((n) => (
                        <SemiNewsItem key={`${n.source}-${n.id}`} item={n} />
                      ))}
                    </div>
                  </div>
                );
              })}
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
