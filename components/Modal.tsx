"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  children: React.ReactNode;
}

export function Modal({ children }: Props) {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        router.back();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [router]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-md sm:items-center sm:p-8 animate-[fadeIn_120ms_ease-out]"
      onClick={(e) => {
        if (e.target === e.currentTarget) router.back();
      }}
    >
      <div
        className="relative my-auto w-full max-w-[1500px] overflow-hidden rounded-2xl border border-zinc-700/80 bg-zinc-900 shadow-2xl shadow-black/70 ring-1 ring-white/5 animate-[scaleIn_180ms_cubic-bezier(0.16,1,0.3,1)]"
      >
        <button
          onClick={() => router.back()}
          className="absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-full bg-zinc-900/90 text-zinc-400 ring-1 ring-zinc-800 backdrop-blur transition-colors hover:bg-zinc-800 hover:text-zinc-50"
          aria-label="닫기"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <div className="max-h-[90vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
