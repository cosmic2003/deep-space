"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "soundPref";

export function SoundToggle() {
  const [on, setOn] = useState(false);

  // Restore the visual state from the last visit. We don't auto-start audio:
  // browser autoplay policies require a real user gesture, so the user has
  // to click once per session even if their saved preference is "on".
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(STORAGE_KEY) === "on") setOn(true);
  }, []);

  const toggle = () => {
    const next = !on;
    setOn(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
    } catch {
      // localStorage can throw in private mode / quota — ignore.
    }

    // ───── Hook up audio here when the music file is added ─────
    if (next) {
      // startMusic();
    } else {
      // stopMusic();
    }
    // ───────────────────────────────────────────────────────────
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
