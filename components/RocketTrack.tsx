"use client";

import { useEffect, useState } from "react";

interface Props {
  /** Next upcoming launch time as ISO string. */
  targetIso: string;
}

// How far back from T-0 the rocket starts its journey across the track. We
// chose 24h so the motion is perceptible over the course of a day — at T-24h
// rocket sits at the launchpad, at T-0h it's reached orbit.
const WINDOW_MS = 24 * 60 * 60 * 1000;

// SVG viewBox dimensions. The rocket rides a shallow quadratic arc from
// (0, H/2) up to (W/2, 0) and back down to (W, H/2).
const W = 360;
const H = 44;

function pointAt(t: number): { x: number; y: number; angleDeg: number } {
  // Quadratic Bézier with control point at the apex of the arc.
  // P0 = (0, H/2), P1 = (W/2, 0), P2 = (W, H/2).
  const u = 1 - t;
  const x = 2 * u * t * (W / 2) + t * t * W;
  const y = u * u * (H / 2) + t * t * (H / 2);
  // Tangent derivative.
  const dx = 2 * u * (W / 2) + 2 * t * (W / 2);
  const dy = -2 * u * (H / 2) + 2 * t * (H / 2);
  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  return { x, y, angleDeg };
}

export function RocketTrack({ targetIso }: Props) {
  // Initial render uses now=null so the server and the first client render
  // match (both draw the launchpad/empty state). After mount we start ticking.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const target = new Date(targetIso).getTime();
  let progress = 0;
  if (now != null) {
    const remaining = target - now;
    if (remaining <= 0) progress = 1;
    else if (remaining >= WINDOW_MS) progress = 0;
    else progress = 1 - remaining / WINDOW_MS;
  }

  const { x, y, angleDeg } = pointAt(progress);

  // Approximate arc length for dasharray. Quadratic Bézier length is messy
  // analytically; this constant matches the W=360, H=44 path well enough that
  // the trail visually ends at the rocket's nose.
  const arcLen = 364;
  const dashOffset = arcLen * (1 - progress);

  // Hide the whole thing entirely once it's been more than 6h since the
  // launch was due (the listing should have advanced by then anyway).
  if (now != null && now - target > 6 * 60 * 60 * 1000) return null;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="w-full h-9 sm:h-11"
      role="img"
      aria-label="다음 발사까지 카운트다운"
    >
      <defs>
        <linearGradient id="rt-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"  stopColor="#7aa7ff" stopOpacity="0.0" />
          <stop offset="30%" stopColor="#7aa7ff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#c89bff" stopOpacity="0.95" />
        </linearGradient>
        <filter id="rt-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>

      {/* Faint baseline arc so the path is always visible */}
      <path
        d={`M 0 ${H / 2} Q ${W / 2} 0 ${W} ${H / 2}`}
        stroke="rgba(120,150,230,0.18)"
        strokeWidth="1.2"
        fill="none"
        strokeDasharray="3 3"
      />

      {/* The drawn portion (trail) — gradient + glow */}
      <path
        d={`M 0 ${H / 2} Q ${W / 2} 0 ${W} ${H / 2}`}
        stroke="url(#rt-grad)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={arcLen}
        strokeDashoffset={dashOffset}
        filter="url(#rt-glow)"
        style={{ transition: "stroke-dashoffset 1s linear" }}
      />

      {/* Rocket — 2D flat silhouette, nebula purple */}
      <g
        transform={`translate(${x} ${y}) rotate(${angleDeg})`}
        style={{ transition: "transform 1s linear" }}
      >
        {/* Exhaust flame */}
        <path
          d="M -10 -1.4 L -14 0 L -10 1.4 Z"
          fill="#7aa7ff"
          opacity="0.85"
        />
        {/* Body */}
        <path
          d="M -7 -2.4 L 4 -2.4 Q 8 -2.4 9 0 Q 8 2.4 4 2.4 L -7 2.4 Z"
          fill="#c89bff"
        />
        {/* Window highlight */}
        <circle cx="2" cy="0" r="0.9" fill="#06080f" opacity="0.7" />
        {/* Wing */}
        <path d="M -6 -2.4 L -8 -4 L -3 -2.4 Z" fill="#a073e0" />
        <path d="M -6  2.4 L -8  4 L -3  2.4 Z" fill="#a073e0" />
      </g>
    </svg>
  );
}
