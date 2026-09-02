import { useEffect, useRef } from "react";
import { useFinePointer, useReducedMotion } from "@/lib/hooks";

/**
 * Custom cursor: center dot + ring + contextual label.
 * Desktop (fine pointer) only. Labels come from the nearest `[data-cursor]` ancestor.
 */
export function Cursor() {
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!fine) {
      document.documentElement.classList.remove("fine-pointer");
      return;
    }
    document.documentElement.classList.add("fine-pointer");
    const root = rootRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!root || !ring || !label) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;
    let raf = 0;
    let visible = false;
    const ease = reduce ? 1 : 0.22;

    const frame = () => {
      rx += (x - rx) * ease;
      ry += (y - ry) * ease;
      root.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      ring.style.transform = `translate3d(${rx - x}px, ${ry - y}px, 0)`;
      if (Math.abs(rx - x) > 0.1 || Math.abs(ry - y) > 0.1) raf = requestAnimationFrame(frame);
      else raf = 0;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX;
      y = e.clientY;
      if (!visible) {
        visible = true;
        root.classList.remove("is-hidden");
      }
      const target = (e.target as Element | null)?.closest?.("[data-cursor]") as HTMLElement | null;
      const text = target?.dataset.cursor ?? "";
      if (text !== label.textContent) label.textContent = text;
      root.classList.toggle("has-label", !!text);
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const onDown = () => root.classList.add("is-down");
    const onUp = () => root.classList.remove("is-down");
    const onLeave = () => {
      visible = false;
      root.classList.add("is-hidden");
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
      document.documentElement.classList.remove("fine-pointer");
    };
  }, [fine, reduce]);

  if (!fine) return null;
  return (
    <div ref={rootRef} className="cursor is-hidden" aria-hidden="true">
      <div className="cursor__dot" />
      <div ref={ringRef} className="cursor__ring">
        <span ref={labelRef} className="cursor__label" />
      </div>
    </div>
  );
}

/** Minimal scroll progress hairline. */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      bar.style.transform = `scaleX(${p.toFixed(4)})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div className="progress" aria-hidden="true">
      <div ref={barRef} className="progress__bar" />
    </div>
  );
}
