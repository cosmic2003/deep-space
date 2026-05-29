"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

const SECTORS = ["/", "/ai", "/semiconductor"];
const SNAP_MS = 300;

function pathToIndex(pathname: string) {
  const idx = SECTORS.indexOf(pathname);
  return idx >= 0 ? idx : 0;
}

// easeOutCubic — snappy settle, close to the old cubic-bezier curve.
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

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
  const rafId = useRef<number | null>(null);
  const swipeEndTimer = useRef<number | null>(null);

  // Toggle `body.is-swiping` so CSS can drop blur/shadow/star animations while
  // the track is moving (see globals.css). `on=false` defers removal so effects
  // don't re-raster mid-animation.
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
      }, 60);
    }
  };

  const cancelAnim = () => {
    if (rafId.current != null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  };

  // Current on-screen translateX in px, read from the live transform matrix.
  const currentX = (el: HTMLElement): number => {
    const tr = getComputedStyle(el).transform;
    if (!tr || tr === "none") return -curIdx.current * window.innerWidth;
    try {
      return new DOMMatrix(tr).m41;
    } catch {
      return -curIdx.current * window.innerWidth;
    }
  };

  const setX = (el: HTMLElement, px: number) => {
    el.style.transform = `translateX(${px}px)`;
  };

  // Settle into vw so the resting position survives viewport/orientation changes.
  const settle = (el: HTMLElement, index: number) => {
    el.style.transform = `translateX(${-index * 100}vw)`;
  };

  // Snap to a sector. The animation is a per-frame JS tween (the exact path the
  // finger-drag uses, which is smooth) rather than a CSS transition — switching
  // from JS-driven transform to a CSS transition makes iOS re-raster the layer
  // on the first frame, which was the single hitch on release. All React-
  // triggering side effects (header highlight, URL) run only AFTER the tween, so
  // nothing competes for the main thread while it animates.
  const slideTo = (index: number, animated: boolean, pushUrl = false) => {
    const el = trackRef.current;
    if (!el) return;
    cancelAnim();
    el.style.transition = "none";
    curIdx.current = index;

    const done = () => {
      settle(el, index);
      setSwiping(false);
      window.dispatchEvent(new CustomEvent("sectorchange", { detail: SECTORS[index] }));
      if (pushUrl) window.history.pushState(null, "", SECTORS[index]);
    };

    if (!animated) {
      settle(el, index);
      window.dispatchEvent(new CustomEvent("sectorchange", { detail: SECTORS[index] }));
      return;
    }

    setSwiping(true);
    const startX = currentX(el);
    const targetX = -index * window.innerWidth;
    const dist = targetX - startX;
    if (Math.abs(dist) < 0.5) {
      done();
      return;
    }

    let startTs = 0;
    const step = (ts: number) => {
      if (!startTs) startTs = ts;
      const p = Math.min(1, (ts - startTs) / SNAP_MS);
      setX(el, startX + dist * easeOut(p));
      if (p < 1) {
        rafId.current = requestAnimationFrame(step);
      } else {
        rafId.current = null;
        done();
      }
    };
    rafId.current = requestAnimationFrame(step);
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
    // Skip when the URL change came from our own swipe — we're already there.
    if (target === curIdx.current) return;
    slideTo(target, true);
  }, [pathname, searchParams]);

  // 브라우저 뒤로/앞으로
  useEffect(() => {
    const onPop = () => slideTo(pathToIndex(window.location.pathname), true);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 스와이프
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const onStart = (e: TouchEvent) => {
      cancelAnim(); // grab an in-flight snap so the new drag takes over cleanly
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
      setSwiping(true);

      const cur = curIdx.current;
      const rubber = (cur <= 0 && dx > 0) || (cur >= SECTORS.length - 1 && dx < 0);
      const offset = rubber ? dx * 0.2 : dx;

      const el = trackRef.current;
      if (!el) return;
      el.style.transition = "none";
      setX(el, -cur * window.innerWidth + offset);
    };

    const onEnd = (e: TouchEvent) => {
      if (!isHoriz.current) return;

      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dt = Math.max(1, Date.now() - touchStartTime.current);
      const velocity = Math.abs(dx) / dt;
      const pass = Math.abs(dx) >= 50 || velocity >= 0.4;
      const cur = curIdx.current;

      if (pass && dx < 0 && cur < SECTORS.length - 1) {
        slideTo(cur + 1, true, true);
      } else if (pass && dx > 0 && cur > 0) {
        slideTo(cur - 1, true, true);
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
      cancelAnim();
      if (swipeEndTimer.current) clearTimeout(swipeEndTimer.current);
      document.body.classList.remove("is-swiping");
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
