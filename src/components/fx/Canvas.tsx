import { useEffect, useRef } from "react";
import { useFinePointer, useIsMobile, useReducedMotion } from "@/lib/hooks";
import { noise2 } from "@/lib/fx";

interface Pt {
  x: number;
  y: number;
  ox: number;
  oy: number;
  vx: number;
  vy: number;
}

/**
 * Reactive kinetic grid: a mesh of points attracted by the cursor and rippled
 * by a slow travelling wave, plus a sparse drift of atmospheric particles.
 * Opacity stays low so artwork and type remain dominant.
 */
export function KineticGrid({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  const mobile = useIsMobile();
  const fine = useFinePointer();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let pts: Pt[] = [];
    let cols = 0;
    let rows = 0;
    const spacing = mobile ? 56 : 44;
    const mouse = { x: -9999, y: -9999, vx: 0, vy: 0, px: -9999, py: -9999 };
    const particles = Array.from({ length: mobile ? 22 : 48 }, () => ({
      x: Math.random(),
      y: Math.random(),
      s: 0.6 + Math.random() * 1.6,
      sp: 0.00006 + Math.random() * 0.00012,
      o: 0.15 + Math.random() * 0.4,
      ph: Math.random() * Math.PI * 2,
    }));

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / spacing) + 2;
      rows = Math.ceil(h / spacing) + 2;
      pts = [];
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const x = i * spacing - spacing / 2;
          const y = j * spacing - spacing / 2;
          pts.push({ x, y, ox: x, oy: y, vx: 0, vy: 0 });
        }
      }
    };

    let raf = 0;
    let running = false;
    let last = performance.now();
    let t = 0;

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      ctx.clearRect(0, 0, w, h);

      mouse.vx = Math.max(-50, Math.min(50, mouse.x - mouse.px));
      mouse.vy = Math.max(-50, Math.min(50, mouse.y - mouse.py));
      mouse.px = mouse.x;
      mouse.py = mouse.y;
      const speed = Math.min(40, Math.hypot(mouse.vx, mouse.vy));

      const R = 190;
      for (const p of pts) {
        // wave
        const wave = Math.sin(p.ox * 0.012 + t * 0.9) * Math.cos(p.oy * 0.01 - t * 0.6) * 4;
        let tx = p.ox + wave;
        let ty = p.oy + wave * 0.6;
        // cursor attraction + velocity push
        const dx = mouse.x - p.ox;
        const dy = mouse.y - p.oy;
        const d = Math.hypot(dx, dy);
        if (d < R) {
          const f = (1 - d / R) ** 2;
          tx += dx * f * 0.35 + mouse.vx * f * 0.6;
          ty += dy * f * 0.35 + mouse.vy * f * 0.6;
        }
        p.vx += (tx - p.x) * 0.09;
        p.vy += (ty - p.y) * 0.09;
        p.vx *= 0.82;
        p.vy *= 0.82;
        p.x += p.vx;
        p.y += p.vy;
      }

      // lines
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(217,255,244,${0.07 + speed * 0.0012})`;
      ctx.beginPath();
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const p = pts[j * cols + i];
          if (i < cols - 1) {
            const q = pts[j * cols + i + 1];
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
          }
          if (j < rows - 1) {
            const q = pts[(j + 1) * cols + i];
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
          }
        }
      }
      ctx.stroke();

      // nodes near cursor glow slightly
      ctx.fillStyle = "rgba(238,248,205,0.55)";
      for (const p of pts) {
        const d = Math.hypot(mouse.x - p.x, mouse.y - p.y);
        if (d < R) {
          const f = 1 - d / R;
          ctx.globalAlpha = f * 0.6;
          ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
        }
      }
      ctx.globalAlpha = 1;

      // particles
      for (const s of particles) {
        s.y -= s.sp * 60 * dt * 16;
        s.x += Math.sin(t * 0.4 + s.ph) * 0.00008 * 60 * dt * 16;
        if (s.y < -0.02) {
          s.y = 1.02;
          s.x = Math.random();
        }
        const a = s.o * (0.6 + 0.4 * Math.sin(t * 1.5 + s.ph));
        ctx.fillStyle = `rgba(255,197,170,${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.s, 0, Math.PI * 2);
        ctx.fill();
      }

      if (running) raf = requestAnimationFrame(draw);
    };

    const drawStatic = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(217,255,244,0.18)";
      for (const p of pts) ctx.fillRect(p.ox - 0.5, p.oy - 0.5, 1, 1);
    };

    const start = () => {
      if (reduce) {
        drawStatic();
        return;
      }
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(draw);
    };
    const stop = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    build();
    const onResize = () => {
      build();
      if (reduce) drawStatic();
    };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0.02 });
    io.observe(canvas);
    window.addEventListener("resize", onResize);
    if (fine) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("mouseleave", onLeave);
    }
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      io.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [reduce, mobile, fine]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}

/**
 * Wave arcs: soft bezier ribbons driven by value noise. Amplitude responds to
 * scroll velocity; the cursor gently bends the nearest arcs.
 */
export function WaveArc({ className = "", lines = 5, tint = "217,255,244" }: { className?: string; lines?: number; tint?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  const mobile = useIsMobile();
  const fine = useFinePointer();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let w = 0;
    let h = 0;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    let raf = 0;
    let running = false;
    let t = 0;
    let last = performance.now();
    let lastY = window.scrollY;
    let vel = 0;
    const mouse = { x: -9999, y: -9999 };
    const segs = mobile ? 18 : 36;

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt * (reduce ? 0 : 1);
      const sy = window.scrollY;
      vel += ((sy - lastY) - vel) * 0.1;
      lastY = sy;
      const amp = Math.min(1.8, 1 + Math.abs(vel) * 0.02);

      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      for (let l = 0; l < lines; l++) {
        const base = h * (0.2 + (0.6 * l) / Math.max(1, lines - 1));
        ctx.strokeStyle = `rgba(${tint},${(0.05 + (l % 2) * 0.03).toFixed(3)})`;
        ctx.beginPath();
        let prevX = 0;
        let prevY = base;
        for (let i = 0; i <= segs; i++) {
          const x = (w * i) / segs;
          const n = noise2(i * 0.28 + l * 3.1, t * 0.35 + l * 0.7) - 0.5;
          let y = base + n * h * 0.22 * amp;
          const dx = x - mouse.x;
          const dy = y - mouse.y;
          const d = Math.hypot(dx, dy);
          if (d < 240) y += ((240 - d) / 240) ** 2 * (dy > 0 ? 40 : -40);
          if (i === 0) ctx.moveTo(x, y);
          else {
            const cx = (prevX + x) / 2;
            ctx.quadraticCurveTo(prevX, prevY, cx, (prevY + y) / 2);
          }
          prevX = x;
          prevY = y;
        }
        ctx.lineTo(w, prevY);
        ctx.stroke();
      }
      if (running && !reduce) raf = requestAnimationFrame(render);
    };

    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0.02 });
    io.observe(canvas);
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    if (fine && !reduce) window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      stop();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, [reduce, mobile, fine, lines, tint]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
