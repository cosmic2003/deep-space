import Link from "next/link";
import { groupRocketsByProvider, type Launch } from "@/lib/sources/launchLibrary";
import { providerColor } from "@/lib/providerColors";
import { RocketGallery } from "./RocketGallery";

interface Props {
  launches: Launch[];
  selectedSlug?: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function Sidebar({ launches, selectedSlug }: Props) {
  const providers = groupRocketsByProvider(launches);
  const totalRockets = providers.reduce((acc, p) => acc + p.rockets.length, 0);
  const selected = selectedSlug
    ? providers.find((p) => slugify(p.providerName) === selectedSlug)
    : null;

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#3f3f46_transparent]">
        <div className="rounded-2xl border border-zinc-700/60 bg-zinc-900 ring-1 ring-inset ring-white/5 px-5 py-5">
          <header className="mb-5 pb-5 border-b border-zinc-800">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-400 mb-2">
              Rocket Library
            </p>
            <h3 className="text-2xl font-bold tracking-tight text-zinc-50">
              로켓 제원
            </h3>
            {!selected && (
              <p className="text-sm text-zinc-400 mt-2">
                <span className="font-mono font-semibold text-zinc-100">{providers.length}</span>개 운영사 ·{" "}
                <span className="font-mono font-semibold text-zinc-100">{totalRockets}</span>개 모델
              </p>
            )}
          </header>

          {selected ? (
            <ProviderDetail provider={selected} />
          ) : (
            <ProviderList providers={providers} />
          )}
        </div>
      </div>
    </aside>
  );
}

function ProviderList({
  providers,
}: {
  providers: ReturnType<typeof groupRocketsByProvider>;
}) {
  return (
    <ul className="space-y-1.5">
      {providers.map((p) => {
        const color = providerColor(p.providerName);
        const slug = slugify(p.providerName);
        return (
          <li key={String(p.providerId)}>
            <Link
              href={`/?provider=${slug}`}
              scroll={false}
              prefetch
              className="group flex items-center gap-3.5 rounded-xl px-4 py-3.5 transition-colors hover:bg-zinc-800/70 ring-1 ring-transparent hover:ring-zinc-700/60"
            >
              <span
                className="h-8 w-1.5 rounded-full shrink-0 transition-all group-hover:h-10"
                style={{ backgroundColor: color }}
                aria-hidden
              />
              <div className="flex-1 min-w-0">
                <div
                  className="text-lg font-bold tracking-tight truncate transition-colors"
                  style={{ color }}
                  title={p.providerName}
                >
                  {p.providerName}
                </div>
                <div className="text-sm text-zinc-400 mt-0.5">
                  <span className="font-mono font-semibold text-zinc-200">{p.rockets.length}</span>개 로켓
                </div>
              </div>
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 text-zinc-500 shrink-0 transition-all group-hover:text-zinc-100 group-hover:translate-x-0.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M9 6l6 6-6 6" />
              </svg>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ProviderDetail({
  provider,
}: {
  provider: ReturnType<typeof groupRocketsByProvider>[number];
}) {
  const color = providerColor(provider.providerName);
  return (
    <div>
      <Link
        href="/"
        scroll={false}
        prefetch
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors mb-5"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        다른 회사 보기
      </Link>

      <div className="flex items-center gap-3 mb-5">
        <span
          className="h-8 w-1.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
          aria-hidden
        />
        <h4
          className="text-xl font-bold tracking-tight truncate"
          style={{ color }}
          title={provider.providerName}
        >
          {provider.providerName}
        </h4>
        <span className="ml-auto text-sm font-mono font-semibold text-zinc-300 shrink-0">
          {provider.rockets.length}
        </span>
      </div>

      <RocketGallery rockets={provider.rockets} accentColor={color} />
    </div>
  );
}
