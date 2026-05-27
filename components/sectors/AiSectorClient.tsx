"use client";

import { useState } from "react";
import { PostCard } from "@/components/ai/PostCard";
import type { AIPost, AICompany } from "@/lib/ai/types";
import { COMPANIES } from "@/lib/ai/types";
import type { ReactNode } from "react";

interface Props {
  posts: AIPost[];
  staticHeader: ReactNode; // digest + benchmarks (server-rendered)
}

export function AiSectorClient({ posts, staticHeader }: Props) {
  const [active, setActive] = useState<AICompany | null>(null);
  const now = Date.now();
  const filtered = active ? posts.filter((p) => p.company === active) : posts;

  return (
    <div className="min-h-screen text-zinc-100">
      {staticHeader}

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-10 space-y-8 sm:space-y-12">
        <section>
          <header className="flex items-end justify-between gap-3 sm:gap-6 mb-5 sm:mb-6 flex-wrap">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-400 mb-2">
                Timeline
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-50">
                {active ? `${COMPANIES.find((c) => c.slug === active)?.name} 소식` : "최신 소식"}
              </h2>
            </div>
            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-mono font-medium tabular-nums text-zinc-100">
                {filtered.length}
              </div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider">posts</div>
            </div>
          </header>

          <div className="flex flex-wrap gap-2 mb-5 sm:mb-7">
            <button
              onClick={() => setActive(null)}
              className={
                !active
                  ? "inline-flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 sm:py-1.5 text-sm font-semibold text-zinc-900"
                  : "inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 sm:py-1.5 text-sm text-zinc-400 ring-1 ring-inset ring-zinc-800 transition-colors hover:bg-zinc-800/70 hover:text-zinc-100"
              }
            >
              전체
            </button>
            {COMPANIES.map((c) => (
              <button
                key={c.slug}
                onClick={() => setActive(active === c.slug ? null : c.slug)}
                className={
                  active === c.slug
                    ? "inline-flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 sm:py-1.5 text-sm font-semibold text-zinc-900"
                    : "inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 sm:py-1.5 text-sm text-zinc-400 ring-1 ring-inset ring-zinc-800 transition-colors hover:bg-zinc-800/70 hover:text-zinc-100"
                }
              >
                {c.dot && <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />}
                {c.name}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-zinc-700/60 bg-zinc-900 ring-1 ring-inset ring-white/5 p-6 sm:p-10 text-center">
              <p className="text-zinc-400 text-sm">최근 소식이 없습니다.</p>
              <p className="text-zinc-600 text-xs mt-1">다른 회사를 선택해보세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filtered.map((p) => (
                <PostCard key={p.id} post={p} now={now} />
              ))}
            </div>
          )}

          <footer className="mt-10 sm:mt-16 pt-6 border-t border-zinc-900 text-xs text-zinc-600 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span>데이터: 공식 블로그 · GitHub · arXiv · Reddit · Hacker News</span>
            <span>30분마다 자동 갱신</span>
          </footer>
        </section>
      </main>
    </div>
  );
}
