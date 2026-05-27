"use client";

import { useRouter, usePathname } from "next/navigation";
import { useRef, useState, useEffect } from "react";

const SECTORS = ["/", "/ai", "/semiconductor"];

export function SwipeContainer({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [snap, setSnap] = useState(false);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const isHoriz = useRef<boolean | null>(null);
  const navigating = useRef(false);
  const currentIndex = useRef(SECTORS.indexOf(pathname));

  useEffect(() => {
    currentIndex.current = SECTORS.indexOf(pathname);
  }, [pathname]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onStart = (e: TouchEvent) => {
      if (navigating.current) return;
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      touchStartTime.current = Date.now();
      isHoriz.current = null;
      setSnap(false);
    };

    const onMove = (e: TouchEvent) => {
      if (navigating.current) return;
      const dx = e.touches[0].clientX - touchStartX.current;
      const dy = e.touches[0].clientY - touchStartY.current;

      if (isHoriz.current === null) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        isHoriz.current = Math.abs(dx) > Math.abs(dy) * 1.5;
      }

      if (!isHoriz.current) return;
      e.preventDefault();

      const cur = currentIndex.current;
      const atLeft = cur <= 0 && dx > 0;
      const atRight = cur >= SECTORS.length - 1 && dx < 0;
      setOffset(atLeft || atRight ? dx * 0.2 : dx);
    };

    const onEnd = (e: TouchEvent) => {
      if (navigating.current || !isHoriz.current) {
        setOffset(0);
        return;
      }

      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dt = Math.max(1, Date.now() - touchStartTime.current);
      const velocity = Math.abs(dx) / dt;
      const pass = Math.abs(dx) >= 50 || velocity >= 0.4;
      const cur = currentIndex.current;

      if (pass && dx < 0 && cur < SECTORS.length - 1) {
        navigating.current = true;
        setOffset(0);
        router.push(SECTORS[cur + 1]);
        setTimeout(() => { navigating.current = false; }, 500);
      } else if (pass && dx > 0 && cur > 0) {
        navigating.current = true;
        setOffset(0);
        router.push(SECTORS[cur - 1]);
        setTimeout(() => { navigating.current = false; }, 500);
      } else {
        setSnap(true);
        setOffset(0);
      }
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
    };
  }, [router]);

  return (
    <div
      ref={containerRef}
      style={{
        transform: `translateX(${offset}px)`,
        transition: snap ? "transform 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94)" : "none",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}
