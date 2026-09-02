import { useEffect, useRef } from "react";
import { WaveArc } from "@/components/fx/Canvas";
import { Artwork } from "@/components/fx/LiquidImage";
import { Ink, SmokeReveal } from "@/components/fx/Text";
import { categoryById, featuredGames, type Game } from "@/data/games";
import { useFinePointer } from "@/lib/hooks";

export function Featured({ onOpen }: { onOpen: (g: Game) => void }) {
  const games = featuredGames();
  const stripRef = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();

  /* drag-to-scroll with momentum (desktop); native touch scrolling on mobile */
  useEffect(() => {
    const el = stripRef.current;
    if (!el || !fine) return;
    let down = false;
    let moved = false;
    let startX = 0;
    let startLeft = 0;
    let vel = 0;
    let lastX = 0;
    let raf = 0;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      down = true;
      moved = false;
      startX = e.clientX;
      lastX = e.clientX;
      startLeft = el.scrollLeft;
      vel = 0;
      if (raf) cancelAnimationFrame(raf);
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4 && !moved) {
        moved = true;
        el.classList.add("is-dragging");
      }
      if (moved) {
        el.scrollLeft = startLeft - dx;
        vel = e.clientX - lastX;
        lastX = e.clientX;
      }
    };
    const glide = () => {
      if (Math.abs(vel) < 0.3) return;
      el.scrollLeft -= vel;
      vel *= 0.94;
      raf = requestAnimationFrame(glide);
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      if (moved) {
        // keep clicks from firing after a drag
        setTimeout(() => el.classList.remove("is-dragging"), 50);
        raf = requestAnimationFrame(glide);
      }
    };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [fine]);

  return (
    <section id="featured" className="relative isolate py-[clamp(3rem,7vw,7rem)] overflow-hidden" aria-labelledby="featured-title">
      <WaveArc className="absolute inset-0 w-full h-full -z-10" lines={6} tint="255,197,170" />
      <div className="wrap grid gap-6 md:grid-cols-12 md:items-end mb-10 md:mb-14">
        <SmokeReveal id="featured-title" className="display display-xl md:col-span-7">
          The ones that stayed
        </SmokeReveal>
        <p className="lede text-fg-dim md:col-span-5 md:pb-2">
          {games.length} titles that shaped how I play. Drag through them, or open one to read why it earned a place here.
        </p>
      </div>

      <div ref={stripRef} className="strip" data-cursor="DRAG" role="list" aria-label="Featured games">
        {games.map((g, i) => {
          const cat = categoryById(g.category);
          return (
            <button
              key={g.slug}
              role="listitem"
              className="feat ink-parent group"
              onClick={() => onOpen(g)}
              data-cursor="VIEW"
              aria-label={`Open ${g.title}`}
            >
              <div className="feat__img">
                <Artwork game={g} kind={i % 3 === 2 ? "square" : "portrait"} width={i % 3 === 2 ? 640 : 480} sizes="(max-width: 767px) 70vw, 28vw" liquid priority={i < 3} />
              </div>
              <div className="mt-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="display-md display text-fg" style={{ fontSize: "clamp(1.15rem, 1.6vw, 1.7rem)" }}>
                    <Ink>{g.title}</Ink>
                  </h3>
                  <p className="mono text-fg-mute mt-2">
                    {cat.label}
                    {g.year ? ` / ${g.year}` : ""}
                  </p>
                </div>
                <span className="mono text-fg-mute pt-1 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              </div>
            </button>
          );
        })}
        <div className="flex-none w-[var(--gutter)]" aria-hidden="true" />
      </div>
    </section>
  );
}
