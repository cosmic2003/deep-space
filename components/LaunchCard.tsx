"use client";

import { useEffect, useState } from "react";
import { pickImage, type Launch } from "@/lib/sources/launchLibrary";
import { StatusBadge } from "./StatusBadge";

interface Props {
  launch: Launch;
}

const pad2 = (n: number) => n.toString().padStart(2, "0");

function formatNetUtc(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())} UTC`;
}

interface Countdown {
  live: boolean;
  imminent: boolean;
  primary: string;
  sub?: string;
}

function computeCountdown(targetMs: number, nowMs: number): Countdown {
  const ms = targetMs - nowMs;
  if (ms <= 0) return { live: true, imminent: true, primary: "LIVE" };
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d >= 1) {
    return {
      live: false,
      imminent: false,
      primary: `D-${d}`,
      sub: `${h}시간 ${m}분`,
    };
  }
  return {
    live: false,
    imminent: ms <= 60 * 1000,
    primary: `T-${pad2(h)}:${pad2(m)}:${pad2(sec)}`,
  };
}

export function LaunchCard({ launch }: Props) {
  const [open, setOpen] = useState(false);
  const target = new Date(launch.net).getTime();
  // Server render starts with a placeholder so hydration doesn't fight a
  // freshly-computed time on the client.
  const [countdown, setCountdown] = useState<Countdown | null>(null);

  useEffect(() => {
    const tick = () => setCountdown(computeCountdown(target, Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  const image = pickImage(launch);
  const provider = launch.launch_service_provider.name;
  const rocket =
    launch.rocket.configuration.full_name ?? launch.rocket.configuration.name;
  const mission = launch.mission?.name ?? null;
  const padName = launch.pad.name;
  const location = launch.pad.location.name;

  const isImminent = countdown?.imminent ?? false;
  const isLive = countdown?.live ?? false;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setOpen(!open)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen(!open);
        }
      }}
      aria-expanded={open}
      aria-label={`${provider} ${rocket}${mission ? ` ${mission}` : ""} 상세 ${open ? "닫기" : "보기"}`}
      className={`aero-glass aero-glass-hover relative block min-w-0 overflow-hidden rounded-2xl cursor-pointer ${
        isImminent ? "aero-imminent" : ""
      }`}
    >
      {image && (
        <div
          className="absolute inset-0 opacity-[0.07] bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: `url(${image})` }}
          aria-hidden
        />
      )}

      <div className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <h3
            className="text-lg sm:text-xl font-bold tracking-tight truncate min-w-0 leading-tight"
            style={{
              backgroundImage:
                "linear-gradient(120deg, #ffd1e3, #d4b3ff 45%, #b3d4ff)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
            title={provider}
          >
            {provider}
          </h3>
          <StatusBadge status={launch.status} />
        </div>

        {/* Primary countdown */}
        <div className="mt-4 min-h-[44px]">
          {countdown == null ? (
            <span className="inline-block h-9 w-32 rounded bg-white/5" aria-hidden />
          ) : isLive ? (
            <div
              className="flex items-center gap-2 text-3xl sm:text-4xl font-bold tracking-tight"
              style={{ color: "var(--aero-imminent)" }}
            >
              <span
                className="aero-imminent-dot inline-block w-3 h-3 rounded-full"
                style={{ background: "var(--aero-imminent)" }}
                aria-hidden
              />
              LIVE
            </div>
          ) : (
            <div className="flex items-baseline gap-2 flex-wrap">
              <span
                className="text-3xl sm:text-4xl font-bold tracking-tight tabular-nums"
                style={{
                  color: isImminent ? "var(--aero-imminent)" : "#cdd9ff",
                }}
              >
                {countdown.primary}
              </span>
              {countdown.sub && (
                <span className="text-sm text-[var(--aero-text-muted)] font-medium">
                  {countdown.sub}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Mission + vehicle */}
        <div className="mt-2">
          <p className="text-base font-semibold text-zinc-100 leading-snug break-words">
            {mission ?? rocket}
          </p>
          <p className="text-xs text-[var(--aero-text-muted)] mt-0.5 truncate">
            {rocket}
          </p>
        </div>

        {/* Expand hint — fades out when open */}
        <div
          className={`flex items-center gap-1 text-[11px] text-[var(--aero-text-faint)] overflow-hidden transition-all duration-300 ${
            open ? "max-h-0 mt-0 opacity-0" : "max-h-6 mt-3 opacity-100"
          }`}
        >
          자세히 보기
          <span className="inline-block">▾</span>
        </div>

        {/* Collapsible detail */}
        <div
          className={`grid transition-[grid-template-rows] duration-400 ease-out ${
            open ? "grid-rows-[1fr] mt-4" : "grid-rows-[0fr] mt-0"
          }`}
        >
          <div className="overflow-hidden">
            <div
              className="h-px mb-3"
              style={{
                background:
                  "linear-gradient(90deg, transparent, var(--aero-glass-border), transparent)",
              }}
              aria-hidden
            />
            <dl className="space-y-2 text-xs">
              <DetailRow label="발사장" value={`${padName} · ${location}`} />
              <DetailRow label="발사체" value={rocket} />
              {mission && <DetailRow label="탑재체" value={mission} />}
              {launch.mission?.orbit?.name && (
                <DetailRow label="궤도" value={launch.mission.orbit.name} />
              )}
              <DetailRow
                label="예정 시각"
                value={formatNetUtc(launch.net)}
                mono
              />
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-[var(--aero-text-faint)] shrink-0">{label}</dt>
      <dd
        className={`text-zinc-100 text-right break-words min-w-0 ${
          mono ? "font-mono tabular-nums" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
