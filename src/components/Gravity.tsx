import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Artwork } from "@/components/fx/LiquidImage";
import { Magnetic, SmokeReveal, SwapText } from "@/components/fx/Text";
import { type Game } from "@/data/games";
import { burst } from "@/lib/fx";

type MatterNS = typeof import("matter-js");

interface Sim {
  M: MatterNS;
  engine: import("matter-js").Engine;
  bodies: import("matter-js").Body[];
  mouse: import("matter-js").MouseConstraint;
  raf: number;
  paused: boolean;
  last: number;
  size: { w: number; h: number };
}

const seededRot = (i: number) => ((i * 37) % 11) - 5; // -5deg .. 5deg, deterministic

export function Gravity({ games, onOpen }: { games: Game[]; onOpen: (g: Game) => void }) {
  const backlog = useMemo(() => games.filter((g) => g.status === "backlog"), [games]);
  const fieldRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const simRef = useRef<Sim | null>(null);
  const [live, setLive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const press = useRef<{ x: number; y: number; t: number } | null>(null);

  const syncDom = useCallback(() => {
    const sim = simRef.current;
    if (!sim) return;
    sim.bodies.forEach((b, i) => {
      const el = itemRefs.current[i];
      if (!el) return;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      el.style.transform = `translate3d(${(b.position.x - w / 2).toFixed(1)}px, ${(b.position.y - h / 2).toFixed(1)}px, 0) rotate(${b.angle.toFixed(3)}rad)`;
    });
  }, []);

  const destroy = useCallback(() => {
    const sim = simRef.current;
    const field = fieldRef.current;
    if (sim) {
      cancelAnimationFrame(sim.raf);
      sim.M.World.clear(sim.engine.world, false);
      sim.M.Engine.clear(sim.engine);
      const el = sim.mouse.mouse.element as HTMLElement;
      // Matter attaches listeners on the element; clearing them keeps native scrolling healthy.
      sim.M.Mouse.clearSourceEvents(sim.mouse.mouse);
      el.style.touchAction = "";
    }
    simRef.current = null;
    itemRefs.current.forEach((el) => {
      if (!el) return;
      el.style.transform = "";
      el.style.width = "";
      el.style.height = "";
    });
    if (field) field.style.height = "";
    setLive(false);
    setPaused(false);
  }, []);

  const drop = useCallback((sim: Sim) => {
    const { M, bodies, size } = sim;
    bodies.forEach((b, i) => {
      const el = itemRefs.current[i];
      const w = el?.offsetWidth ?? 100;
      const x = w / 2 + Math.random() * Math.max(1, size.w - w);
      M.Body.setPosition(b, { x, y: -120 - Math.random() * 480 - i * 12 });
      M.Body.setVelocity(b, { x: (Math.random() - 0.5) * 4, y: 0 });
      M.Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.15);
      M.Body.setAngle(b, (Math.random() - 0.5) * 0.6);
    });
  }, []);

  const enable = useCallback(
    async (e?: { clientX: number; clientY: number }) => {
      const field = fieldRef.current;
      if (!field || simRef.current || loading) return;
      setLoading(true);
      setError(null);
      try {
        const M = (await import("matter-js")) as MatterNS;
        const rect = field.getBoundingClientRect();
        const size = { w: rect.width, h: rect.height };
        field.style.height = `${size.h}px`;

        // Freeze current layout so the switch to absolute positioning is seamless.
        const measured = itemRefs.current.map((el) => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { x: r.left - rect.left + r.width / 2, y: r.top - rect.top + r.height / 2, w: r.width, h: r.height };
        });
        measured.forEach((m, i) => {
          const el = itemRefs.current[i];
          if (!el || !m) return;
          el.style.width = `${m.w}px`;
          el.style.height = `${m.h}px`;
        });

        const engine = M.Engine.create({ gravity: { x: 0, y: 1.1 } });
        const T = 200;
        const walls = [
          M.Bodies.rectangle(size.w / 2, size.h + T / 2, size.w + T * 2, T, { isStatic: true }),
          M.Bodies.rectangle(-T / 2, size.h / 2 - 1000, T, size.h + 4000, { isStatic: true }),
          M.Bodies.rectangle(size.w + T / 2, size.h / 2 - 1000, T, size.h + 4000, { isStatic: true }),
          M.Bodies.rectangle(size.w / 2, -1400, size.w + T * 2, T, { isStatic: true }),
        ];
        const bodies = measured.map((m, i) =>
          M.Bodies.rectangle(m?.x ?? size.w / 2, m?.y ?? 0, m?.w ?? 100, m?.h ?? 150, {
            restitution: 0.42,
            friction: 0.35,
            frictionAir: 0.012,
            density: 0.0025,
            chamfer: { radius: 3 },
            angle: (seededRot(i) * Math.PI) / 180,
          }),
        );
        const mouse = M.Mouse.create(field);
        mouse.pixelRatio = 1;
        // Matter cancels wheel events on its element; keep page scrolling intact.
        const handlers = mouse as unknown as { mousewheel: EventListener };
        for (const type of ["wheel", "mousewheel", "DOMMouseScroll"]) field.removeEventListener(type, handlers.mousewheel);
        const mc = M.MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.18, damping: 0.08, render: { visible: false } } });
        M.Composite.add(engine.world, [...walls, ...bodies, mc]);

        const sim: Sim = { M, engine, bodies, mouse: mc, raf: 0, paused: false, last: performance.now(), size };
        simRef.current = sim;
        setLive(true);
        drop(sim);

        const loop = (now: number) => {
          const s = simRef.current;
          if (!s) return;
          if (!s.paused) {
            const dt = Math.min(1000 / 30, now - s.last);
            M.Engine.update(s.engine, dt);
            syncDom();
          }
          s.last = now;
          s.raf = requestAnimationFrame(loop);
        };
        sim.raf = requestAnimationFrame(loop);
        if (e) burst(e.clientX, e.clientY, { count: 60, spread: 9, shape: "up" });
      } catch {
        setError("Physics could not start on this device. The backlog stays right where it is.");
      } finally {
        setLoading(false);
      }
    },
    [loading, drop, syncDom],
  );

  /* keep the sim honest on resize */
  useEffect(() => {
    if (!live) return;
    let w = window.innerWidth;
    const on = () => {
      if (Math.abs(window.innerWidth - w) > 80) {
        w = window.innerWidth;
        destroy();
      }
    };
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, [live, destroy]);

  useEffect(() => () => destroy(), [destroy]);

  const togglePause = () => {
    const sim = simRef.current;
    if (!sim) return;
    sim.paused = !sim.paused;
    sim.last = performance.now();
    setPaused(sim.paused);
  };

  return (
    <section id="backlog" className="wrap py-[clamp(3rem,7vw,7rem)]" aria-labelledby="backlog-title">
      <div className="grid gap-6 md:grid-cols-12 md:items-end mb-10">
        <SmokeReveal id="backlog-title" className="display display-xl md:col-span-7">
          Still to play
        </SmokeReveal>
        <p className="lede text-fg-dim md:col-span-5">
          {backlog.length} titles installed and waiting. They sit politely until you switch gravity on, then they become toys.
        </p>
      </div>

      <div className={`gravity ${live ? "is-live" : ""}`}>
        <div ref={fieldRef} className="gravity__field" aria-label="Backlog gallery" role="list">
          {backlog.map((g, i) => (
            <button
              key={g.slug}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              role="listitem"
              className="g-item"
              style={{ "--r": `${seededRot(i)}deg` } as CSSProperties}
              data-cursor={live ? "DRAG" : "VIEW"}
              aria-label={`${g.title}${live ? ", draggable" : ""}`}
              onPointerDown={(e) => (press.current = { x: e.clientX, y: e.clientY, t: performance.now() })}
              onPointerUp={(e) => {
                if (!live) return;
                const p = press.current;
                press.current = null;
                // A short, still press counts as a tap even while physics owns the pointer.
                if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) < 6 && performance.now() - p.t < 350) onOpen(g);
              }}
              onClick={(e) => {
                if (live) {
                  if (e.detail === 0) onOpen(g); // keyboard activation
                  return;
                }
                onOpen(g);
              }}
            >
              <Artwork game={g} kind="portrait" width={300} sizes="150px" />
              <span className="g-item__label">{g.title}</span>
            </button>
          ))}
        </div>

        <div className="gravity__controls">
          {!live ? (
            <>
              <Magnetic>
                <button className="btn btn--solid swap-parent" onClick={(e) => enable(e)} disabled={loading} data-cursor="PLAY" aria-describedby="gravity-hint">
                  <SwapText text={loading ? "LOADING" : "ENABLE GRAVITY"} color="#080909" />
                </button>
              </Magnetic>
              <p id="gravity-hint" className="mono text-fg-mute">
                {error ?? "Physics loads only when you ask for it"}
              </p>
            </>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <button className="btn" onClick={togglePause} aria-pressed={paused}>
                  {paused ? "Resume" : "Pause"}
                </button>
                <button className="btn" onClick={() => simRef.current && drop(simRef.current)}>
                  Reset
                </button>
                <button className="btn btn--ghost" onClick={destroy}>
                  Exit physics
                </button>
              </div>
              <p className="mono text-fg-mute">Drag, toss, tap to open</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
