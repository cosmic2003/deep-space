"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

const SECTORS = ["/", "/ai", "/semiconductor"];
const EASE = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";

function pathToIndex(pathname: string) {
  const idx = SECTORS.indexOf(pathname);
  return idx >= 0 ? idx : 0;
}

interface Props {
  children: ReactNode;       // page.tsx 출력 (search params 있을 때 폴백)
  aerospace: ReactNode;
  ai: ReactNode;
  semiconductor: ReactNode;
  modal: ReactNode;
}

export function SectorCarouselClient({ children, aerospace, ai, semiconductor, modal }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const trackRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const curIdx = useRef(pathToIndex(pathname));
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const isHoriz = useRef<boolean | null>(null);
  const swipeEndTimer = useRef<number | null>(null);

  // Toggle `body.is-swiping` so CSS can drop blur/shadow/star animations while
  // the track is moving (see globals.css). `on=false` defers removal until just
  // after the 0.3s snap transition so effects don't pop back mid-animation.
  const setSwiping = (on: boolean) => {
    if (on) {
      if (swipeEndTimer.current) {
        clearTimeout(swipeEndTimer.current);
        swipeEndTimer.current = null;
      }
      document.body.classList.add("is-swiping");
    } else {
      if (swipeEndTimer.current) clearTimeout(swipeEndTimer.current);
      swipeEndTimer.current = window.setTimeout(() => {
        document.body.classList.remove("is-swiping");
        swipeEndTimer.current = null;
      }, 340);
    }
  };

  // Run after the browser has painted, so the transition's first (main-thread)
  // frame isn't blocked by the React re-renders our side effects trigger
  // (header highlight via `sectorchange`, pathname via pushState). The transform
  // animation is compositor-driven, so work landing mid-animation is harmless —
  // only the start frame is sensitive, which is what caused the release hitch.
  const afterPaint = (fn: () => void) => {
    requestAnimationFrame(() => requestAnimationFrame(fn));
  };

  const slideTo = (index: number, animated: boolean) => {
    const el = trackRef.current;
    if (!el) return;
    if (animated) setSwiping(true);
    el.style.transition = animated ? `transform 0.3s ${EASE}` : "none";
    el.style.transform = `translateX(${-index * 100}vw)`;
    curIdx.current = index;
    if (animated) setSwiping(false);
    const notify = () =>
      window.dispatchEvent(new CustomEvent("sectorchange", { detail: SECTORS[index] }));
    if (animated) afterPaint(notify);
    else notify();
  };

  // 초기 위치 (하이드레이션 후 즉시)
  useEffect(() => {
    slideTo(pathToIndex(pathname), false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 헤더 클릭 등 Next.js 라우터 이동 시 동기화
  useEffect(() => {
    if (searchParams.size > 0) return;
    const target = pathToIndex(pathname);
    // Skip when the URL change came from our own swipe (pushState) — the track
    // is already at/animating to `target`, and re-sliding mid-snap re-writes the
    // transition + re-renders right as the animation starts, dropping frames.
    if (target === curIdx.current) return;
    slideTo(target, true);
  }, [pathname, searchParams]);

  // 브라우저 뒤로/앞으로
  useEffect(() => {
    const onPop = () => slideTo(pathToIndex(window.location.pathname), true);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // 스와이프
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const onStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      touchStartTime.current = Date.now();
      isHoriz.current = null;
    };

    const onMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - touchStartX.current;
      const dy = e.touches[0].clientY - touchStartY.current;

      if (isHoriz.current === null) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        isHoriz.current = Math.abs(dx) > Math.abs(dy) * 1.5;
      }
      if (!isHoriz.current) return;
      e.preventDefault();
      setSwiping(true); // keep effects suppressed during the finger-follow too

      const cur = curIdx.current;
      const rubber = (cur <= 0 && dx > 0) || (cur >= SECTORS.length - 1 && dx < 0);
      const offset = rubber ? dx * 0.2 : dx;

      const el = trackRef.current;
      if (!el) return;
      el.style.transition = "none";
      // Base in vw (matches the snap target unit in slideTo), finger delta in
      // px. Same unit basis = the release snap continues from the exact on-screen
      // position with no recompute/jump.
      el.style.transform = `translateX(calc(${-cur * 100}vw + ${offset}px))`;
    };

    const onEnd = (e: TouchEvent) => {
      if (!isHoriz.current) return;

      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dt = Math.max(1, Date.now() - touchStartTime.current);
      const velocity = Math.abs(dx) / dt;
      const pass = Math.abs(dx) >= 50 || velocity >= 0.4;
      const cur = curIdx.current;

      if (pass && dx < 0 && cur < SECTORS.length - 1) {
        const next = cur + 1;
        slideTo(next, true);
        afterPaint(() => window.history.pushState(null, "", SECTORS[next]));
      } else if (pass && dx > 0 && cur > 0) {
        const prev = cur - 1;
        slideTo(prev, true);
        afterPaint(() => window.history.pushState(null, "", SECTORS[prev]));
      } else {
        slideTo(cur, true); // 스냅백
      }
    };

    wrap.addEventListener("touchstart", onStart, { passive: true });
    wrap.addEventListener("touchmove", onMove, { passive: false });
    wrap.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      wrap.removeEventListener("touchstart", onStart);
      wrap.removeEventListener("touchmove", onMove);
      wrap.removeEventListener("touchend", onEnd);
      if (swipeEndTimer.current) clearTimeout(swipeEndTimer.current);
      document.body.classList.remove("is-swiping");
    };
  }, []);

  // company 필터 등 search params 있을 땐 일반 페이지 렌더
  if (searchParams.size > 0) {
    return (
      <>
        {children}
        {modal}
      </>
    );
  }

  return (
    <>
      <div ref={wrapRef} style={{ overflow: "hidden", width: "100%", height: "100%" }}>
        <div
          ref={trackRef}
          style={{ display: "flex", willChange: "transform", height: "100%" }}
        >
          {[aerospace, ai, semiconductor].map((section, i) => (
            <div key={i} style={{ width: "100vw", flexShrink: 0, height: "100%", overflowY: "auto", overflowX: "hidden" }}>
              {section}
            </div>
          ))}
        </div>
      </div>
      {modal}
    </>
  );
}
