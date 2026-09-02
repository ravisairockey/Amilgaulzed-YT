import { useEffect, useState, type CSSProperties } from "react";
import { Rise, SmokeReveal } from "@/components/fx/Text";
import { Artwork } from "@/components/fx/LiquidImage";
import { CATEGORIES, STORAGE, type CategoryId, type Game, type Stats } from "@/data/games";
import { useInView, useReducedMotion } from "@/lib/hooks";

function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [ref, inView] = useInView<HTMLSpanElement>({ threshold: 0.4 });
  const reduce = useReducedMotion();
  const [v, setV] = useState(reduce ? value : 0);
  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setV(value);
      return;
    }
    const start = performance.now();
    const dur = 1400;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - t, 4);
      setV(value * e);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, reduce]);
  return (
    <span ref={ref}>
      {v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </span>
  );
}

export function StatsBand({ stats }: { stats: Stats }) {
  const items = [
    { n: stats.total, label: "Titles in the vault" },
    { n: stats.categories, label: "Categories" },
    { n: stats.played, label: "Played" },
    { n: stats.backlog, label: "In the backlog" },
  ];
  return (
    <section className="wrap py-[clamp(3rem,7vw,7rem)]" aria-label="Collection statistics">
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-5">
        {items.map((it, i) => (
          <Rise key={it.label} className="stat" delay={i * 70}>
            <div className="stat__n">
              <CountUp value={it.n} />
            </div>
            <div className="mono text-fg-dim mt-3">{it.label}</div>
          </Rise>
        ))}
        <Rise className="stat col-span-2 md:col-span-1" delay={280}>
          <div className="stat__n text-peach">
            <CountUp value={STORAGE.tb} decimals={2} />
            <span className="text-[0.4em] align-top ml-1">TB</span>
          </div>
          <div className="mono text-fg-dim mt-3">{STORAGE.gb.toLocaleString("en-US", { minimumFractionDigits: 2 })} GB on disk</div>
        </Rise>
      </div>
    </section>
  );
}

export function CategoryIndex({
  games,
  stats,
  onSelect,
}: {
  games: Game[];
  stats: Stats;
  onSelect: (id: CategoryId) => void;
}) {
  return (
    <section id="categories" className="wrap py-[clamp(3rem,7vw,7rem)]" aria-labelledby="categories-title">
      <div className="grid gap-8 md:grid-cols-12 md:items-end mb-10">
        <SmokeReveal id="categories-title" className="display display-xl md:col-span-8">
          Choose a lane
        </SmokeReveal>
        <p className="lede text-fg-dim md:col-span-4">
          The vault sorts itself into {stats.categories} categories. Pick one and the grid below rearranges around it.
        </p>
      </div>
      <div className="border-b border-line">
        {CATEGORIES.map((c, i) => {
          const sample = games.filter((g) => g.category === c.id && !g.adult).slice(0, 3);
          const count = stats.byCategory[c.id];
          return (
            <button
              key={c.id}
              className="cat-row group"
              onClick={() => onSelect(c.id)}
              data-cursor="FILTER"
              aria-label={`Filter the vault by ${c.full}, ${count} titles`}
            >
              <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 min-w-0">
                <span className="display display-lg group-hover:text-peach transition-colors duration-500">{c.label}</span>
                <span className="mono text-fg-mute">{c.full}</span>
              </div>
              <div className="flex items-end gap-6">
                <div className="cat-row__thumbs hidden sm:flex" aria-hidden="true">
                  {sample.map((g, j) => (
                    <span key={g.slug} style={{ "--i": j } as CSSProperties} className="relative">
                      <Artwork game={g} kind="portrait" width={120} sizes="42px" alt="" />
                    </span>
                  ))}
                </div>
                <span className="display display-md tabular-nums text-fg-dim group-hover:text-fg transition-colors duration-500">
                  {String(count).padStart(2, "0")}
                </span>
              </div>
              <span className="sr-only">{i + 1}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
