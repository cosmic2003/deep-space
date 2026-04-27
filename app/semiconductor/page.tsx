import { ComingSoon } from "@/components/ComingSoon";
import { Header } from "@/components/Header";

export const metadata = {
  title: "반도체 — Deep Space",
};

export default function SemiconductorPage() {
  return (
    <div className="min-h-screen bg-[#202124] text-zinc-100 relative">
      <Header active="semiconductor" />
      <ComingSoon
        label="Semiconductor"
        title="빅테크 어닝콜 · 공정 노드 · 기술 동향"
        description="TSMC, NVIDIA, Samsung, SK하이닉스 등 주요 반도체 기업의 실시간 신호를 한 곳에서 보실 수 있게 준비 중입니다."
        accentFrom="from-amber-400"
        accentTo="to-orange-500"
        accentText="text-amber-400"
        icon={
          <svg viewBox="0 0 24 24" className="h-12 w-12 text-zinc-950" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="6" y="6" width="12" height="12" rx="1.5" />
            <path d="M9 9h6v6H9z" />
            <path d="M3 10v1M3 13v1M21 10v1M21 13v1M10 3h1M13 3h1M10 21h1M13 21h1" />
            <path d="M6 10H3M6 14H3M21 10h-3M21 14h-3M10 6V3M14 6V3M10 21v-3M14 21v-3" />
          </svg>
        }
      />
    </div>
  );
}
