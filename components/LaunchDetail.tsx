import {
  pickImage,
  type LaunchDetail as LaunchDetailType,
  type LauncherStage,
} from "@/lib/sources/launchLibrary";
import { Countdown } from "./Countdown";
import { StatusBadge } from "./StatusBadge";

interface Props {
  launch: LaunchDetailType;
}

const pad2 = (n: number) => n.toString().padStart(2, "0");

function formatUtc(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())} UTC`;
}

function formatLocal(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatYmd(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

export function LaunchDetail({ launch }: Props) {
  const image = pickImage(launch);
  const provider = launch.launch_service_provider.name;
  const rocket =
    launch.rocket.configuration.full_name ?? launch.rocket.configuration.name;
  const mission = launch.mission?.name ?? null;
  const missionDesc = launch.mission?.description ?? null;
  const orbit = launch.mission?.orbit?.name ?? null;
  const missionType = launch.mission?.type ?? null;
  const stages = launch.rocket.launcher_stage ?? [];
  const streams = launch.vidURLs ?? [];
  const infos = launch.infoURLs ?? [];
  const padInfo = launch.pad;

  return (
    <article>
      {/* Hero */}
      <header className="relative overflow-hidden">
        {image && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${image})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/40 via-zinc-900/85 to-zinc-900" />
          </>
        )}
        <div className="relative px-5 pt-10 pb-8 sm:px-14 sm:pt-24 sm:pb-12">
          <div className="flex items-center gap-2.5 sm:gap-3.5 mb-4 sm:mb-5">
            <span className="h-8 sm:h-10 w-1.5 rounded-full bg-sky-400" aria-hidden />
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-sky-300">
              {provider}
            </span>
          </div>
          <h1 className="text-3xl sm:text-6xl font-bold tracking-tight text-zinc-50 leading-[1.1] sm:leading-[1.05]">
            {rocket}
          </h1>
          {mission && (
            <p className="mt-3 sm:mt-4 text-lg sm:text-2xl text-zinc-300 leading-snug">
              {mission}
            </p>
          )}

          <div className="mt-6 sm:mt-8 flex items-center gap-2 sm:gap-3 flex-wrap">
            <StatusBadge status={launch.status} />
            {launch.webcast_live && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold uppercase tracking-wider text-red-300 ring-1 ring-inset ring-red-500/40">
                <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                Live Now
              </span>
            )}
            {launch.probability != null && (
              <span className="text-sm sm:text-base text-zinc-400">
                기상 가능성 <span className="text-zinc-100 font-mono">{launch.probability}%</span>
              </span>
            )}
          </div>

          <div className="mt-7 sm:mt-10 scale-110 sm:scale-[1.6] origin-left inline-block">
            <Countdown netIso={launch.net} />
          </div>
        </div>
      </header>

      {/* Body — each section is its own panel for clear separation */}
      <div className="px-4 sm:px-10 pb-8 sm:pb-12 pt-6 sm:pt-8 space-y-5 sm:space-y-6 bg-zinc-900">
        {/* Time + pad info */}
        <SectionPanel title="발사 정보">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoTile label="발사 시각 (UTC)" value={formatUtc(launch.net)} mono />
            <InfoTile label="발사 시각 (한국)" value={formatLocal(launch.net)} />
            {launch.window_start && launch.window_end && launch.window_start !== launch.window_end && (
              <InfoTile
                label="발사 윈도우"
                value={`${formatUtc(launch.window_start)} ~ ${formatUtc(launch.window_end)}`}
                mono
                span2
              />
            )}
            <InfoTile
              label="발사장"
              value={`${padInfo.name} · ${padInfo.location.name}`}
              href={padInfo.map_url ?? undefined}
              span2
            />
            {orbit && <InfoTile label="궤도" value={orbit} />}
            {missionType && <InfoTile label="미션 타입" value={missionType} />}
            {padInfo.total_launch_count != null && (
              <InfoTile label="발사장 누적 발사" value={`${padInfo.total_launch_count}회`} mono />
            )}
          </div>
        </SectionPanel>

        {missionDesc && (
          <SectionPanel title="미션 설명">
            <p className="text-lg leading-relaxed text-zinc-200 whitespace-pre-line">
              {missionDesc}
            </p>
          </SectionPanel>
        )}

        {stages.length > 0 && (
          <SectionPanel
            title={`부스터 / 코어 (${stages.length})`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {stages.map((s, i) => (
                <BoosterCard key={`${s.launcher?.serial_number ?? "stage"}-${i}`} stage={s} />
              ))}
            </div>
          </SectionPanel>
        )}

        {streams.length > 0 && (
          <SectionPanel title={`라이브 스트림 (${streams.length})`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {streams.map((v, i) => (
                <a
                  key={`${v.url}-${i}`}
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-3 rounded-xl border border-zinc-700/60 bg-zinc-800/60 px-5 py-4 text-lg text-zinc-100 transition-colors hover:border-sky-500/50 hover:bg-sky-500/10 hover:text-sky-200"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-zinc-400 group-hover:text-sky-400 shrink-0" fill="currentColor" aria-hidden>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span className="truncate">
                    {v.title ?? v.type?.name ?? new URL(v.url).hostname}
                  </span>
                </a>
              ))}
            </div>
          </SectionPanel>
        )}

        {infos.length > 0 && (
          <SectionPanel title="관련 자료">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {infos.map((info, i) => (
                <a
                  key={`${info.url}-${i}`}
                  href={info.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-zinc-700/60 bg-zinc-800/60 px-5 py-4 text-lg text-zinc-100 transition-colors hover:border-zinc-500 hover:text-zinc-50 hover:bg-zinc-800"
                >
                  <div className="truncate font-medium">{info.title ?? new URL(info.url).hostname}</div>
                  {info.description && (
                    <div className="text-base text-zinc-400 truncate mt-1">{info.description}</div>
                  )}
                </a>
              ))}
            </div>
          </SectionPanel>
        )}
      </div>
    </article>
  );
}

function SectionPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-700/60 bg-zinc-950/60 ring-1 ring-inset ring-white/5 px-4 py-5 sm:px-8 sm:py-7">
      <h2 className="text-sm sm:text-base font-semibold uppercase tracking-[0.18em] text-zinc-300 mb-4 sm:mb-5 pb-3 border-b border-zinc-800">
        {title}
      </h2>
      {children}
    </section>
  );
}

function InfoTile({
  label,
  value,
  mono,
  span2,
  href,
}: {
  label: string;
  value: string;
  mono?: boolean;
  span2?: boolean;
  href?: string;
}) {
  const inner = (
    <>
      <dt className="text-xs sm:text-sm font-medium uppercase tracking-wider text-zinc-400">
        {label}
      </dt>
      <dd
        className={`mt-1.5 sm:mt-2 text-base sm:text-xl text-zinc-50 break-words ${mono ? "font-mono tabular-nums" : ""}`}
      >
        {value}
      </dd>
    </>
  );
  const cls = `rounded-xl border border-zinc-700/60 bg-zinc-800/60 px-4 py-4 sm:px-6 sm:py-5 ${
    span2 ? "sm:col-span-2" : ""
  } ${href ? "hover:border-sky-500/50 hover:bg-sky-500/5 transition-colors" : ""}`;
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={`block ${cls}`}>
        {inner}
      </a>
    );
  }
  return <div className={cls}>{inner}</div>;
}

function BoosterCard({ stage }: { stage: LauncherStage }) {
  const core = stage.launcher;
  const landing = stage.landing;
  const flights = core?.flights ?? 0;
  const reused = stage.reused ?? (flights > 1);
  const serial = core?.serial_number ?? "—";

  return (
    <div className="rounded-xl border border-zinc-700/60 bg-zinc-800/60 p-6">
      <div className="flex items-baseline justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-mono text-2xl font-semibold text-zinc-50 truncate">
            {serial}
          </span>
          {reused ? (
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-semibold uppercase tracking-wider text-emerald-300 ring-1 ring-inset ring-emerald-500/40">
              재사용
            </span>
          ) : (
            <span className="rounded-full bg-zinc-700/60 px-3 py-1 text-sm font-semibold uppercase tracking-wider text-zinc-300 ring-1 ring-inset ring-zinc-600">
              신규
            </span>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-4xl font-semibold text-sky-300 tabular-nums leading-none">
            {flights}
            <span className="text-base text-zinc-400 ml-1">회</span>
          </div>
          <div className="text-xs text-zinc-400 uppercase tracking-wider mt-1.5">
            누적 비행
          </div>
        </div>
      </div>

      <dl className="space-y-2.5 text-base">
        {stage.launcher_flight_number != null && (
          <Row label="이번 비행 번호">
            <span className="font-mono">{stage.launcher_flight_number}</span>
          </Row>
        )}
        <Row label="첫 비행">
          <span className="font-mono">{formatYmd(core?.first_launch_date)}</span>
        </Row>
        <Row label="마지막 비행">
          <span className="font-mono">{formatYmd(core?.last_launch_date)}</span>
        </Row>
        {landing && (
          <Row label="착륙">
            {landing.attempt ? (
              <span className="text-zinc-100">
                {landing.location?.name ?? "—"}
                {landing.type?.name ? ` · ${landing.type.name}` : ""}
              </span>
            ) : (
              <span className="text-zinc-500">시도 안 함</span>
            )}
          </Row>
        )}
        {core?.status && core.status !== "active" && (
          <Row label="코어 상태">
            <span className="text-zinc-200">{core.status}</span>
          </Row>
        )}
      </dl>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-zinc-400">{label}</dt>
      <dd className="text-zinc-100 text-right truncate">{children}</dd>
    </div>
  );
}
