"use client";

import { useState } from "react";
import type { RocketConfiguration } from "@/lib/sources/launchLibrary";
import { RocketSpecCard } from "./RocketSpecCard";
import { RocketDetailModal } from "./RocketDetailModal";

interface Props {
  rockets: RocketConfiguration[];
  accentColor: string;
}

export function RocketGallery({ rockets, accentColor }: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const selected = selectedIdx != null ? rockets[selectedIdx] : null;

  return (
    <>
      <div className="space-y-3">
        {rockets.map((rocket, i) => (
          <RocketSpecCard
            key={`${rocket.id ?? rocket.full_name ?? rocket.name}-${i}`}
            rocket={rocket}
            accentColor={accentColor}
            onExpand={() => setSelectedIdx(i)}
          />
        ))}
      </div>
      {selected && (
        <RocketDetailModal
          rocket={selected}
          accentColor={accentColor}
          onClose={() => setSelectedIdx(null)}
        />
      )}
    </>
  );
}
