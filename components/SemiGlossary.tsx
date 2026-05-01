interface Term {
  term: string;
  full?: string;
  meaning: string;
}

const TERMS: Term[] = [
  {
    term: "HBM",
    full: "High Bandwidth Memory",
    meaning:
      "AI 칩 옆에 붙는 초고속 메모리. 일반 DRAM보다 수십 배 빠름. SK 하이닉스가 1등, 삼성·Micron이 추격.",
  },
  {
    term: "EUV",
    full: "Extreme Ultraviolet",
    meaning:
      "2nm·3nm급 최첨단 칩을 만들 수 있는 노광 장비. ASML이 세계에서 유일하게 만들고, 한 대에 약 2,000억 원.",
  },
  {
    term: "2nm / 3nm",
    meaning:
      "공정의 미세함을 표현하는 숫자. 작을수록 더 작고 빠르고 전력 효율이 좋은 칩이 만들어짐. TSMC·Samsung이 2026년 2nm 양산 경쟁 중.",
  },
  {
    term: "파운드리",
    full: "Foundry",
    meaning:
      "남이 설계한 칩을 대신 만들어주는 공장. TSMC가 점유율 60% 이상으로 압도적 1위.",
  },
  {
    term: "팹리스",
    full: "Fabless",
    meaning:
      "공장 없이 설계만 하는 회사. NVIDIA·AMD·Qualcomm이 대표. 생산은 TSMC 같은 파운드리에 외주.",
  },
  {
    term: "AI 가속기",
    full: "AI Accelerator",
    meaning:
      "AI 학습·추론 전용 칩. NVIDIA H200·B200, AMD MI300, Google TPU 등. ChatGPT 같은 AI 서비스의 심장.",
  },
];

export function SemiGlossary() {
  return (
    <div className="rounded-2xl border border-zinc-700/60 bg-zinc-900/50 ring-1 ring-inset ring-white/5 px-6 py-6 sm:px-7">
      <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-300 mb-5">
        용어 빠른 가이드
      </h3>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-7 gap-y-5">
        {TERMS.map((t) => (
          <div key={t.term}>
            <dt className="flex items-baseline gap-2.5 mb-1.5">
              <span className="text-base font-bold text-amber-300">{t.term}</span>
              {t.full && (
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 truncate">
                  {t.full}
                </span>
              )}
            </dt>
            <dd className="text-sm text-zinc-300 leading-relaxed">{t.meaning}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
