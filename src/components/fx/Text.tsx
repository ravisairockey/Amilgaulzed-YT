import {
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type ReactNode,
  type ElementType,
} from "react";
import { useFinePointer, useInView, useReducedMotion } from "@/lib/hooks";
import { clamp } from "@/lib/fx";

/* ------------------------------------------------------------------ */
/* Random letter swap: duplicate glyphs slide in with staggered delays */
/* ------------------------------------------------------------------ */

const seeded = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

export function SwapText({
  text,
  className = "",
  color,
  seed = 7,
}: {
  text: string;
  className?: string;
  color?: string;
  seed?: number;
}) {
  const chars = useMemo(() => {
    const rnd = seeded(seed + text.length);
    return Array.from(text).map((ch, i) => ({ ch, i, d: Math.round(rnd() * 220) }));
  }, [text, seed]);
  return (
    <span className={`swap ${className}`} style={color ? ({ "--swap-color": color } as CSSProperties) : undefined}>
      <span className="sr-only">{text}</span>
      {chars.map(({ ch, i, d }) => (
        <span key={i} className="swap__ch" style={{ "--d": `${d}ms` } as CSSProperties} aria-hidden="true">
          <span>{ch}</span>
          <span>{ch}</span>
        </span>
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Mesh text: characters warp toward cursor, spring back, chromatic split */
/* ------------------------------------------------------------------ */

export function MeshText({
  text,
  className = "",
  as: Tag = "span",
  strength = 18,
  radius = 220,
}: {
  text: string;
  className?: string;
  as?: ElementType;
  strength?: number;
  radius?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  const active = fine && !reduce;

  useEffect(() => {
    const el = ref.current;
    if (!el || !active) return;
    const chars = Array.from(el.querySelectorAll<HTMLElement>(".mesh__ch"));
    let raf = 0;
    let px = 0;
    let py = 0;
    let inside = false;

    const apply = () => {
      raf = 0;
      for (const c of chars) {
        const r = c.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = px - cx;
        const dy = py - cy;
        const d = Math.hypot(dx, dy);
        const f = clamp(1 - d / radius, 0, 1);
        const e = f * f * (3 - 2 * f);
        const tx = (dx / (d || 1)) * e * strength;
        const ty = (dy / (d || 1)) * e * strength * 0.6;
        c.style.transform = e > 0.001 ? `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)` : "";
        c.style.textShadow =
          e > 0.05
            ? `${(-tx * 0.22).toFixed(2)}px 0 rgba(255,197,170,${(e * 0.7).toFixed(2)}), ${(tx * 0.22).toFixed(2)}px 0 rgba(217,255,244,${(e * 0.7).toFixed(2)})`
            : "";
      }
    };
    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!inside) {
        inside = true;
        el.classList.add("is-live");
      }
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      inside = false;
      el.classList.remove("is-live");
      for (const c of chars) {
        c.style.transform = "";
        c.style.textShadow = "";
      }
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [active, strength, radius]);

  const Comp = Tag as ElementType;
  return (
    <Comp ref={ref} className={`mesh ${className}`}>
      <span className="sr-only">{text}</span>
      {Array.from(text).map((ch, i) => (
        <span key={i} className="mesh__ch" aria-hidden="true">
          {ch}
        </span>
      ))}
    </Comp>
  );
}

/* ------------------------------------------------------------------ */
/* Smoky reveal: words emerge through drifting smoke when in view      */
/* ------------------------------------------------------------------ */

export function SmokeReveal({
  children,
  as: Tag = "h2",
  className = "",
  id,
}: {
  children: string;
  as?: ElementType;
  className?: string;
  id?: string;
}) {
  const [ref, inView] = useInView<HTMLElement>({ threshold: 0.3, rootMargin: "0px 0px -8% 0px" });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  const words = children.split(" ");

  useEffect(() => {
    if (!inView || reduce) return;
    const canvas = canvasRef.current;
    const host = ref.current;
    if (!canvas || !host) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = host.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = rect.width * 1.2;
    const h = rect.height * 1.6;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const puffs = Array.from({ length: 34 }, () => ({
      x: Math.random() * w,
      y: h * 0.45 + Math.random() * h * 0.4,
      r: 26 + Math.random() * 70,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -0.35 - Math.random() * 0.7,
      a: 0.06 + Math.random() * 0.1,
      c: Math.random() > 0.5 ? "238,248,205" : Math.random() > 0.5 ? "255,197,170" : "217,255,244",
    }));
    const start = performance.now();
    const dur = 2100;
    let raf = 0;
    const tick = (now: number) => {
      const t = (now - start) / dur;
      ctx.clearRect(0, 0, w, h);
      if (t >= 1) return;
      const fade = t < 0.25 ? t / 0.25 : 1 - (t - 0.25) / 0.75;
      for (const p of puffs) {
        p.x += p.vx;
        p.y += p.vy;
        p.r += 0.45;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, `rgba(${p.c},${(p.a * fade).toFixed(3)})`);
        g.addColorStop(1, `rgba(${p.c},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, ref]);

  const Comp = Tag as ElementType;
  return (
    <Comp ref={ref} id={id} className={`smoke ${className} ${inView ? "is-in" : ""}`}>
      {!reduce && <canvas ref={canvasRef} className="smoke__fx" aria-hidden="true" />}
      <span className="sr-only">{children}</span>
      {words.map((w, i) => (
        <span key={i} aria-hidden="true">
          <span className="smoke__w" style={{ "--i": i } as CSSProperties}>
            {w}
          </span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Comp>
  );
}

/* ------------------------------------------------------------------ */
/* Ink underline: hand-drawn SVG path that draws itself on hover       */
/* ------------------------------------------------------------------ */

export function Ink({ children, className = "", color }: { children: ReactNode; className?: string; color?: string }) {
  return (
    <span className={`ink ${className}`} style={color ? ({ "--ink-color": color } as CSSProperties) : undefined}>
      {children}
      <svg viewBox="0 0 240 12" preserveAspectRatio="none" aria-hidden="true">
        <path pathLength={1} d="M2 8 C 40 3, 70 11, 110 6 S 180 2, 238 7" />
      </svg>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Magnetic: element leans toward the cursor within a radius           */
/* ------------------------------------------------------------------ */

export function Magnetic({
  children,
  className = "",
  strength = 0.35,
  radius = 90,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
  radius?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || !fine || reduce) return;
    const target = el.firstElementChild as HTMLElement | null;
    if (!target) return;
    target.style.transition = "transform 0.7s cubic-bezier(0.19,1,0.22,1)";
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const d = Math.hypot(dx, dy);
      const limit = Math.max(r.width, r.height) / 2 + radius;
      if (d > limit) {
        target.style.transform = "";
        return;
      }
      target.style.transform = `translate3d(${(dx * strength).toFixed(1)}px, ${(dy * strength).toFixed(1)}px, 0)`;
    };
    const onLeave = () => (target.style.transform = "");
    const zone = el.parentElement ?? el;
    zone.addEventListener("pointermove", onMove);
    zone.addEventListener("pointerleave", onLeave);
    return () => {
      zone.removeEventListener("pointermove", onMove);
      zone.removeEventListener("pointerleave", onLeave);
    };
  }, [fine, reduce, strength, radius]);

  return (
    <div ref={ref} className={`inline-block ${className}`} style={{ padding: fine ? 8 : 0, margin: fine ? -8 : 0 }}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Rise: simple in-view entrance                                       */
/* ------------------------------------------------------------------ */

export function Rise({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: ElementType;
}) {
  const [ref, inView] = useInView<HTMLElement>();
  const Comp = Tag as ElementType;
  return (
    <Comp ref={ref} className={`rise ${className} ${inView ? "is-in" : ""}`} style={{ "--d": `${delay}ms` } as CSSProperties}>
      {children}
    </Comp>
  );
}
