"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { RocketConfiguration } from "@/lib/sources/launchLibrary";
import { getShape } from "@/lib/rocketShape";
import { lookupRocket } from "@/lib/rocketKnowledge";
import { RocketModel } from "./RocketModel";

interface Props {
  rocket: RocketConfiguration;
  accentColor: string;
  onClose: () => void;
}

function fmtNum(n: number | null | undefined, decimals = 1): string | null {
  if (n == null || isNaN(n)) return null;
  return n.toLocaleString("en-US", { maximumFractionDigits: decimals });
}

function fmtPayload(kg: number | null | undefined): string | null {
  if (kg == null || isNaN(kg)) return null;
  if (kg >= 1000) {
    return `${(kg / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })} t`;
  }
  return `${kg.toLocaleString("en-US")} kg`;
}

export function RocketDetailModal({ rocket, accentColor, onClose }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (!mounted) return null;

  const name = rocket.full_name ?? rocket.name;
  const shape = getShape(rocket);
  const knowledge = lookupRocket(name, rocket.family);
  const successRate =
    rocket.successful_launches != null && rocket.total_launch_count
      ? (rocket.successful_launches / rocket.total_launch_count) * 100
      : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-6 animate-[fadeIn_120ms_ease-out]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-7xl h-[92vh] rounded-2xl border border-zinc-700/80 bg-zinc-900 ring-1 ring-white/5 overflow-hidden shadow-2xl shadow-black/70 animate-[scaleIn_180ms_cubic-bezier(0.16,1,0.3,1)]">
        <button
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full bg-zinc-900/90 text-zinc-400 ring-1 ring-zinc-800 backdrop-blur transition-colors hover:bg-zinc-800 hover:text-zinc-50"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="grid h-full grid-rows-[minmax(50vh,1fr)_auto] lg:grid-rows-1 lg:grid-cols-[3fr_2fr]">
          {/* Model viewer */}
          <div className="relative bg-gradient-to-b from-zinc-900 to-zinc-950 min-h-0">
            <RocketModel
              length={rocket.length}
              diameter={rocket.diameter}
              accentColor={accentColor}
              shape={shape}
              gltfUrl={shape.gltfUrl}
              enableZoom
              wideTilt
              className="absolute inset-0"
            />
            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 pointer-events-none">
              <span className="rounded-md bg-zinc-900/80 backdrop-blur px-3 py-1.5 text-xs text-zinc-300 ring-1 ring-zinc-700">
                드래그 회전
              </span>
              <span className="rounded-md bg-zinc-900/80 backdrop-blur px-3 py-1.5 text-xs text-zinc-300 ring-1 ring-zinc-700">
                스크롤 줌
              </span>
              <span className="rounded-md bg-zinc-900/80 backdrop-blur px-3 py-1.5 text-xs text-zinc-300 ring-1 ring-zinc-700 hidden sm:inline-block">
                부위에 호버
              </span>
            </div>
          </div>

          {/* Specs panel */}
          <div className="flex flex-col h-full overflow-hidden border-t lg:border-t-0 lg:border-l border-zinc-800">
            <header className="px-7 py-6 border-b border-zinc-800 shrink-0">
              <p
                className="text-xs font-bold uppercase tracking-[0.22em] mb-2"
                style={{ color: accentColor }}
              >
                {knowledge?.manufacturer ?? rocket.family ?? "—"}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-50 leading-tight pr-12">
                {name}
              </h2>
              {rocket.reusable && (
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-300 ring-1 ring-inset ring-emerald-500/40">
                  재사용
                </span>
              )}
            </header>

            <div className="flex-1 overflow-y-auto px-7 py-6 space-y-7 [scrollbar-width:thin] [scrollbar-color:#3f3f46_transparent]">
              <Section title="제원">
                <div className="grid grid-cols-2 gap-3">
                  <Stat label="길이" value={rocket.length != null ? `${fmtNum(rocket.length)} m` : null} mono />
                  <Stat label="직경" value={rocket.diameter != null ? `${fmtNum(rocket.diameter)} m` : null} mono />
                  <Stat label="질량" value={rocket.launch_mass != null ? `${fmtNum(rocket.launch_mass, 0)} t` : null} mono />
                  <Stat label="추력" value={rocket.to_thrust != null ? `${fmtNum(rocket.to_thrust, 0)} kN` : null} mono />
                </div>
              </Section>

              {(rocket.leo_capacity != null || rocket.gto_capacity != null) && (
                <Section title="페이로드 능력">
                  <div className="grid grid-cols-2 gap-3">
                    <Stat label="LEO" value={fmtPayload(rocket.leo_capacity)} mono accent />
                    <Stat label="GTO" value={fmtPayload(rocket.gto_capacity)} mono accent />
                  </div>
                </Section>
              )}

              {(knowledge?.firstStageEngines || knowledge?.upperStageEngines) && (
                <Section title="추진계">
                  <div className="space-y-3">
                    {knowledge.firstStageEngines && (
                      <Stage label="1단" engines={knowledge.firstStageEngines} propellant={knowledge.firstStagePropellant} />
                    )}
                    {knowledge.upperStageEngines && (
                      <Stage label="상단" engines={knowledge.upperStageEngines} propellant={knowledge.upperStagePropellant} />
                    )}
                  </div>
                  {knowledge.notes && (
                    <p className="mt-3 text-sm text-zinc-400 italic leading-relaxed">{knowledge.notes}</p>
                  )}
                </Section>
              )}

              {rocket.total_launch_count != null && rocket.total_launch_count > 0 && (
                <Section title="발사 통계">
                  <div className="grid grid-cols-3 gap-3">
                    <Stat label="총 발사" value={`${rocket.total_launch_count}`} mono />
                    {rocket.successful_launches != null && (
                      <Stat label="성공" value={`${rocket.successful_launches}`} mono />
                    )}
                    {rocket.failed_launches != null && (
                      <Stat label="실패" value={`${rocket.failed_launches}`} mono />
                    )}
                  </div>
                  {successRate != null && (
                    <div className="mt-4 flex items-baseline justify-between gap-3 px-5 py-3.5 rounded-lg bg-sky-500/10 ring-1 ring-inset ring-sky-500/30">
                      <span className="text-sm uppercase tracking-wider text-sky-200/80 font-semibold">
                        성공률
                      </span>
                      <span className="text-3xl font-mono tabular-nums font-bold text-sky-300">
                        {successRate.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </Section>
              )}

              {(rocket.maiden_flight || rocket.launch_cost) && (
                <Section title="추가 정보">
                  <div className="grid grid-cols-1 gap-3">
                    {rocket.maiden_flight && (
                      <Stat label="첫 비행" value={rocket.maiden_flight} mono />
                    )}
                    {rocket.launch_cost && (
                      <Stat label="발사 비용" value={`$${rocket.launch_cost}`} mono />
                    )}
                  </div>
                </Section>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-400 mb-3.5">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Stat({
  label,
  value,
  mono,
  accent,
}: {
  label: string;
  value: string | null;
  mono?: boolean;
  accent?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="rounded-lg bg-zinc-800/50 ring-1 ring-inset ring-zinc-700/50 px-4 py-3">
      <dt className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </dt>
      <dd
        className={`mt-1 text-lg leading-tight ${mono ? "font-mono tabular-nums" : ""} ${
          accent ? "text-sky-300 font-bold" : "text-zinc-50 font-semibold"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function Stage({
  label,
  engines,
  propellant,
}: {
  label: string;
  engines: string;
  propellant?: string;
}) {
  return (
    <div className="rounded-lg bg-zinc-800/50 ring-1 ring-inset ring-zinc-700/50 px-4 py-3.5">
      <div className="flex items-baseline gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 shrink-0 min-w-[36px]">
          {label}
        </span>
        <span className="text-base text-zinc-100 leading-snug">{engines}</span>
      </div>
      {propellant && (
        <div className="flex items-baseline gap-3 mt-2 pl-[48px]">
          <span className="text-xs text-zinc-500">연료</span>
          <span className="text-sm text-zinc-300 font-mono">{propellant}</span>
        </div>
      )}
    </div>
  );
}
