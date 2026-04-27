import Link from "next/link";

interface Props {
  label: string;
  title: string;
  description: string;
  accentFrom: string;
  accentTo: string;
  accentText: string;
  icon: React.ReactNode;
}

export function ComingSoon({
  label,
  title,
  description,
  accentFrom,
  accentTo,
  accentText,
  icon,
}: Props) {
  return (
    <main className="flex items-center justify-center min-h-[calc(100vh-101px)] px-6">
      <div className="text-center max-w-lg">
        <div
          className={`mx-auto h-24 w-24 rounded-3xl bg-gradient-to-br ${accentFrom} ${accentTo} flex items-center justify-center mb-7 shadow-2xl`}
        >
          {icon}
        </div>

        <p className={`text-sm font-bold uppercase tracking-[0.25em] mb-3 ${accentText}`}>
          {label}
        </p>

        <h2 className="text-5xl font-bold tracking-tight text-white mb-4 leading-tight">
          구현 준비중입니다
        </h2>

        <p className="text-lg text-zinc-300 leading-relaxed mb-2">
          {title}
        </p>
        <p className="text-base text-zinc-500 leading-relaxed">
          {description}
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 mt-9 rounded-lg border border-zinc-700/80 bg-zinc-900/60 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-800 hover:text-zinc-50"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          항공우주로 돌아가기
        </Link>
      </div>
    </main>
  );
}
