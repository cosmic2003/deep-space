"use client";

import { useMemo, useState } from "react";
import type { BenchmarkModel } from "@/lib/ai/source";

// Brand colours by model creator. Substring match against the creator name AA
// returns ("OpenAI", "Anthropic", "Google", ...); unknowns fall back to violet.
const CREATOR_COLORS: [test: string, color: string][] = [
  ["openai", "#10a37f"],
  ["anthropic", "#d97757"],
  ["google", "#4285f4"],
  ["deepmind", "#4285f4"],
  ["deepseek", "#2b6cff"],
  ["xai", "#a1a1aa"],
  ["meta", "#4267b2"],
  ["mistral", "#ff7000"],
  ["alibaba", "#6e3cff"],
  ["qwen", "#6e3cff"],
  ["moonshot", "#ff7a45"],
];

function creatorColor(creator: string): string {
  const c = creator.toLowerCase();
  for (const [test, color] of CREATOR_COLORS) {
    if (c.includes(test)) return color;
  }
  return "#8b5cf6";
}

type CategoryId = "intelligence" | "coding" | "math" | "value";

interface Category {
  id: CategoryId;
  label: string;
  desc: string;
}

const CATEGORIES: Category[] = [
  { id: "intelligence", label: "종합", desc: "Artificial Analysis Intelligence Index" },
  { id: "coding", label: "코딩", desc: "AA Coding Index" },
  { id: "math", label: "수학", desc: "AA Math Index" },
  { id: "value", label: "가성비", desc: "지능 지수 / 출력 가격" },
];

function fmtSnapshot(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function ModelBenchmarks({
  models,
  snapshotDate,
}: {
  models: BenchmarkModel[];
  snapshotDate: string | null;
}) {
  const [cat, setCat] = useState<CategoryId>("intelligence");
  const [expanded, setExpanded] = useState<string | null>(null);
  // Section is collapsed by default — the leaderboard is a lot of vertical real
  // estate on mobile and most visitors won't drill in.
  const [sectionOpen, setSectionOpen] = useState(false);

  const activeCat = CATEGORIES.find((c) => c.id === cat)!;

  const ranked = useMemo(() => {
    const getVal = (m: BenchmarkModel): number | null => {
      if (cat === "value") {
        if (!m.outPrice || m.intelligence == null) return null;
        return m.intelligence / m.outPrice;
      }
      return m[cat];
    };
    return models
      .map((m) => ({ ...m, _val: getVal(m) }))
      .sort((a, b) => (b._val ?? -1) - (a._val ?? -1));
  }, [models, cat]);

  const maxVal = Math.max(
    ...ranked.map((m) => m._val ?? 0).filter((v) => v > 0),
    1
  );

  const fmtVal = (val: number | null): string => {
    if (val == null) return "—";
    return val.toFixed(1);
  };

  return (
    <section>
      <button
        type="button"
        onClick={() => setSectionOpen((v) => !v)}
        aria-expanded={sectionOpen}
        className="w-full text-left flex items-start justify-between gap-3 mb-5 group"
      >
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-400 mb-2">
            Benchmark · Snapshot {fmtSnapshot(snapshotDate)}
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-50">
            모델 성능 순위
          </h2>
          <p className="mt-2 text-sm text-zinc-400 max-w-xl">
            프론티어 LLM을 종합 지능 · 코딩 · 수학 · 가성비 기준으로 비교.{" "}
            <span className="text-zinc-500">탭하여 {sectionOpen ? "접기" : "펼치기"}</span>
          </p>
        </div>
        <span
          aria-hidden
          className={`shrink-0 mt-2 text-zinc-500 group-hover:text-zinc-300 transition-transform duration-300 ${
            sectionOpen ? "rotate-180" : ""
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-400 ease-out ${
          sectionOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          {models.length === 0 ? (
            <div className="rounded-xl border border-zinc-700/60 bg-zinc-900 ring-1 ring-inset ring-white/5 p-6 sm:p-10 text-center">
              <p className="text-zinc-300 text-sm">벤치마크 데이터를 불러오는 중입니다.</p>
              <p className="text-zinc-500 text-xs mt-1">
                Artificial Analysis 리더보드 연동 후 매일 자동 갱신됩니다.
              </p>
            </div>
          ) : (
            <>
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

              <div className="font-mono text-[11px] text-zinc-500 mb-5">
                기준: <strong className="text-zinc-300">{activeCat.desc}</strong>
              </div>

              <ol className="flex flex-col gap-2">
                {ranked.map((m, i) => {
                  const color = creatorColor(m.creator);
                  const pct = m._val != null && m._val > 0 ? (m._val / maxVal) * 100 : 0;
                  const isOpen = expanded === m.name;
                  const topThree = i < 3;
                  return (
                    <li key={m.name}>
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : m.name)}
                        aria-expanded={isOpen}
                        className="w-full text-left flex items-center gap-4 px-4 py-3 sm:px-5 sm:py-4 bg-zinc-900 border rounded-xl ring-1 ring-inset ring-white/5 hover:bg-zinc-800/70 transition"
                        style={{ borderColor: isOpen ? color : "rgb(39 39 42)" }}
                      >
                        <span
                          className="font-mono text-lg font-bold w-8 shrink-0 tabular-nums"
                          style={{ color: topThree ? color : "rgb(113 113 122)" }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>

                        <div className="flex-1 min-w-0">
                          <span className="text-base text-zinc-50 font-medium">
                            {m.name}
                          </span>
                          <span className="block font-mono text-[11px] text-zinc-500 mt-0.5">
                            {m.creator}
                          </span>
                          <div className="h-1 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-[width] duration-500"
                              style={{ width: `${pct}%`, background: color }}
                            />
                          </div>
                        </div>

                        <div className="text-right shrink-0 min-w-[68px]">
                          <span
                            className="block font-mono text-xl font-bold tabular-nums"
                            style={{ color }}
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
                          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <Stat label="종합 지능" val={fmtVal(m.intelligence)} />
                            <Stat label="코딩" val={fmtVal(m.coding)} />
                            <Stat label="수학" val={fmtVal(m.math)} />
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
                매일 자동 갱신. 새 모델은 벤치마크되는 대로 자동 반영됨. 출처:{" "}
                <a
                  href="https://artificialanalysis.ai/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-400 underline hover:text-zinc-200"
                >
                  Artificial Analysis
                </a>
                .
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function Stat({ label, val }: { label: string; val: string }) {
  return (
    <div className="bg-zinc-950/40 rounded-lg px-2.5 py-2 flex flex-col gap-0.5 ring-1 ring-inset ring-white/5">
      <dt className="font-mono text-[10px] text-zinc-500 tracking-wider">{label}</dt>
      <dd className="font-mono text-sm text-zinc-100 font-bold">{val}</dd>
    </div>
  );
}
