import Link from "next/link";

export type Section = "aerospace" | "semiconductor" | "ai";

const NAV: Array<{ key: Section; label: string; href: string }> = [
  { key: "aerospace", label: "항공우주", href: "/" },
  { key: "semiconductor", label: "반도체", href: "/semiconductor" },
  { key: "ai", label: "AI", href: "/ai" },
];

interface Props {
  active?: Section;
}

export function Header({ active = "aerospace" }: Props) {
  return (
    <header className="border-b border-zinc-900/80 bg-zinc-950/85 backdrop-blur-md sticky top-0 z-20">
      <div className="w-full px-6 lg:px-8 py-6 flex items-center justify-between gap-6">
        <Link href="/" className="group flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-zinc-950 font-bold text-lg shadow-lg shadow-sky-500/20 transition-shadow group-hover:shadow-sky-500/40">
            D
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-50 leading-tight">
              Deep Space
            </h1>
            <p className="text-xs text-zinc-400 uppercase tracking-[0.18em] font-medium">
              Aerospace & Tech Hub
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-1.5 text-sm font-medium">
          {NAV.map((item) => {
            const isActive = item.key === active;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={
                  isActive
                    ? "rounded-lg bg-zinc-900 px-4 py-2 text-zinc-50 ring-1 ring-inset ring-zinc-800"
                    : "rounded-lg px-4 py-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60 transition-colors"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
