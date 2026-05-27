import Link from "next/link";
import type { AICompany } from "@/lib/ai/types";
import { COMPANIES } from "@/lib/ai/types";

interface Props {
  active?: AICompany;
}

export function CompanyFilter({ active }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <Chip href="/ai" active={!active} label="전체" />
      {COMPANIES.map((c) => (
        <Chip
          key={c.slug}
          href={`/ai?company=${c.slug}`}
          active={active === c.slug}
          label={c.name}
          dot={c.dot}
        />
      ))}
    </div>
  );
}

function Chip({
  href,
  active,
  label,
  dot,
}: {
  href: string;
  active: boolean;
  label: string;
  dot?: string;
}) {
  return (
    <Link
      href={href}
      prefetch
      scroll={false}
      className={
        active
          ? "inline-flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 sm:py-1.5 text-sm font-semibold text-zinc-900"
          : "inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 sm:py-1.5 text-sm text-zinc-400 ring-1 ring-inset ring-zinc-800 transition-colors hover:bg-zinc-800/70 hover:text-zinc-100"
      }
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
      {label}
    </Link>
  );
}
