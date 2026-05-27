"use client";

import type { AIPost } from "@/lib/ai/types";
import { COMPANY_MAP } from "@/lib/ai/types";

function timeAgo(iso: string, now: number): string {
  const diffMs = now - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  return `${d}일 전`;
}

const SOURCE_LABEL: Record<AIPost["source"], string> = {
  blog: "Blog",
  x: "X",
  paper: "Paper",
  github: "GitHub",
  reddit: "Reddit",
  hn: "HN",
};

interface Props {
  post: AIPost;
  now: number;
}

export function PostCard({ post, now }: Props) {
  const c = COMPANY_MAP[post.company];
  return (
    <article className="group relative min-w-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 ring-1 ring-inset ring-white/5 p-5 sm:p-6 transition-all hover:border-zinc-700 hover:bg-zinc-800/60">
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 mb-3">
        <span
          className={`inline-flex items-center gap-2 rounded-full ${c.bg} px-3 py-1 text-xs font-bold tracking-wide ring-1 ring-inset ${c.ring} ${c.text}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
          {c.name}
        </span>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 font-medium tracking-wide text-zinc-400">
            {SOURCE_LABEL[post.source]}
          </span>
          <span className="font-mono tabular-nums">
            {timeAgo(post.publishedAt, now)}
          </span>
        </div>
      </header>

      <h3 className="text-lg font-semibold leading-snug text-zinc-50 mb-2 break-words">
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          {post.title}
        </a>
      </h3>

      <p className="text-sm leading-relaxed text-zinc-400 break-words">
        {post.summary}
      </p>

      {post.tags && post.tags.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {post.tags.map((t) => (
            <li
              key={t}
              className="max-w-full truncate rounded bg-zinc-800/60 px-2 py-0.5 text-[11px] text-zinc-500"
            >
              {t}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
