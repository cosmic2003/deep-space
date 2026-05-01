import { TOPIC_LABELS, type TrendSummary } from "@/lib/sources/semiNews";
import { SEMI_COMPANIES } from "@/lib/semiCompanies";

interface Props {
  trend: TrendSummary;
}

const TOPIC_BLURB: Record<string, string> = {
  memory: "DRAM · HBM · NAND 등 메모리 칩 동향",
  process: "2nm · 3nm 등 미세 공정 양산 경쟁",
  equipment: "EUV 노광장비 등 반도체 생산 장비",
  "ai-accelerator": "AI 학습/추론 전용 칩",
  general: "기타",
};

export function SemiTrendCard({ trend }: Props) {
  const max = trend.topCompanies[0]?.count ?? 1;

  return (
    <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.06] to-zinc-900/60 ring-1 ring-inset ring-white/5 px-6 py-7 sm:px-8">
      <div className="flex items-center gap-2 mb-1">
        <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
          지금 반도체 동향
        </span>
      </div>
      <p className="text-zinc-400 text-sm mb-6">
        해외 커뮤니티(HackerNews · Reddit) 48시간 데이터로 자동 집계
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* Top companies bar chart */}
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-3">
            가장 많이 언급된 회사
          </h4>
          {trend.topCompanies.length === 0 ? (
            <p className="text-sm text-zinc-500">최근 48시간 데이터가 부족합니다.</p>
          ) : (
            <div className="space-y-2.5">
              {trend.topCompanies.map((c, i) => {
                const company = SEMI_COMPANIES.find((sc) => sc.name === c.name);
                const pct = (c.count / max) * 100;
                return (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-zinc-500 w-4 text-right shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <span className="text-sm font-semibold text-zinc-100 truncate">
                          {company?.korean ?? c.name}
                          <span className="text-zinc-500 font-normal ml-1.5 text-xs">
                            ({c.name})
                          </span>
                        </span>
                        <span className="font-mono text-xs text-amber-300 shrink-0">
                          {c.count}건
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500/80 to-amber-400 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Hottest topic + total */}
        <div className="space-y-4">
          {trend.topTopic && (
            <div className="rounded-xl bg-zinc-800/60 ring-1 ring-inset ring-zinc-700/60 px-5 py-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                가장 핫한 주제
              </div>
              <div className="text-xl font-bold text-amber-300 mb-1">
                {TOPIC_LABELS[trend.topTopic.topic]}
              </div>
              <div className="text-xs text-zinc-400 leading-snug mb-2">
                {TOPIC_BLURB[trend.topTopic.topic]}
              </div>
              <div className="text-xs font-mono text-zinc-500">
                {trend.topTopic.count}건 언급
              </div>
            </div>
          )}
          <div className="rounded-xl bg-zinc-800/60 ring-1 ring-inset ring-zinc-700/60 px-5 py-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
              총 신호
            </div>
            <div className="text-2xl font-mono tabular-nums font-bold text-zinc-50">
              {trend.totalSignals}
              <span className="text-sm text-zinc-500 ml-1.5 font-normal">건 · 48h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
