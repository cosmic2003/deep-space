"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const SECTORS = ["/", "/ai", "/semiconductor"];

export function SwipeNavigator() {
  const router = useRouter();
  const pathname = usePathname();
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      touchStartX.current = null;

      if (Math.abs(dx) < 60) return;

      const current = SECTORS.indexOf(pathname);
      if (current === -1) return;

      if (dx < 0 && current < SECTORS.length - 1) {
        router.push(SECTORS[current + 1]);
      } else if (dx > 0 && current > 0) {
        router.push(SECTORS[current - 1]);
      }
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pathname, router]);

  return null;
}
