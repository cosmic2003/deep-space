import type { SemiCompany } from "@/lib/semiCompanies";

interface Props {
  company: SemiCompany;
  newsCount: number;
}

const TYPE_LABEL: Record<SemiCompany["type"], string> = {
  foundry: "파운드리",
  fabless: "팹리스",
  memory: "메모리",
  equipment: "장비",
  idm: "IDM",
};

export function SemiCompanyCard({ company, newsCount }: Props) {
  return (
    <a
      href={company.wikiUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl border border-zinc-700/60 bg-zinc-800/60 ring-1 ring-inset ring-white/5 p-5 transition-all hover:border-zinc-500/70 hover:ring-white/10 hover:bg-zinc-800/80"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xl shrink-0" aria-hidden>
            {company.flag}
          </span>
          <div className="min-w-0">
            <h4
              className="text-base font-bold text-zinc-50 leading-tight truncate"
              title={`${company.korean} (${company.name})`}
            >
              {company.korean}
            </h4>
            <p className="text-[11px] font-mono text-zinc-500 mt-0.5 uppercase tracking-wider">
              {TYPE_LABEL[company.type]}
            </p>
          </div>
        </div>
        {newsCount > 0 && (
          <span
            className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-mono font-semibold text-amber-300 ring-1 ring-inset ring-amber-500/40 shrink-0"
            title={`최근 48시간 동안 ${newsCount}건 언급`}
          >
            {newsCount}
          </span>
        )}
      </div>
      <p className="text-sm text-zinc-300 leading-snug" title={company.primary}>
        {company.primary}
      </p>
    </a>
  );
}
