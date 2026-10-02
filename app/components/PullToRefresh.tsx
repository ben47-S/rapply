"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

const THRESHOLD = 72;
const RESISTANCE = 0.5;
const MAX_OFFSET = 96;
const RELEASED_OFFSET = 108;
const RESET_MS = 180;
const SLOP = 6;
const RELOAD_FALLBACK_MS = 5000;
// Sous ce décalage, le petit indicateur reste invisible : sans ça il
// apparaissait dès le premier pixel passé SLOP, pour un simple début de
// scroll qui n'a rien à voir avec une intention de "tirer pour actualiser".
const VISIBILITY_DEADZONE = 20;

type Phase = "idle" | "pulling" | "armed" | "refreshing";

type PullToRefreshProps = {
  children: ReactNode;
  enabled?: boolean;
  label?: string;
};

function isInsideVerticalScroller(node: Element | null) {
  let current: HTMLElement | null =
    node instanceof HTMLElement ? node : null;
  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    const scrollable =
      style.overflowY === "auto" ||
      style.overflowY === "scroll" ||
      style.overflowY === "overlay";
    if (scrollable && current.scrollHeight > current.clientHeight + 1) {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

export function PullToRefresh({
  children,
  enabled = true,
  label = "Actualisation",
}: PullToRefreshProps) {
  const [phase, setPhaseState] = useState<Phase>("idle");
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const indicatorRef = useRef<HTMLDivElement | null>(null);
  const phaseRef = useRef<Phase>("idle");
  const baseTopRef = useRef(0);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const offsetRef = useRef(0);
  const activeRef = useRef(false);
  const verticalRef = useRef(false);
  const fallbackRef = useRef<number | null>(null);

  const setPhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  const paint = useCallback((offset: number, refreshing: boolean) => {
    const wrapper = wrapperRef.current;
    if (wrapper) {
      // offset 0 doit vider le transform (pas juste translate3d(0,0,0)) : tout
      // transform non vide fait du wrapper un containing block pour ses
      // descendants position:fixed (les .pwa-sheet-overlay des modales), qui
      // se positionnent alors par rapport à la hauteur du contenu de la page
      // au lieu du viewport.
      wrapper.style.transform = offset === 0 ? "" : `translate3d(0, ${offset}px, 0)`;
    }
    const indicator = indicatorRef.current;
    if (!indicator) return;
    const middle = baseTopRef.current + offset / 2;
    if (refreshing) {
      indicator.style.opacity = "1";
      indicator.style.transform = `translate3d(-50%, ${middle}px, 0) scale(1)`;
      return;
    }
    const progress = Math.min(
      Math.max(offset - VISIBILITY_DEADZONE, 0) / (THRESHOLD - VISIBILITY_DEADZONE),
      1
    );
    indicator.style.opacity = progress.toFixed(3);
    indicator.style.transform =
      `translate3d(-50%, ${middle}px, 0) scale(${(0.55 + progress * 0.45).toFixed(3)}) ` +
      `rotate(${(progress * 180).toFixed(1)}deg)`;
  }, []);

  const settle = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (wrapper) {
      wrapper.style.transition = `transform ${RESET_MS}ms ease-out`;
      wrapper.style.willChange = "";
      void wrapper.offsetHeight;
      wrapper.style.transform = "translate3d(0, 0, 0)";
      window.setTimeout(() => {
        if (wrapperRef.current) {
          wrapperRef.current.style.transition = "";
          wrapperRef.current.style.transform = "";
        }
      }, RESET_MS + 20);
    }
    offsetRef.current = 0;
    activeRef.current = false;
    verticalRef.current = false;
    setPhase("idle");
  }, [setPhase]);

  useEffect(() => {
    if (!enabled) return;

    const onTouchStart = (event: TouchEvent) => {
      activeRef.current = false;
      if (phaseRef.current === "refreshing") return;
      if (event.touches.length > 1) return;
      if (window.scrollY > 0) return;
      const target = event.target as Element | null;
      if (target?.closest(".pwa-sheet-overlay")) return;
      // Un tap sur le header fixe (bouton "Ajouter" compris) a souvent quelques
      // pixels de tremblement avant le touchend — assez pour dépasser SLOP et
      // armer paint()/settle() sur le wrapper. La modale qui s'ouvre juste
      // après se retrouve alors à s'ouvrir pendant la fenêtre où ce transform
      // n'est pas encore vidé, et saute visiblement une fois qu'il l'est.
      if (target?.closest(".mobile-page-header")) return;
      if (isInsideVerticalScroller(target)) return;
      const touch = event.touches[0];
      if (!touch) return;
      const rect = wrapperRef.current?.getBoundingClientRect();
      baseTopRef.current = rect ? rect.top : 0;
      startXRef.current = touch.clientX;
      startYRef.current = touch.clientY;
      offsetRef.current = 0;
      activeRef.current = true;
      verticalRef.current = false;
      const wrapper = wrapperRef.current;
      if (wrapper) {
        wrapper.style.transition = "";
        wrapper.style.willChange = "transform";
      }
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!activeRef.current) return;
      if (event.touches.length > 1) {
        activeRef.current = false;
        return;
      }
      const touch = event.touches[0];
      if (!touch) return;
      const dy = touch.clientY - startYRef.current;
      const dx = touch.clientX - startXRef.current;
      if (!verticalRef.current) {
        if (Math.abs(dy) < SLOP) return;
        if (Math.abs(dy) <= Math.abs(dx)) {
          activeRef.current = false;
          return;
        }
        verticalRef.current = true;
      }
      if (dy <= 0) {
        if (offsetRef.current > 0) {
          offsetRef.current = 0;
          paint(0, false);
          setPhase("idle");
        }
        return;
      }
      if (event.cancelable) event.preventDefault();
      const offset = Math.min(dy * RESISTANCE, MAX_OFFSET);
      offsetRef.current = offset;
      const armed = offset >= THRESHOLD;
      if (phaseRef.current !== (armed ? "armed" : "pulling")) {
        setPhase(armed ? "armed" : "pulling");
      }
      paint(offset, false);
    };

    const onTouchEnd = () => {
      if (!activeRef.current) return;
      activeRef.current = false;
      if (offsetRef.current < THRESHOLD) {
        settle();
        return;
      }
      setPhase("refreshing");
      const wrapper = wrapperRef.current;
      if (wrapper) {
        wrapper.style.transition = "transform 160ms ease-out";
        void wrapper.offsetHeight;
      }
      paint(RELEASED_OFFSET, true);
      if (fallbackRef.current) window.clearTimeout(fallbackRef.current);
      fallbackRef.current = window.setTimeout(settle, RELOAD_FALLBACK_MS);
      window.location.reload();
    };

    const onTouchCancel = () => {
      if (!activeRef.current) return;
      activeRef.current = false;
      settle();
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchCancel);
      if (fallbackRef.current) window.clearTimeout(fallbackRef.current);
    };
  }, [enabled, paint, setPhase, settle]);

  const indicatorClass = [
    "pull-to-refresh",
    phase !== "idle" && "pull-to-refresh--visible",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div
        ref={indicatorRef}
        className={indicatorClass}
        role="status"
        aria-label={label}
      >
        {phase === "refreshing" ? (
          <span className="pull-to-refresh__spinner" aria-hidden="true" />
        ) : (
          <svg
            className="pull-to-refresh__arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M6 13l6 6 6-6" />
          </svg>
        )}
      </div>
      <div ref={wrapperRef}>{children}</div>
    </>
  );
}
