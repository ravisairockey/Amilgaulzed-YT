/**
 * Small effect primitives shared across components.
 * Nothing here runs continuously: bursts create a canvas, animate, then remove it.
 */

export const PALETTE = {
  lime: "#EEF8CD",
  peach: "#FFC5AA",
  mint: "#D9FFF4",
  ink: "#080909",
  surface: "#111313",
} as const;

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- value noise (cheap, deterministic) ---------- */

const hash = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);

export function noise2(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  const u = smooth(xf);
  const v = smooth(yf);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}

/* ---------- spring ---------- */

export interface Spring {
  value: number;
  target: number;
  velocity: number;
}

export const spring = (v = 0): Spring => ({ value: v, target: v, velocity: 0 });

/** Critically-damped-ish spring step. Returns true while still moving. */
export function stepSpring(s: Spring, dt: number, stiffness = 120, damping = 16): boolean {
  const f = (s.target - s.value) * stiffness - s.velocity * damping;
  s.velocity += f * dt;
  s.value += s.velocity * dt;
  const moving = Math.abs(s.velocity) > 0.0005 || Math.abs(s.target - s.value) > 0.0005;
  if (!moving) {
    s.value = s.target;
    s.velocity = 0;
  }
  return moving;
}

/* ---------- particle burst ---------- */

interface BurstOptions {
  count?: number;
  colors?: string[];
  spread?: number;
  size?: number;
  duration?: number;
  gravity?: number;
  /** "up" biases particles upward like embers, "radial" is uniform. */
  shape?: "up" | "radial";
}

/**
 * Fire a short-lived particle burst at viewport coordinates.
 * Creates a full-viewport canvas, animates, and removes itself.
 */
export function burst(x: number, y: number, opts: BurstOptions = {}) {
  if (prefersReducedMotion()) return;
  const {
    count = 42,
    colors = [PALETTE.lime, PALETTE.peach, PALETTE.mint],
    spread = 7,
    size = 3,
    duration = 1100,
    gravity = 0.16,
    shape = "radial",
  } = opts;

  const canvas = document.createElement("canvas");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "80",
  } as CSSStyleDeclaration);
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }
  ctx.scale(dpr, dpr);

  const parts = Array.from({ length: count }, () => {
    const a = shape === "up" ? -Math.PI / 2 + (Math.random() - 0.5) * 1.6 : Math.random() * Math.PI * 2;
    const sp = (0.4 + Math.random() * 0.6) * spread;
    return {
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      r: size * (0.5 + Math.random()),
      c: colors[(Math.random() * colors.length) | 0],
      life: 0.7 + Math.random() * 0.3,
      spin: Math.random() * Math.PI,
    };
  });

  const start = performance.now();
  const tick = (now: number) => {
    const t = (now - start) / duration;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (t >= 1) {
      canvas.remove();
      return;
    }
    for (const p of parts) {
      p.vy += gravity;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      const alpha = Math.max(0, 1 - t / p.life);
      if (alpha <= 0) continue;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.c;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.spin + t * 6);
      ctx.fillRect(-p.r, -p.r * 0.35, p.r * 2, p.r * 0.7);
      ctx.restore();
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ---------- misc ---------- */

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const formatInt = (n: number) => n.toLocaleString("en-US");
export const pad2 = (n: number) => String(n).padStart(2, "0");
