"use client";

import type { RocketConfiguration } from "@/lib/sources/launchLibrary";
import { RocketModel } from "./RocketModel";
import { getShape } from "@/lib/rocketShape";
import { lookupRocket } from "@/lib/rocketKnowledge";

interface Props {
  rocket: RocketConfiguration;
  accentColor?: string;
  /** When provided, renders an expand button on the model area that calls this. */
  onExpand?: () => void;
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

export function RocketSpecCard({ rocket, accentColor = "#38bdf8", onExpand }: Props) {
  const name = rocket.full_name ?? rocket.name;
  const length = rocket.length;
  const diameter = rocket.diameter;
  const mass = rocket.launch_mass;
  const leo = rocket.leo_capacity;
  const gto = rocket.gto_capacity;
  const thrust = rocket.to_thrust;
  const reusable = rocket.reusable;
  const successRate =
    rocket.successful_launches != null && rocket.total_launch_count
      ? (rocket.successful_launches / rocket.total_launch_count) * 100
      : null;

  const shape = getShape(rocket);
  const knowledge = lookupRocket(name, rocket.family);

  return (
    <div className="rounded-xl border border-zinc-700/60 bg-zinc-800/60 ring-1 ring-inset ring-white/5 overflow-hidden">
      <div className="relative bg-gradient-to-b from-zinc-900 to-zinc-950 h-64">
        <RocketModel
          length={length}
          diameter={diameter}
          accentColor={accentColor}
          shape={shape}
          gltfUrl={shape.gltfUrl}
          className="absolute inset-0"
        />
        {reusable && (
          <span className="absolute top-2 left-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300 ring-1 ring-inset ring-emerald-500/40">
            재사용
          </span>
        )}
        {rocket.total_launch_count != null && rocket.total_launch_count > 0 && (
          <span className="absolute top-2 right-2 rounded-full bg-zinc-900/80 backdrop-blur px-2 py-0.5 text-[10px] font-mono text-zinc-300 ring-1 ring-inset ring-zinc-700">
            {rocket.total_launch_count}회
          </span>
        )}
        {onExpand && (
          <button
            onClick={onExpand}
            title="확대"
            aria-label="확대"
            className="absolute bottom-2 right-2 inline-flex items-center justify-center rounded-md bg-zinc-900/80 backdrop-blur p-1.5 text-zinc-300 ring-1 ring-inset ring-zinc-700 hover:text-sky-300 hover:ring-sky-500/50 hover:bg-zinc-800 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5" />
            </svg>
          </button>
        )}
      </div>

      <div className="p-5">
        <h4 className="text-lg font-bold text-zinc-50 leading-tight tracking-tight truncate" title={name}>
          {name}
        </h4>
        {(knowledge?.manufacturer || (rocket.family && rocket.family !== name)) && (
          <p className="text-sm text-zinc-400 mt-1 truncate">
            {knowledge?.manufacturer ?? rocket.family}
          </p>
        )}

        {/* Numerical specs */}
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
          <SpecRow label="길이" value={length != null ? `${fmtNum(length)} m` : null} />
          <SpecRow label="직경" value={diameter != null ? `${fmtNum(diameter)} m` : null} />
          <SpecRow label="질량" value={mass != null ? `${fmtNum(mass, 0)} t` : null} />
          <SpecRow label="추력" value={thrust != null ? `${fmtNum(thrust, 0)} kN` : null} />
          <SpecRow label="LEO" value={fmtPayload(leo)} />
          <SpecRow label="GTO" value={fmtPayload(gto)} />
          {successRate != null && (
            <SpecRow
              label="성공률"
              value={`${successRate.toFixed(0)}%`}
              span2
              accent
            />
          )}
        </dl>

        {/* Engines & propellant */}
        {(knowledge?.firstStageEngines || knowledge?.upperStageEngines) && (
          <div className="mt-4 pt-3 border-t border-zinc-700/50 space-y-2.5">
            {knowledge.firstStageEngines && (
              <EngineBlock
                label="1단"
                engines={knowledge.firstStageEngines}
                propellant={knowledge.firstStagePropellant}
              />
            )}
            {knowledge.upperStageEngines && (
              <EngineBlock
                label="상단"
                engines={knowledge.upperStageEngines}
                propellant={knowledge.upperStagePropellant}
              />
            )}
            {knowledge.notes && (
              <p className="text-[11px] text-zinc-400 italic leading-snug pt-1">
                {knowledge.notes}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SpecRow({
  label,
  value,
  span2,
  accent,
}: {
  label: string;
  value: string | null;
  span2?: boolean;
  accent?: boolean;
}) {
  if (!value) return null;
  return (
    <div
      className={`flex items-baseline justify-between gap-2 ${span2 ? "col-span-2 pt-2 mt-1 border-t border-zinc-700/50" : ""}`}
    >
      <dt className="text-zinc-500 uppercase tracking-wider text-[11px]">{label}</dt>
      <dd
        className={`font-mono tabular-nums truncate ${accent ? "text-sky-300 font-semibold" : "text-zinc-100"}`}
      >
        {value}
      </dd>
    </div>
  );
}

function EngineBlock({
  label,
  engines,
  propellant,
}: {
  label: string;
  engines: string;
  propellant?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2.5 mb-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 shrink-0 min-w-[26px]">
          {label}
        </span>
        <span className="text-sm text-zinc-100 leading-snug">
          {engines}
        </span>
      </div>
      {propellant && (
        <div className="flex items-baseline gap-2.5 pl-[34px]">
          <span className="text-[11px] text-zinc-500">연료</span>
          <span className="text-xs text-zinc-300 font-mono">{propellant}</span>
        </div>
      )}
    </div>
  );
}
