"use client";

import { useMemo, useState } from "react";

// Snapshot data — see footer for date. Numbers are aggregated reported values
// from vals.ai / llm-stats.com / futureagi etc. Refresh manually as the
// leaderboard reshuffles.
interface Model {
  name: string;
  org: string;
  swe: number;
  gpqa: number;
  terminal: number;
  hle: number;
  inPrice: number | null;
  outPrice: number | null;
  ctx: string;
  note: string;
  color: string;
  restricted?: boolean;
}

const MODELS: Model[] = [
  {
    name: "GPT-5.5",
    org: "OpenAI",
    swe: 82.6, gpqa: 93.6, terminal: 82.7, hle: 52.2,
    inPrice: 1.25, outPrice: 10,
    ctx: "400K",
    note: "에이전트/터미널 작업 1위. ChatGPT 기본 모델 (5월 5일~). 4월 23일 출시.",
    color: "#10a37f",
  },
  {
    name: "Claude Opus 4.7",
    org: "Anthropic",
    swe: 82.0, gpqa: 94.2, terminal: 69.4, hle: 54.7,
    inPrice: 5, outPrice: 25,
    ctx: "200K (1M 베타)",
    note: "복잡한 멀티파일 코딩 1위 (SWE-bench Pro 64.3%). 환각률 최저. 4월 16일 출시.",
    color: "#d97757",
  },
  {
    name: "Gemini 3.1 Pro",
    org: "Google",
    swe: 78.8, gpqa: 94.3, terminal: 68.5, hle: 48.0,
    inPrice: 2, outPrice: 12,
    ctx: "1M",
    note: "과학 추론(GPQA) 공동 1위, 멀티모달/롱컨텍스트 강함. 구글 검색 그라운딩 내장.",
    color: "#4285f4",
  },
  {
    name: "Claude Mythos (Preview)",
    org: "Anthropic",
    swe: 93.9, gpqa: 94.6, terminal: 82.0, hle: 64.7,
    inPrice: null, outPrice: null,
    ctx: "비공개",
    note: "순수 성능 최강이지만 일반 공개 안 됨 (Project Glasswing 한정). 토큰 구매 불가.",
    color: "#b45cff",
    restricted: true,
  },
  {
    name: "DeepSeek V4-Pro",
    org: "DeepSeek",
    swe: 80.6, gpqa: 85.0, terminal: 60.0, hle: 38.0,
    inPrice: 0.4, outPrice: 0.87,
    ctx: "128K",
    note: "가성비 최강. GPT-5.5 대비 출력 약 34배 저렴. 오픈웨이트 코딩 최강.",
    color: "#2b6cff",
  },
  {
    name: "Grok 4.3",
    org: "xAI",
    swe: 76.0, gpqa: 88.0, terminal: 64.0, hle: 40.0,
    inPrice: 3, outPrice: 15,
    ctx: "1M",
    note: "PDF/PPT/엑셀 직접 출력. 영상 입력 지원. 207 tok/s 빠른 속도.",
    color: "#a1a1aa",
  },
  {
    name: "Kimi K2.6",
    org: "Moonshot",
    swe: 74.0, gpqa: 90.5, terminal: 55.0, hle: 35.0,
    inPrice: 0.6, outPrice: 0.95,
    ctx: "256K",
    note: "오픈웨이트 GPQA 1위. 톱10 중 가장 저렴.",
    color: "#ff7a45",
  },
  {
    name: "Qwen 3.6 Plus",
    org: "Alibaba",
    swe: 78.0, gpqa: 86.0, terminal: 58.0, hle: 33.0,
    inPrice: 0.3, outPrice: 0.6,
    ctx: "256K",
    note: "SWE-bench Pro에서 강세. 오픈웨이트 생태계 주력.",
    color: "#6e3cff",
  },
];

type Metric = "swe" | "gpqa" | "terminal" | "hle";
type CategoryId = Metric | "value";

interface Category {
  id: CategoryId;
  label: string;
  desc: string;
}

const CATEGORIES: Category[] = [
  { id: "swe", label: "코딩", desc: "SWE-bench Verified" },
  { id: "gpqa", label: "추론", desc: "GPQA Diamond" },
  { id: "terminal", label: "에이전트", desc: "Terminal-Bench 2.0" },
  { id: "hle", label: "난이도", desc: "Humanity's Last Exam (w/ tools)" },
  { id: "value", label: "가성비", desc: "성능 / 출력가격" },
];

const SNAPSHOT_DATE = "2026.05.21";

export function ModelBenchmarks() {
  const [cat, setCat] = useState<CategoryId>("swe");
  const [showRestricted, setShowRestricted] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const activeCat = CATEGORIES.find((c) => c.id === cat)!;

  const ranked = useMemo(() => {
    const list = MODELS.filter((m) => showRestricted || !m.restricted);
    const getVal = (m: Model): number => {
      if (cat === "value") {
        // Skip pricing-less models; mark with sentinel.
        if (!m.outPrice) return -1;
        return ((m.swe + m.gpqa) / 2) / m.outPrice;
      }
      return m[cat as Metric];
    };
    return list
      .map((m) => ({ ...m, _val: getVal(m) }))
      .sort((a, b) => b._val - a._val);
  }, [cat, showRestricted]);

  const maxVal = Math.max(
    ...ranked.map((m) => m._val).filter((v) => v >= 0),
    1
  );

  const fmtVal = (val: number): string => {
    if (cat === "value") return val < 0 ? "—" : val.toFixed(1);
    return val.toFixed(1) + "%";
  };

  return (
    <section>
      <header className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-400 mb-2">
          Benchmark · Snapshot {SNAPSHOT_DATE}
        </p>
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-50">
          모델 성능 순위
        </h2>
        <p className="mt-2 text-sm text-zinc-400 max-w-xl">
          프론티어 LLM을 코딩 · 추론 · 에이전트 · 가성비 기준으로 비교.
        </p>
      </header>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {CATEGORIES.map((c) => {
          const active = cat === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`font-mono text-xs px-4 py-2 rounded-full border transition ${
                active
                  ? "bg-violet-500 border-violet-500 text-zinc-950 font-bold"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="font-mono text-[11px] text-zinc-500 mb-5 flex justify-between items-center flex-wrap gap-2">
        <span>
          기준: <strong className="text-zinc-300">{activeCat.desc}</strong>
        </span>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={showRestricted}
            onChange={(e) => setShowRestricted(e.target.checked)}
            className="accent-violet-500"
          />
          비공개 모델 포함
        </label>
      </div>

      <ol className="flex flex-col gap-2">
        {ranked.map((m, i) => {
          const pct = m._val >= 0 ? (m._val / maxVal) * 100 : 0;
          const isOpen = expanded === m.name;
          const topThree = i < 3;
          return (
            <li key={m.name}>
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : m.name)}
                aria-expanded={isOpen}
                className="w-full text-left flex items-center gap-4 px-4 py-3 sm:px-5 sm:py-4 bg-zinc-900 border rounded-xl ring-1 ring-inset ring-white/5 hover:bg-zinc-800/70 transition"
                style={{
                  borderColor: isOpen ? m.color : "rgb(39 39 42)",
                }}
              >
                <span
                  className="font-mono text-lg font-bold w-8 shrink-0 tabular-nums"
                  style={{ color: topThree ? m.color : "rgb(113 113 122)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base text-zinc-50 font-medium">
                      {m.name}
                    </span>
                    {m.restricted && (
                      <span className="font-mono text-[9px] tracking-wider px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30">
                        비공개
                      </span>
                    )}
                  </div>
                  <span className="block font-mono text-[11px] text-zinc-500 mt-0.5">
                    {m.org}
                  </span>
                  <div className="h-1 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-[width] duration-500"
                      style={{ width: `${pct}%`, background: m.color }}
                    />
                  </div>
                </div>

                <div className="text-right shrink-0 min-w-[68px]">
                  <span
                    className="block font-mono text-xl font-bold tabular-nums"
                    style={{ color: m.color }}
                  >
                    {fmtVal(m._val)}
                  </span>
                  {cat === "value" && (
                    <span className="font-mono text-[10px] text-zinc-500">
                      점/$
                    </span>
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="px-4 py-3 sm:px-5 sm:py-4 bg-zinc-900/60 border border-t-0 border-zinc-800 rounded-b-xl -mt-1">
                  <p className="text-sm text-zinc-300 leading-relaxed mb-3">
                    {m.note}
                  </p>
                  <dl className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <Stat label="코딩 (SWE)" val={m.swe + "%"} />
                    <Stat label="추론 (GPQA)" val={m.gpqa + "%"} />
                    <Stat label="에이전트" val={m.terminal + "%"} />
                    <Stat label="컨텍스트" val={m.ctx} />
                    <Stat
                      label="입력 $/M"
                      val={m.inPrice != null ? "$" + m.inPrice : "—"}
                    />
                    <Stat
                      label="출력 $/M"
                      val={m.outPrice != null ? "$" + m.outPrice : "—"}
                    />
                  </dl>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <p className="mt-5 text-[11px] text-zinc-500 leading-relaxed">
        벤치마크는 60~90일마다 뒤집힘. 위 수치는 {SNAPSHOT_DATE} 기준 수동 스냅샷이고
        자동 갱신은 안 됨. 출처: vals.ai · llm-stats.com · futureagi.
      </p>
    </section>
  );
}

function Stat({ label, val }: { label: string; val: string }) {
  return (
    <div className="bg-zinc-950/40 rounded-lg px-2.5 py-2 flex flex-col gap-0.5 ring-1 ring-inset ring-white/5">
      <dt className="font-mono text-[10px] text-zinc-500 tracking-wider">
        {label}
      </dt>
      <dd className="font-mono text-sm text-zinc-100 font-bold">{val}</dd>
    </div>
  );
}
