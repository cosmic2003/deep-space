interface Pillar {
  label: string;
  korean: string;
  description: string;
  examples: string;
  accentBg: string;
  accentText: string;
}

const PILLARS: Pillar[] = [
  {
    label: "Fabless",
    korean: "설계",
    description: "칩 디자인만 하고 생산은 외주. 두뇌 역할.",
    examples: "NVIDIA · AMD · Apple · Qualcomm",
    accentBg: "bg-violet-500/15 ring-violet-500/40",
    accentText: "text-violet-300",
  },
  {
    label: "Foundry",
    korean: "위탁생산",
    description: "남이 그린 설계도를 받아 실제로 칩을 찍어냄. 공장.",
    examples: "TSMC · Samsung",
    accentBg: "bg-amber-500/15 ring-amber-500/40",
    accentText: "text-amber-300",
  },
  {
    label: "Memory",
    korean: "메모리",
    description: "데이터 저장·전달용 칩. AI 시대에 가장 비싸지는 부품.",
    examples: "SK 하이닉스 · 삼성 · Micron",
    accentBg: "bg-sky-500/15 ring-sky-500/40",
    accentText: "text-sky-300",
  },
  {
    label: "Equipment",
    korean: "장비",
    description: "반도체를 만드는 기계. EUV 한 대에 약 2,000억 원.",
    examples: "ASML · Tokyo Electron · Applied Materials",
    accentBg: "bg-emerald-500/15 ring-emerald-500/40",
    accentText: "text-emerald-300",
  },
];

export function SemiIntroHero() {
  return (
    <div className="rounded-2xl border border-zinc-700/60 bg-zinc-900/70 ring-1 ring-inset ring-white/5 px-6 py-7 sm:px-8 sm:py-8">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-base font-semibold text-amber-300">
          반도체 산업 한눈에
        </span>
      </div>
      <p className="text-zinc-300 text-base leading-relaxed mb-7">
        반도체는 모든 IT 기기의 핵심 부품입니다. 산업은 크게 4 갈래로 나뉘어요 — 회사를 보면 어느 칸에 속하는지부터 확인하면 이해가 빠릅니다.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {PILLARS.map((p) => (
          <div
            key={p.label}
            className="rounded-xl bg-zinc-800/50 ring-1 ring-inset ring-zinc-700/50 px-4 py-4"
          >
            <div className="flex items-baseline gap-2 mb-2">
              <span className={`text-base font-bold ${p.accentText}`}>
                {p.korean}
              </span>
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                {p.label}
              </span>
            </div>
            <p className="text-sm text-zinc-200 leading-snug mb-2.5">
              {p.description}
            </p>
            <div
              className={`inline-block rounded-md ${p.accentBg} px-2 py-0.5 text-[11px] ring-1 ring-inset ${p.accentText}`}
            >
              {p.examples}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
