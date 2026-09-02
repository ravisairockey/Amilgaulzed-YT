import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { KineticGrid } from "@/components/fx/Canvas";
import { Ink, Magnetic, MeshText, SwapText } from "@/components/fx/Text";
import { artSource, CHANNEL, STORAGE, featuredGames, type Stats } from "@/data/games";
import { useReducedMotion } from "@/lib/hooks";

const BACKDROPS = ["ELDEN RING", "Red Dead Redemption 2", "Ghost of Tsushima: Director's Cut", "God of War Ragnarök"];

export function Hero({ stats, onEnter }: { stats: Stats; onEnter: () => void }) {
  const reduce = useReducedMotion();
  const [revealed, setRevealed] = useState(false);
  const [active, setActive] = useState(0);
  const [broken, setBroken] = useState<Record<number, boolean>>({});
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const titleRef = useRef<HTMLHeadingElement>(null);
  const artRef = useRef<HTMLDivElement>(null);
  const smokeRef = useRef<HTMLCanvasElement>(null);

  const backdrops = useMemo(
    () =>
      featuredGames()
        .filter((g) => BACKDROPS.includes(g.title))
        .map((g) => ({ game: g, src: artSource(g, "landscape", 1600)?.src ?? "" }))
        .filter((b) => b.src),
    [],
  );

  /* reveal + smoke puffs on mount */
  useEffect(() => {
    const id = requestAnimationFrame(() => setRevealed(true));
    if (reduce) return () => cancelAnimationFrame(id);
    const canvas = smokeRef.current;
    const host = titleRef.current;
    if (!canvas || !host) return () => cancelAnimationFrame(id);
    const ctx = canvas.getContext("2d");
    if (!ctx) return () => cancelAnimationFrame(id);
    const r = host.getBoundingClientRect();
    const w = r.width * 1.2;
    const h = r.height * 1.5;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    const puffs = Array.from({ length: 48 }, () => ({
      x: Math.random() * w,
      y: h * 0.35 + Math.random() * h * 0.5,
      r: 40 + Math.random() * 110,
      vx: (Math.random() - 0.5) * 0.7,
      vy: -0.4 - Math.random() * 0.9,
      a: 0.05 + Math.random() * 0.09,
      c: Math.random() > 0.55 ? "238,248,205" : Math.random() > 0.5 ? "255,197,170" : "217,255,244",
    }));
    const start = performance.now();
    const dur = 2600;
    let raf = 0;
    const tick = (now: number) => {
      const t = (now - start) / dur;
      ctx.clearRect(0, 0, w, h);
      if (t >= 1) return;
      const fade = t < 0.2 ? t / 0.2 : 1 - (t - 0.2) / 0.8;
      for (const p of puffs) {
        p.x += p.vx;
        p.y += p.vy;
        p.r += 0.6;
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
    return () => {
      cancelAnimationFrame(id);
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  /* slow crossfade of featured backdrops */
  useEffect(() => {
    if (reduce || backdrops.length < 2) return;
    const t = setInterval(() => setActive((a) => (a + 1) % backdrops.length), 7000);
    return () => clearInterval(t);
  }, [reduce, backdrops.length]);

  /* scroll-responsive composition */
  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const on = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        const vh = window.innerHeight;
        const p = Math.min(1, y / vh);
        if (titleRef.current) {
          titleRef.current.style.transform = `translate3d(0, ${(y * 0.22).toFixed(1)}px, 0)`;
          titleRef.current.style.opacity = String(1 - p * 0.9);
        }
        if (artRef.current) artRef.current.style.transform = `translate3d(0, ${(y * 0.12).toFixed(1)}px, 0) scale(${1 + p * 0.06})`;
      });
    };
    window.addEventListener("scroll", on, { passive: true });
    return () => {
      window.removeEventListener("scroll", on);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduce]);

  const lines = ["MY", "GAMING", "HISTORY"];

  return (
    <section className="hero wrap" id="top" aria-label="Introduction">
      <div ref={artRef} className="hero__art" aria-hidden="true">
        {backdrops.map((b, i) =>
          broken[i] ? null : (
            <img
              key={b.game.slug}
              src={b.src}
              alt=""
              className={i === active && loaded[i] ? "is-on" : ""}
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : "low"}
              decoding="async"
              onLoad={() => setLoaded((s) => ({ ...s, [i]: true }))}
              onError={() => setBroken((s) => ({ ...s, [i]: true }))}
            />
          ),
        )}
      </div>
      <div className="hero__veil" aria-hidden="true" />
      <KineticGrid className="hero__canvas" />

      <div className="flex items-start justify-between gap-6 pt-2">
        <p className="mono text-fg-dim">
          {CHANNEL.name.toUpperCase()} <span className="text-fg-mute">/</span> GAME VAULT
        </p>
      </div>

      <div className="relative flex items-center py-[6vh]">
        <h1 ref={titleRef} className={`hero__title display display-xxl smoke ${revealed ? "is-in" : ""}`}>
          {!reduce && <canvas ref={smokeRef} className="smoke__fx" aria-hidden="true" />}
          <span className="sr-only">My gaming history</span>
          {lines.map((l, i) => (
            <span key={l} className={`line line--${i + 1} smoke__w`} style={{ "--i": i } as CSSProperties} aria-hidden="true">
              <MeshText text={l} className={i === 2 ? "outline-text" : ""} strength={22} radius={260} />
            </span>
          ))}
        </h1>
      </div>

      <div className="grid gap-8 pb-10 md:grid-cols-12 md:items-end">
        <div className="flex gap-10 md:col-span-5">
          <div>
            <div className="display display-md text-lime">{stats.total}</div>
            <div className="mono text-fg-dim mt-2">Titles</div>
          </div>
          <div>
            <div className="display display-md text-lime">{STORAGE.tb} TB+</div>
            <div className="mono text-fg-dim mt-2">{STORAGE.gb.toLocaleString("en-US", { minimumFractionDigits: 2 })} GB archived</div>
          </div>
        </div>
        <div className="md:col-span-7 md:pl-[8%] flex flex-col gap-6">
          <p className="lede text-fg-dim">
            Every game I have played, and the ones still waiting their turn. A living archive behind the {CHANNEL.name} channel.
          </p>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <Magnetic>
              <button className="btn btn--solid swap-parent" onClick={onEnter} data-cursor="OPEN">
                <SwapText text="ENTER THE VAULT" color="#080909" />
                <span aria-hidden="true">↓</span>
              </button>
            </Magnetic>
            <a className="mono text-fg no-underline ink-parent" href={CHANNEL.url} target="_blank" rel="noopener noreferrer" data-cursor="PLAY">
              <Ink>Watch on YouTube ↗</Ink>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
