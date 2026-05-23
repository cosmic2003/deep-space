import type { SpaceArticle } from "@/lib/sources/spaceflightNews";

interface Props {
  article: SpaceArticle;
  /** Render time at server-build moment; client never recomputes. */
  nowMs: number;
}

function timeAgo(iso: string, nowMs: number): string {
  const diffMs = nowMs - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  return `${d}일 전`;
}

export function SpaceNewsCard({ article, nowMs }: Props) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="aero-glass aero-glass-hover group relative block min-w-0 overflow-hidden rounded-2xl"
    >
      {article.image_url && (
        <div
          className="aspect-[16/9] bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url(${article.image_url})` }}
          aria-hidden
        />
      )}
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-[var(--aero-text-muted)] mb-2 font-semibold">
          <span className="truncate min-w-0" title={article.news_site}>
            {article.news_site}
          </span>
          <span aria-hidden>·</span>
          <span className="shrink-0">{timeAgo(article.published_at, nowMs)}</span>
        </div>
        <h3 className="text-base font-bold text-zinc-100 leading-snug break-words line-clamp-3">
          {article.title}
        </h3>
        <p className="text-xs text-[var(--aero-text-secondary)] mt-2 leading-relaxed line-clamp-3">
          {article.summary}
        </p>
      </div>
    </a>
  );
}
