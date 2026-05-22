"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "soundPref";
const SRC = "/audio/ambient.mp3";
const TARGET_VOLUME = 0.35;       // ambient — never let it dominate the UI
const FADE_IN_MS = 1400;
const FADE_OUT_MS = 900;

export function SoundToggle() {
  const [on, setOn] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // Restore the visual state from the last visit. We don't auto-start audio:
  // browser autoplay policies require a real user gesture, so the user has
  // to click once per session even if their saved preference is "on".
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(STORAGE_KEY) === "on") setOn(true);
  }, []);

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
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;
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
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
    } catch {
      // localStorage can throw in private mode / quota — ignore.
    }

    const audio = ensureAudio();
    if (next) {
      try {
        audio.volume = 0;
        await audio.play();
        fade(audio, TARGET_VOLUME, FADE_IN_MS);
      } catch (e) {
        // Autoplay policy or load error — revert the UI state.
        console.warn("[SoundToggle] play failed:", e);
        setOn(false);
        try { window.localStorage.setItem(STORAGE_KEY, "off"); } catch {}
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
