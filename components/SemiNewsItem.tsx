import type { NewsItem, Topic } from "@/lib/sources/semiNews";
import { TOPIC_LABELS, googleTranslateUrl } from "@/lib/sources/semiNews";

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
  const koreanContext: string[] = [];
  if (item.companies.length > 0) koreanContext.push(item.companies.join(" · "));
  if (item.actionLabel) koreanContext.push(item.actionLabel);
  if (koreanContext.length === 0 && visibleTopics.length > 0) {
    koreanContext.push(visibleTopics.map((t) => TOPIC_LABELS[t]).join(" · "));
  }

  return (
    <article className="rounded-xl border border-zinc-700/40 bg-zinc-800/40 hover:bg-zinc-800/70 hover:border-zinc-600/70 transition-all px-5 py-4">
      {/* Korean context line */}
      {koreanContext.length > 0 && (
        <div className="text-sm font-semibold text-amber-300/95 mb-1.5 truncate">
          {koreanContext.join(" — ")}
        </div>
      )}

      {/* English title (browser auto-translate friendly via lang="en") */}
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        lang="en"
        className="block text-base font-medium text-zinc-100 hover:text-amber-300 transition-colors leading-snug"
      >
        {item.title}
      </a>

      {/* Tags + meta */}
      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
        <SourceBadge source={item.source} subreddit={item.subreddit} />
        {visibleTopics.map((t) => (
          <span
            key={t}
            className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-300/90 ring-1 ring-inset ring-amber-500/30"
          >
            {TOPIC_LABELS[t]}
          </span>
        ))}
        <span className="text-[11px] font-mono text-zinc-500 inline-flex items-center gap-1">
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
            className="text-[11px] font-mono text-zinc-500 inline-flex items-center gap-1 hover:text-zinc-200 transition-colors"
            title="댓글 스레드"
          >
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {item.comments}
          </a>
        ) : (
          <span className="text-[11px] font-mono text-zinc-500 inline-flex items-center gap-1">
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {item.comments}
          </span>
        )}
        <span className="text-[11px] font-mono text-zinc-500">· {timeAgo(item.postedAt)}</span>
        <a
          href={googleTranslateUrl(item.title)}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-[11px] text-zinc-400 hover:text-sky-300 transition-colors inline-flex items-center gap-1"
          title="Google 번역으로 열기"
        >
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M5 8h6m-3-2v2c0 4-2 7-5 7m4-3c0 2 2 4 5 4M14 16l4-9 4 9M15 13h6" />
          </svg>
          번역
        </a>
      </div>
    </article>
  );
}
