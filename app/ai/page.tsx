import { CompanyFilter } from "@/components/ai/CompanyFilter";
import { DailyDigest } from "@/components/ai/DailyDigest";
import { PostCard } from "@/components/ai/PostCard";
import { Header } from "@/components/Header";
import { getDailyDigest, getRecentPosts } from "@/lib/ai/source";
import type { AICompany } from "@/lib/ai/types";
import { COMPANIES, COMPANY_MAP } from "@/lib/ai/types";

export const revalidate = 600;

export const metadata = {
  title: "AI — Deep Space",
};

const COMPANY_SLUGS = new Set<AICompany>(COMPANIES.map((c) => c.slug));

interface PageProps {
  searchParams: Promise<{ company?: string }>;
}

export default async function AiPage({ searchParams }: PageProps) {
  const { company: rawCompany } = await searchParams;
  const company =
    rawCompany && COMPANY_SLUGS.has(rawCompany as AICompany)
      ? (rawCompany as AICompany)
      : undefined;

  const [posts, digest] = await Promise.all([
    getRecentPosts({ company, limit: 30 }),
    getDailyDigest(),
  ]);

  const now = Date.now();
  const companyLabel = company ? COMPANY_MAP[company].name : null;

  return (
    <div className="min-h-screen text-zinc-100">
      <Header active="ai" />

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-12">
        {digest && <DailyDigest digest={digest} />}

        <section>
          <header className="flex items-end justify-between gap-3 sm:gap-6 mb-5 sm:mb-6 flex-wrap">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-400 mb-2">
                Timeline
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-50">
                {companyLabel ? `${companyLabel} 소식` : "최신 소식"}
              </h2>
            </div>
            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-mono font-medium tabular-nums text-zinc-100">
                {posts.length}
              </div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider">
                posts
              </div>
            </div>
          </header>

          <div className="mb-5 sm:mb-7">
            <CompanyFilter active={company} />
          </div>

          {posts.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {posts.map((p) => (
                <PostCard key={p.id} post={p} now={now} />
              ))}
            </div>
          )}

          <footer className="mt-10 sm:mt-16 pt-6 border-t border-zinc-900 text-xs text-zinc-600 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span>데이터: OpenAI / DeepMind 공식 블로그</span>
            <span>30분마다 자동 갱신</span>
          </footer>
        </section>
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-zinc-700/60 bg-zinc-900 ring-1 ring-inset ring-white/5 p-6 sm:p-10 text-center">
      <p className="text-zinc-400 text-sm">최근 소식이 없습니다.</p>
      <p className="text-zinc-600 text-xs mt-1">
        다른 회사를 선택해보세요.
      </p>
    </div>
  );
}
