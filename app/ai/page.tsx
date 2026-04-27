import { ComingSoon } from "@/components/ComingSoon";
import { Header } from "@/components/Header";

export const metadata = {
  title: "AI — Deep Space",
};

export default function AiPage() {
  return (
    <div className="min-h-screen bg-[#202124] text-zinc-100 relative">
      <Header active="ai" />
      <ComingSoon
        label="Artificial Intelligence"
        title="모델 출시 · 논문 · 기업 동향"
        description="OpenAI, Anthropic, Google DeepMind, xAI 등의 신모델 발표, 주요 arXiv 논문, 산업 흐름을 실시간으로 추적할 수 있게 준비 중입니다."
        accentFrom="from-violet-500"
        accentTo="to-fuchsia-500"
        accentText="text-violet-400"
        icon={
          <svg viewBox="0 0 24 24" className="h-12 w-12 text-zinc-950" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="3" />
            <circle cx="5" cy="6" r="1.6" />
            <circle cx="5" cy="18" r="1.6" />
            <circle cx="19" cy="6" r="1.6" />
            <circle cx="19" cy="18" r="1.6" />
            <path d="M6.4 6.8l3.5 3.5M6.4 17.2l3.5-3.5M17.6 6.8l-3.5 3.5M17.6 17.2l-3.5-3.5" />
          </svg>
        }
      />
    </div>
  );
}
