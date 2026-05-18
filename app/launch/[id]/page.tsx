import Link from "next/link";
import { notFound } from "next/navigation";
import { LaunchDetail } from "@/components/LaunchDetail";
import { getLaunchDetail } from "@/lib/sources/launchLibrary";

export const revalidate = 300;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LaunchPage({ params }: Props) {
  const { id } = await params;
  const launch = await getLaunchDetail(id);
  if (!launch) notFound();

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-900/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-50"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            돌아가기
          </Link>
          <span className="text-xs text-zinc-500">Deep Space · Aerospace</span>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 sm:py-10">
        <div className="rounded-2xl border border-zinc-700/80 bg-zinc-900 ring-1 ring-white/5 overflow-hidden">
          <LaunchDetail launch={launch} />
        </div>
      </main>
    </div>
  );
}
