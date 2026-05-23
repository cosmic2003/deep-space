import type { SpaceDigest } from "@/lib/space/digest";

interface Props {
  digest: SpaceDigest;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export function SpaceDigestSection({ digest }: Props) {
  return (
    <section className="mt-12 sm:mt-16">
      <header className="mb-5 sm:mb-6">
        <p className="aero-eyebrow mb-2">Weekly Digest</p>
        <h2 className="aero-title-gradient text-2xl sm:text-3xl font-semibold tracking-tight">
          이번 주 우주 요약
        </h2>
        <p className="mt-1 text-xs text-[var(--aero-text-muted)]">
          {formatDate(digest.generatedAt)} · 지난 {digest.windowDays}일 · 기사{" "}
          {digest.sourceCount}건 종합
        </p>
      </header>

      <div className="aero-glass rounded-2xl p-5 sm:p-6 mb-4">
        <p className="text-sm sm:text-base leading-relaxed text-[var(--aero-text-secondary)]">
          {digest.summary}
        </p>
      </div>

      {digest.items.length > 0 && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {digest.items.map((it) => (
            <li key={`${it.title}-${it.url}`}>
              <a
                href={it.url}
                target="_blank"
                rel="noopener noreferrer"
                className="aero-glass aero-glass-hover group relative block min-w-0 overflow-hidden rounded-2xl p-5 h-full"
              >
                <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--aero-text-muted)] font-semibold mb-2 truncate">
                  {it.source}
                </p>
                <h3 className="text-base sm:text-lg font-bold text-zinc-50 leading-snug break-words mb-2 group-hover:text-[var(--aero-accent)] transition-colors">
                  {it.title}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--aero-text-secondary)] break-words">
                  {it.desc}
                </p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
