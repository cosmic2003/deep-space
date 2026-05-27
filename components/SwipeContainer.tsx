"use client";

import { useRouter, usePathname } from "next/navigation";
import { useRef, useEffect } from "react";

const SECTORS = ["/", "/ai", "/semiconductor"];
const EASE = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";

export function SwipeContainer({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
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

    const move = (x: number, animated: boolean) => {
      el.style.transition = animated ? `transform 0.28s ${EASE}` : "none";
      el.style.transform = `translateX(${x}px)`;
    };

    const onStart = (e: TouchEvent) => {
      if (navigating.current) return;
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      touchStartTime.current = Date.now();
      isHoriz.current = null;
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
      const rubber = (cur <= 0 && dx > 0) || (cur >= SECTORS.length - 1 && dx < 0);
      move(rubber ? dx * 0.2 : dx, false);
    };

    const onEnd = (e: TouchEvent) => {
      if (navigating.current || !isHoriz.current) {
        move(0, false);
        return;
      }
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dt = Math.max(1, Date.now() - touchStartTime.current);
      const velocity = Math.abs(dx) / dt;
      const pass = Math.abs(dx) >= 50 || velocity >= 0.4;
      const cur = currentIndex.current;

      if (pass && dx < 0 && cur < SECTORS.length - 1) {
        navigating.current = true;
        move(0, false);
        router.push(SECTORS[cur + 1]);
        setTimeout(() => { navigating.current = false; }, 600);
      } else if (pass && dx > 0 && cur > 0) {
        navigating.current = true;
        move(0, false);
        router.push(SECTORS[cur - 1]);
        setTimeout(() => { navigating.current = false; }, 600);
      } else {
        move(0, true);
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
    <div ref={containerRef} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}
