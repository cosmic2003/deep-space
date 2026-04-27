"use client";

import { useState } from "react";
import type { RocketConfiguration } from "@/lib/sources/launchLibrary";
import { getShape } from "@/lib/rocketShape";
import { RocketModel } from "./RocketModel";
import { RocketSpecCard } from "./RocketSpecCard";

interface Props {
  rockets: RocketConfiguration[];
  accentColor: string;
}

export function RocketGallery({ rockets, accentColor }: Props) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const expanded = expandedIdx != null ? rockets[expandedIdx] : null;

  if (expanded) {
    const shape = getShape(expanded);
    const name = expanded.full_name ?? expanded.name;
    return (
      <div>
        <button
          onClick={() => setExpandedIdx(null)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors mb-3"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          카드로 돌아가기
        </button>

        <div className="rounded-2xl border border-zinc-700/60 bg-gradient-to-b from-zinc-900 to-zinc-950 ring-1 ring-inset ring-white/5 overflow-hidden">
          <div className="relative h-[70vh] min-h-[420px]">
            <RocketModel
              length={expanded.length}
              diameter={expanded.diameter}
              accentColor={accentColor}
              shape={shape}
              gltfUrl={shape.gltfUrl}
              enableZoom
              className="absolute inset-0"
            />

            <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-3 pointer-events-none">
              <div className="min-w-0">
                <h4 className="text-base font-bold text-zinc-50 truncate" title={name}>
                  {name}
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  스크롤로 확대/축소 · 드래그로 회전 · 부위에 마우스
                </p>
              </div>
              <button
                onClick={() => setExpandedIdx(null)}
                title="축소"
                aria-label="축소"
                className="pointer-events-auto inline-flex items-center justify-center rounded-md bg-zinc-900/85 backdrop-blur p-1.5 text-zinc-300 ring-1 ring-inset ring-zinc-700 hover:text-sky-300 hover:ring-sky-500/50 hover:bg-zinc-800 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M9 3v5H4M15 3v5h5M9 21v-5H4M15 21v-5h5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rockets.map((rocket, i) => (
        <RocketSpecCard
          key={`${rocket.id ?? rocket.full_name ?? rocket.name}-${i}`}
          rocket={rocket}
          accentColor={accentColor}
          onExpand={() => setExpandedIdx(i)}
        />
      ))}
    </div>
  );
}
