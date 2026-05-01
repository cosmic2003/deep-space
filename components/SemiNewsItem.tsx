import type { NewsItem, Topic } from "@/lib/sources/semiNews";
import { TOPIC_LABELS } from "@/lib/sources/semiNews";

interface Props {
  item: NewsItem;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  return `${day}일 전`;
}

function SourceBadge({ source, subreddit }: { source: NewsItem["source"]; subreddit?: string }) {
  if (source === "hn") {
    return (
      <span className="rounded-md bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-mono font-bold text-orange-300 ring-1 ring-inset ring-orange-500/40">
        HN
      </span>
    );
  }
  return (
    <span className="rounded-md bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-mono font-bold text-sky-300 ring-1 ring-inset ring-sky-500/40">
      r/{subreddit}
    </span>
  );
}

export function SemiNewsItem({ item }: Props) {
  const visibleTopics = item.topics.filter((t): t is Exclude<Topic, "general"> => t !== "general");
  return (
    <article className="rounded-xl border border-zinc-700/40 bg-zinc-800/40 hover:bg-zinc-800/70 hover:border-zinc-600/70 transition-all px-5 py-4">
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <SourceBadge source={item.source} subreddit={item.subreddit} />
        {item.companies.map((c) => (
          <span
            key={c}
            className="rounded-md bg-zinc-700/60 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-100 ring-1 ring-inset ring-zinc-600/60"
          >
            {c}
          </span>
        ))}
        {visibleTopics.map((t) => (
          <span
            key={t}
            className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-300/90 ring-1 ring-inset ring-amber-500/30"
          >
            {TOPIC_LABELS[t]}
          </span>
        ))}
      </div>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-base font-medium text-zinc-100 hover:text-amber-300 transition-colors leading-snug"
      >
        {item.title}
      </a>
      <div className="mt-2.5 flex items-center gap-4 text-[11px] font-mono text-zinc-500">
        <span className="inline-flex items-center gap-1" title="점수">
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
          {item.score}
        </span>
        {item.commentsUrl ? (
          <a
            href={item.commentsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-zinc-200 transition-colors"
            title="댓글 스레드"
          >
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {item.comments}
          </a>
        ) : (
          <span className="inline-flex items-center gap-1">
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {item.comments}
          </span>
        )}
        <span>· {timeAgo(item.postedAt)}</span>
      </div>
    </article>
  );
}
