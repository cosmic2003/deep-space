"use client";

import { useEffect, useState } from "react";

interface Props {
  /** Next upcoming launch time as ISO string. */
  targetIso: string;
}

// How far back from T-0 the rocket starts its journey. 24h gives the eye
// something to track over the course of a day.
const WINDOW_MS = 24 * 60 * 60 * 1000;

// Pixel apex of the visible arc the rocket rides — set in CSS pixels so the
// HTML overlay (rocket + label) matches the SVG stroke regardless of width.
const APEX_PX = 16;

// On first mount we switch from "rocket parked at start" to the real progress
// — give that opening sweep a deliberate, easing transition so it doesn't
// snap. After it settles, normal 1s ticks take over.
const INITIAL_TRANSITION = "2.7s cubic-bezier(0.34, 0.0, 0.2, 1)";
const STEADY_TRANSITION = "1s linear";

function formatRemaining(ms: number): string {
  if (ms <= 0) return "발사 완료";
  const s = Math.floor(ms / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (days > 0) return `T-${days}일 ${hours}시간`;
  if (hours > 0) return `T-${hours}시간 ${mins}분`;
  if (mins > 0) return `T-${mins}분 ${secs}초`;
  return `T-${secs}초`;
}

export function RocketTrack({ targetIso }: Props) {
  const [now, setNow] = useState<number | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    setNow(Date.now());
    // Switch to the snappy steady-state transition after the opening sweep.
    const settle = setTimeout(() => setInitialized(true), 2800);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(settle);
      clearInterval(tick);
    };
  }, []);

  const target = new Date(targetIso).getTime();
  let progress = 0;
  let remainingMs = WINDOW_MS;
  if (now != null) {
    remainingMs = target - now;
    if (remainingMs <= 0) progress = 1;
    else if (remainingMs >= WINDOW_MS) progress = 0;
    else progress = 1 - remainingMs / WINDOW_MS;
  }

  // Hide once well past launch — the next-launch fetch will swap in soon anyway.
  if (now != null && now - target > 6 * 60 * 60 * 1000) return null;

  // Bezier-shaped elevation in CSS pixels: P(t) = 4*APEX*(t - t²).
  // Apex at t=0.5, zero at t=0 and t=1.
  const elevation = 4 * APEX_PX * (progress - progress * progress);
  // Slope dy/dt = 4*APEX*(1 - 2t). Convert to deg over the full container
  // width — we don't have the pixel width here, so use a representative one.
  // The visual tilt only needs to be roughly correct; the rocket bobs gently.
  const dyDt = -4 * APEX_PX * (1 - 2 * progress);
  const angleDeg = (Math.atan2(dyDt, 600) * 180) / Math.PI;

  const transition = initialized ? STEADY_TRANSITION : INITIAL_TRANSITION;

  return (
    <div className="relative w-full h-16 sm:h-20" aria-label="다음 발사까지 카운트다운">
      {/* SVG arc (track + drawn trail). preserveAspectRatio=none stretches the
          path horizontally to fill the container; vectorEffect keeps strokes
          a constant pixel width. */}
      <svg
        className="absolute inset-x-0 bottom-0 w-full h-12 sm:h-14"
        viewBox="0 0 100 32"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="rt-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"  stopColor="#7aa7ff" stopOpacity="0" />
            <stop offset="35%" stopColor="#7aa7ff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#c89bff" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Dashed baseline so the path is always visible */}
        <path
          d="M 0 22 Q 50 6 100 22"
          stroke="rgba(120,150,230,0.18)"
          strokeWidth="1.4"
          fill="none"
          strokeDasharray="3 3"
          vectorEffect="non-scaling-stroke"
        />

        {/* Drawn trail — stroke-dasharray reveal */}
        <path
          d="M 0 22 Q 50 6 100 22"
          stroke="url(#rt-grad)"
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1"
          strokeDashoffset={1 - progress}
          vectorEffect="non-scaling-stroke"
          style={{
            filter: "drop-shadow(0 0 4px rgba(200,155,255,0.45))",
            transition: `stroke-dashoffset ${transition}`,
          }}
        />
      </svg>

      {/* Time label — bubble that rides above the rocket */}
      <div
        className="absolute top-0 px-2.5 py-1 rounded-full bg-zinc-900/85 backdrop-blur ring-1 ring-[var(--aero-accent,#c89bff)]/35 text-[11px] font-mono font-semibold tabular-nums text-[#e8edff] whitespace-nowrap pointer-events-none shadow-lg shadow-black/40"
        style={{
          left: `${progress * 100}%`,
          transform: "translateX(-50%)",
          transition: `left ${transition}`,
        }}
      >
        {formatRemaining(remainingMs)}
      </div>

      {/* Rocket — HTML overlay so it stays proportional regardless of SVG stretch */}
      <div
        className="absolute"
        style={{
          left: `${progress * 100}%`,
          bottom: `${24 + elevation}px`,
          transform: `translateX(-50%) rotate(${angleDeg}deg)`,
          transition: `left ${transition}, bottom ${transition}, transform ${transition}`,
        }}
        aria-hidden
      >
        <RocketIcon />
      </div>
    </div>
  );
}

function RocketIcon() {
  // 2D flat rocket — 36×16 footprint. Sized in CSS so it scales with the rest.
  return (
    <svg
      width="36"
      height="16"
      viewBox="-18 -8 36 16"
      className="drop-shadow-[0_0_6px_rgba(200,155,255,0.55)]"
    >
      {/* Exhaust flame */}
      <path d="M -12 -2 L -17 0 L -12 2 Z" fill="#7aa7ff" opacity="0.9" />
      <path d="M -10 -1 L -14 0 L -10 1 Z" fill="#aeb9e0" opacity="0.9" />
      {/* Body */}
      <path
        d="M -9 -3 L 5 -3 Q 11 -3 12 0 Q 11 3 5 3 L -9 3 Z"
        fill="#c89bff"
      />
      {/* Nose accent */}
      <path d="M 8 -3 Q 12 -3 12 0 Q 12 3 8 3 L 8 -3 Z" fill="#e8d3ff" />
      {/* Window */}
      <circle cx="3" cy="0" r="1.1" fill="#06080f" opacity="0.75" />
      {/* Wings */}
      <path d="M -7 -3 L -10 -5 L -3 -3 Z" fill="#a073e0" />
      <path d="M -7  3 L -10  5 L -3  3 Z" fill="#a073e0" />
    </svg>
  );
}
