import type { DailyDigest as Digest } from "@/lib/ai/types";
import { COMPANY_MAP } from "@/lib/ai/types";

const pad2 = (n: number) => n.toString().padStart(2, "0");

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}`;
}

export function DailyDigest({ digest }: { digest: Digest }) {
  return (
    <section className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/5 to-transparent p-5 sm:p-8 ring-1 ring-inset ring-white/5">
      <header className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-zinc-950 shadow-lg shadow-violet-500/30"
            aria-hidden
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
              <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
            </svg>
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-300">
              Weekly Digest
            </p>
            <h2 className="text-xl font-semibold text-zinc-50">
              이번 주 주요 이슈
            </h2>
          </div>
        </div>
        <span className="font-mono text-sm text-zinc-500 self-center">
          {formatDate(digest.date)}
        </span>
      </header>

      <p className="text-sm sm:text-[15px] leading-relaxed text-zinc-200 mb-5 sm:mb-6">
        {digest.summary}
      </p>

      {digest.highlights.length > 0 && (
        <ul className="space-y-2.5">
          {digest.highlights.map((h, i) => {
            const c = COMPANY_MAP[h.company];
            const content = (
              <>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full ${c.bg} px-2.5 py-0.5 text-[11px] font-bold tracking-wide ring-1 ring-inset ${c.ring} ${c.text} shrink-0`}
                >
                  <span className={`h-1 w-1 rounded-full ${c.dot}`} />
                  {c.name}
                </span>
                <span className="text-sm text-zinc-200">{h.title}</span>
              </>
            );
            return (
              <li key={i}>
                {h.url ? (
                  <a
                    href={h.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start sm:items-center gap-2 sm:gap-3 hover:text-zinc-50"
                  >
                    {content}
                  </a>
                ) : (
                  <div className="flex items-start sm:items-center gap-2 sm:gap-3">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <footer className="mt-6 pt-4 border-t border-violet-500/20 text-[11px] text-zinc-500 uppercase tracking-wider">
        30분마다 최근 7일 기준 갱신 · LLM 요약
      </footer>
    </section>
  );
}
