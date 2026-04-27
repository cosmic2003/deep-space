import Link from "next/link";
import { pickImage, type Launch } from "@/lib/sources/launchLibrary";
import { Countdown } from "./Countdown";
import { StatusBadge } from "./StatusBadge";

interface Props {
  launch: Launch;
}

const pad2 = (n: number) => n.toString().padStart(2, "0");

function formatNetUtc(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())} UTC`;
}

export function LaunchCard({ launch }: Props) {
  const image = pickImage(launch);
  const provider = launch.launch_service_provider.name;
  const rocket =
    launch.rocket.configuration.full_name ?? launch.rocket.configuration.name;
  const mission = launch.mission?.name ?? null;
  const orbit = launch.mission?.orbit?.name ?? null;
  const padName = launch.pad.name;
  const location = launch.pad.location.name;

  const hoursUntil =
    (new Date(launch.net).getTime() - Date.now()) / 3_600_000;
  const isImminent = hoursUntil > 0 && hoursUntil < 6;
  const isVeryClose = hoursUntil > 0 && hoursUntil < 1;

  const borderClass = isVeryClose
    ? "border-red-500/50 live-soon"
    : isImminent
      ? "border-sky-500/50"
      : "border-zinc-700/60";

  return (
    <Link
      href={`/launch/${launch.id}`}
      prefetch
      className={`group relative block overflow-hidden rounded-xl border bg-zinc-900 ring-1 ring-inset ring-white/5 shadow-md shadow-black/20 transition-all hover:border-zinc-600 hover:bg-zinc-800/80 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/40 ${borderClass}`}
      aria-label={`${provider} ${rocket}${mission ? ` — ${mission}` : ""} 자세히 보기`}
    >
      {image && (
        <div
          className="absolute inset-0 opacity-[0.08] bg-cover bg-center pointer-events-none transition-opacity group-hover:opacity-[0.14]"
          style={{ backgroundImage: `url(${image})` }}
          aria-hidden
        />
      )}

      <div className="relative p-7 flex flex-col gap-5">
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="h-8 w-1.5 rounded-full bg-sky-400 shrink-0" aria-hidden />
            <span className="text-2xl font-bold tracking-tight text-sky-300 truncate">
              {provider}
            </span>
            {isImminent && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-red-300 ring-1 ring-inset ring-red-500/40">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                Live Soon
              </span>
            )}
          </div>
          <StatusBadge status={launch.status} />
        </header>

        <div className="space-y-1.5">
          <h2 className="text-3xl font-bold leading-tight text-zinc-50 tracking-tight">
            {rocket}
          </h2>
          {mission && (
            <p className="text-lg text-zinc-300 leading-snug">{mission}</p>
          )}
        </div>

        <div className="pt-1 scale-[1.3] origin-left inline-block">
          <Countdown netIso={launch.net} />
        </div>

        <dl className="grid grid-cols-1 gap-2.5 text-sm text-zinc-300 pt-3 mt-2 border-t border-zinc-700/50">
          <div className="flex justify-between gap-4 pt-3">
            <dt className="text-zinc-500 uppercase text-base tracking-wider font-semibold self-center">발사 시각</dt>
            <dd className="font-mono text-zinc-100 text-right text-xl tabular-nums">
              {formatNetUtc(launch.net)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500 uppercase text-base tracking-wider font-semibold self-center">발사장</dt>
            <dd className="text-zinc-100 text-right text-xl truncate" title={location}>
              {padName} · {location}
            </dd>
          </div>
          {orbit && (
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500 uppercase text-base tracking-wider font-semibold self-center">궤도</dt>
              <dd className="text-zinc-100 text-right text-xl">{orbit}</dd>
            </div>
          )}
        </dl>

        <div className="flex items-center justify-end text-sm font-medium text-zinc-500 group-hover:text-sky-400 transition-colors">
          자세히 보기
          <svg viewBox="0 0 24 24" className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
