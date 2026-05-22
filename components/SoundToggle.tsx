"use client";

import { useEffect, useRef, useState } from "react";

const SRC = "/audio/ambient.mp3";
const TARGET_VOLUME = 0.35;       // ambient — never let it dominate the UI
const FADE_IN_MS = 1400;
const FADE_OUT_MS = 900;

export function SoundToggle() {
  // Always boot in the off state. Browser autoplay policies require a real
  // user gesture per session, so persisting "on" across reloads just produced
  // a confusing two-click bug (button looks on, but nothing's playing).
  const [on, setOn] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // Stop any in-flight fade when the component unmounts (page nav, hot reload).
  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.src = "";
      }
    };
  }, []);

  function ensureAudio(): HTMLAudioElement {
    if (audioRef.current) return audioRef.current;
    const audio = new Audio(SRC);
    audio.loop = false;
    audio.preload = "auto";
    audio.volume = 0;
    // When the track ends naturally, flip the UI off so the equalizer stops
    // dancing and the user can click again to replay if they want.
    audio.addEventListener("ended", () => setOn(false));
    audioRef.current = audio;
    return audio;
  }

  function fade(audio: HTMLAudioElement, to: number, durationMs: number, onDone?: () => void) {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    const from = audio.volume;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      audio.volume = from + (to - from) * t;
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
        onDone?.();
      }
    };
    rafRef.current = requestAnimationFrame(step);
  }

  const toggle = async () => {
    const next = !on;
    setOn(next);

    const audio = ensureAudio();
    if (next) {
      try {
        // Restart from the top if the track ended previously.
        if (audio.ended || audio.currentTime > 0) audio.currentTime = 0;
        audio.volume = 0;
        await audio.play();
        fade(audio, TARGET_VOLUME, FADE_IN_MS);
      } catch (e) {
        // Autoplay policy or load error — revert the UI state.
        console.warn("[SoundToggle] play failed:", e);
        setOn(false);
      }
    } else {
      fade(audio, 0, FADE_OUT_MS, () => audio.pause());
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`sound-toggle${on ? " on" : ""}`}
      aria-label={on ? "사운드 끄기" : "사운드 켜기"}
      aria-pressed={on}
    >
      <span className="eq" aria-hidden>
        <span />
        <span />
        <span />
        <span />
      </span>
      {!on && <span className="mute-slash" aria-hidden />}
    </button>
  );
}
