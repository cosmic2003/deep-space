"use client";

import { useEffect, useState } from "react";

interface Props {
  netIso: string;
}

interface Parts {
  sign: "-" | "+";
  d: number;
  h: number;
  m: number;
  s: number;
  totalSec: number;
}

function diffParts(targetMs: number, nowMs: number): Parts {
  const ms = targetMs - nowMs;
  const sign: "-" | "+" = ms >= 0 ? "-" : "+";
  let abs = Math.abs(ms);
  const totalSec = Math.floor(abs / 1000);
  const d = Math.floor(abs / 86_400_000);
  abs -= d * 86_400_000;
  const h = Math.floor(abs / 3_600_000);
  abs -= h * 3_600_000;
  const m = Math.floor(abs / 60_000);
  abs -= m * 60_000;
  const s = Math.floor(abs / 1000);
  return { sign, d, h, m, s, totalSec: sign === "-" ? totalSec : -totalSec };
}

const pad2 = (n: number) => n.toString().padStart(2, "0");

export function Countdown({ netIso }: Props) {
  const target = new Date(netIso).getTime();
  const [parts, setParts] = useState<Parts>(() => diffParts(target, Date.now()));

  useEffect(() => {
    const tick = () => setParts(diffParts(target, Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  const ahead = parts.totalSec;
  const isPast = parts.sign === "+";
  const isVeryClose = !isPast && ahead < 3600;
  const isImminent = !isPast && ahead < 6 * 3600;

  const numColor = isPast
    ? "text-zinc-500"
    : isVeryClose
      ? "text-red-400"
      : isImminent
        ? "text-sky-400"
        : "text-zinc-50";

  return (
    <div
      suppressHydrationWarning
      className={`font-mono tabular-nums text-3xl font-medium tracking-tight flex items-baseline gap-1 ${numColor}`}
    >
      <span className="text-zinc-500 text-base mr-1">T{parts.sign}</span>
      {parts.d > 0 && (
        <>
          <span>{parts.d}</span>
          <span className="text-zinc-500 text-base mr-1">d</span>
        </>
      )}
      <span>{pad2(parts.h)}</span>
      <span
        className={`text-zinc-600 ${isVeryClose ? "animate-pulse" : ""}`}
      >
        :
      </span>
      <span>{pad2(parts.m)}</span>
      <span
        className={`text-zinc-600 ${isVeryClose ? "animate-pulse" : ""}`}
      >
        :
      </span>
      <span>{pad2(parts.s)}</span>
    </div>
  );
}
