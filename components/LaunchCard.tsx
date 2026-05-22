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

  // Imminent / very-close override the default glass border tint so the card
  // visually escalates as launch approaches.
  const accentBorder = isVeryClose
    ? "!border-red-400/55 live-soon"
    : isImminent
      ? "!border-[#c89bff]/55"
      : "";

  return (
    <Link
      href={`/launch/${launch.id}`}
      prefetch
      className={`aero-glass aero-glass-hover group relative block min-w-0 overflow-hidden rounded-2xl ${accentBorder}`}
      aria-label={`${provider} ${rocket}${mission ? ` — ${mission}` : ""} 자세히 보기`}
    >
      {image && (
        <div
          className="absolute inset-0 opacity-[0.07] bg-cover bg-center pointer-events-none transition-opacity group-hover:opacity-[0.12]"
          style={{ backgroundImage: `url(${image})` }}
          aria-hidden
        />
      )}

      <div className="relative p-4 sm:p-5 flex flex-col gap-3">
        <header className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="h-5 w-1 rounded-full shrink-0"
              style={{ backgroundColor: "#c89bff" }}
              aria-hidden
            />
            <span
              className="text-sm font-bold tracking-tight truncate"
              style={{ color: "#c89bff" }}
            >
              {provider}
            </span>
            {isImminent && (
              <span className="aero-badge !text-[10px] !py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c89bff] animate-pulse" />
                Live
              </span>
            )}
          </div>
          <StatusBadge status={launch.status} />
        </header>

        <div className="space-y-0.5 min-w-0">
          <h2 className="text-base sm:text-lg font-bold leading-tight text-zinc-50 tracking-tight break-words">
            {rocket}
          </h2>
          {mission && (
            <p className="text-sm text-[var(--aero-text-secondary)] leading-snug truncate">
              {mission}
            </p>
          )}
        </div>

        <div>
          <Countdown netIso={launch.net} />
        </div>

        <dl className="grid grid-cols-1 gap-1.5 text-xs pt-2 mt-1 border-t border-[var(--aero-glass-border)]">
          <div className="flex justify-between gap-2 pt-1.5">
            <dt className="text-[var(--aero-text-muted)] uppercase text-[10px] tracking-wider font-semibold self-center shrink-0">
              발사 시각
            </dt>
            <dd className="font-mono text-zinc-100 text-right text-xs tabular-nums">
              {formatNetUtc(launch.net)}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-[var(--aero-text-muted)] uppercase text-[10px] tracking-wider font-semibold self-center shrink-0">
              발사장
            </dt>
            <dd className="text-zinc-100 text-right text-xs truncate min-w-0" title={location}>
              {padName} · {location}
            </dd>
          </div>
          {orbit && (
            <div className="flex justify-between gap-2">
              <dt className="text-[var(--aero-text-muted)] uppercase text-[10px] tracking-wider font-semibold self-center shrink-0">
                궤도
              </dt>
              <dd className="text-zinc-100 text-right text-xs truncate">{orbit}</dd>
            </div>
          )}
        </dl>

        <div className="flex items-center justify-end text-xs font-medium text-[var(--aero-text-muted)] group-hover:text-[#c89bff] transition-colors">
          자세히 보기
          <svg
            viewBox="0 0 24 24"
            className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
