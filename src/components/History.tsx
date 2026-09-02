import { useEffect, useMemo, useRef, useState } from "react";
import { Artwork } from "@/components/fx/LiquidImage";
import { SmokeReveal } from "@/components/fx/Text";
import { type Game, type Stats } from "@/data/games";
import { useFinePointer, useReducedMotion } from "@/lib/hooks";

export function History({ games, stats, onOpen }: { games: Game[]; stats: Stats; onOpen: (g: Game) => void }) {
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  const [peek, setPeek] = useState<Game | null>(null);
  const peekRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const lineRef = useRef<SVGLineElement>(null);

  const groups = useMemo(() => {
    const map = new Map<number | "undated", Game[]>();
    for (const g of games) {
      const k = g.year ?? "undated";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(g);
    }
    const years = [...map.keys()].filter((k): k is number => typeof k === "number").sort((a, b) => b - a);
    const out: { key: string; label: string; items: Game[] }[] = years.map((y) => ({ key: String(y), label: String(y), items: map.get(y)! }));
    if (map.has("undated")) out.push({ key: "undated", label: "Undated", items: map.get("undated")! });
    return out;
  }, [games]);

  const span = groups.length ? `${groups[groups.length - 1].label === "Undated" ? groups[groups.length - 2]?.label : groups[groups.length - 1].label} to ${groups[0].label}` : "";

  /* artwork peek follows the cursor (desktop only) */
  useEffect(() => {
    if (!fine || !peek) return;
    const el = peekRef.current;
    if (!el) return;
    let x = 0;
    let y = 0;
    let cx = 0;
    let cy = 0;
    let raf = 0;
    const tick = () => {
      cx += (x - cx) * 0.18;
      cy += (y - cy) * 0.18;
      el.style.left = `${cx}px`;
      el.style.top = `${cy}px`;
      raf = requestAnimationFrame(tick);
    };
    const onMove = (e: PointerEvent) => {
      x = e.clientX + 120;
      y = e.clientY - 20;
      if (!raf) {
        cx = x;
        cy = y;
        raf = requestAnimationFrame(tick);
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [fine, peek]);

  /* spine draws itself as the section scrolls through the viewport */
  useEffect(() => {
    if (reduce) return;
    const sec = sectionRef.current;
    const line = lineRef.current;
    if (!sec || !line) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = sec.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.8 - r.top) / (r.height)));
      line.setAttribute("y2", `${(p * 100).toFixed(2)}%`);
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduce]);

  return (
    <section ref={sectionRef} id="history" className="relative py-[clamp(3rem,7vw,7rem)]" aria-labelledby="history-title">
      <svg className="timeline-path hidden md:block" aria-hidden="true">
        <line x1="1" y1="0" x2="1" y2={reduce ? "100%" : "0%"} stroke="#FFC5AA" strokeWidth="2" strokeOpacity="0.5" />
      </svg>
      <svg className="timeline-path hidden md:block" aria-hidden="true">
        <line ref={lineRef} x1="1" y1="0" x2="1" y2="0%" stroke="#FFC5AA" strokeWidth="2" />
      </svg>

      <div className="wrap">
        <div className="grid gap-6 md:grid-cols-12 md:items-end mb-12 md:mb-16">
          <SmokeReveal id="history-title" className="display display-xl md:col-span-7">
            My history
          </SmokeReveal>
          <div className="md:col-span-5">
            <p className="lede text-fg-dim">
              The whole collection laid out by the year each game was released, {span}. Solid titles are played, outlined ones are still in the backlog.
            </p>
            <p className="mono text-fg-mute mt-4">
              {stats.played} played / {stats.backlog} waiting
            </p>
          </div>
        </div>

        <div className="border-b border-line">
          {groups.map((grp) => (
            <div key={grp.key} className="year-row">
              <div className={`year-row__y ${grp.key === "undated" ? "text-fg-mute" : "text-fg"}`}>{grp.label}</div>
              <div className="wall">
                {grp.items.map((g, i) => (
                  <span key={g.slug} className="inline">
                    <button
                      className={`wall__t ${g.status === "backlog" ? "wall__t--backlog" : ""}`}
                      onClick={() => onOpen(g)}
                      onPointerEnter={(e) => e.pointerType === "mouse" && setPeek(g)}
                      onPointerLeave={() => setPeek(null)}
                      onFocus={() => setPeek(g)}
                      onBlur={() => setPeek(null)}
                      data-cursor="VIEW"
                    >
                      {g.title}
                    </button>
                    {i < grp.items.length - 1 && (
                      <span className="wall__sep" aria-hidden="true">
                        {" "}
                        /{" "}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {fine && (
        <div ref={peekRef} className={`peek ${peek ? "is-on" : ""}`} aria-hidden="true">
          {peek && <Artwork key={peek.slug} game={peek} kind="portrait" width={300} sizes="150px" alt="" />}
        </div>
      )}
    </section>
  );
}
