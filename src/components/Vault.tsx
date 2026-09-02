import { useMemo, type CSSProperties, type MouseEvent, type RefObject } from "react";
import { Artwork } from "@/components/fx/LiquidImage";
import { Ink, SmokeReveal } from "@/components/fx/Text";
import { CATEGORIES, categoryById, type ArtKind, type CategoryId, type Game, type Stats, type Status } from "@/data/games";
import { burst } from "@/lib/fx";
import { useIsMobile } from "@/lib/hooks";

interface TileSpec {
  c: number;
  r: number;
  k: ArtKind;
}

/* Desktop: 12 columns. Nine tiles fill 16 rows exactly, then the cycle repeats. */
const PATTERN_D: TileSpec[] = [
  { c: 5, r: 7, k: "portrait" },
  { c: 7, r: 4, k: "landscape" },
  { c: 4, r: 3, k: "landscape" },
  { c: 3, r: 3, k: "square" },
  { c: 4, r: 6, k: "portrait" },
  { c: 8, r: 5, k: "landscape" },
  { c: 4, r: 4, k: "square" },
  { c: 4, r: 4, k: "square" },
  { c: 4, r: 3, k: "landscape" },
];

/* Mobile: 6 columns, large artwork, paired heights. */
const PATTERN_M: TileSpec[] = [
  { c: 6, r: 4, k: "landscape" },
  { c: 3, r: 5, k: "portrait" },
  { c: 3, r: 5, k: "portrait" },
  { c: 3, r: 4, k: "square" },
  { c: 3, r: 4, k: "square" },
  { c: 6, r: 4, k: "landscape" },
  { c: 3, r: 5, k: "portrait" },
  { c: 3, r: 5, k: "portrait" },
];

export interface VaultFilters {
  category: CategoryId | null;
  status: Status | null;
  q: string;
}

interface VaultProps {
  games: Game[];
  stats: Stats;
  filters: VaultFilters;
  onFilters: (f: Partial<VaultFilters>) => void;
  onOpen: (g: Game) => void;
  searchRef: RefObject<HTMLInputElement | null>;
}

export function applyFilters(games: Game[], f: VaultFilters): Game[] {
  const q = f.q.trim().toLowerCase();
  return games.filter((g) => {
    if (f.category && g.category !== f.category) return false;
    if (f.status && g.status !== f.status) return false;
    if (q) {
      const hay = `${g.title} ${g.studio ?? ""} ${categoryById(g.category).full} ${g.year ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function Vault({ games, stats, filters, onFilters, onOpen, searchRef }: VaultProps) {
  const mobile = useIsMobile();
  const list = useMemo(() => applyFilters(games, filters), [games, filters]);
  const pattern = mobile ? PATTERN_M : PATTERN_D;
  const sig = `${filters.category ?? "all"}-${filters.status ?? "all"}-${mobile ? "m" : "d"}`;

  const pick = (e: MouseEvent, patch: Partial<VaultFilters>) => {
    burst(e.clientX, e.clientY, { count: 14, spread: 4, size: 2, duration: 700 });
    onFilters(patch);
  };

  return (
    <section id="vault" aria-labelledby="vault-title" className="py-[clamp(3rem,7vw,7rem)]">
      <div className="wrap mb-8 md:mb-12 flex flex-wrap items-end justify-between gap-6">
        <SmokeReveal id="vault-title" className="display display-xl">
          The vault
        </SmokeReveal>
        <p className="mono text-fg-dim pb-2" aria-live="polite">
          {list.length === stats.total ? `${stats.total} titles` : `${list.length} of ${stats.total} titles`}
        </p>
      </div>

      <div className="filters">
        <div className="wrap flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="filters__row" role="group" aria-label="Filter by category">
            <button className="chip" aria-pressed={filters.category === null} onClick={(e) => pick(e, { category: null })}>
              All <small>{stats.total}</small>
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                className="chip"
                aria-pressed={filters.category === c.id}
                onClick={(e) => pick(e, { category: filters.category === c.id ? null : c.id })}
              >
                {c.label} <small>{stats.byCategory[c.id]}</small>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 pb-2 lg:pb-0">
            <div className="filters__row !py-0" role="group" aria-label="Filter by status">
              {(["played", "backlog"] as Status[]).map((s) => (
                <button
                  key={s}
                  className="chip"
                  aria-pressed={filters.status === s}
                  onClick={(e) => pick(e, { status: filters.status === s ? null : s })}
                >
                  {s} <small>{s === "played" ? stats.played : stats.backlog}</small>
                </button>
              ))}
            </div>
            <label className="search flex-1 lg:w-64">
              <span className="sr-only">Search the vault</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                ref={searchRef}
                type="search"
                placeholder="Search titles"
                value={filters.q}
                onChange={(e) => onFilters({ q: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    onFilters({ q: "" });
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                autoComplete="off"
              />
              <span className="kbd hidden md:inline" aria-hidden="true">
                ⌘K
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="wrap pt-6 md:pt-10">
        {list.length === 0 ? (
          <div className="py-24 text-center">
            <p className="display display-lg text-fg-dim">Nothing here yet</p>
            <p className="lede text-fg-mute mx-auto mt-4">No title matches this combination. Clear the filters to see the whole collection.</p>
            <button className="btn mt-8" onClick={() => onFilters({ category: null, status: null, q: "" })}>
              Show everything
            </button>
          </div>
        ) : (
          <div className="vault-cq">
            <ul className="vault-grid" key={sig} aria-label="Games">
              {list.map((g, i) => {
                const spec = pattern[i % pattern.length];
                const cat = categoryById(g.category);
                const small = spec.c <= 3 || (mobile && spec.c === 3);
                return (
                  <li
                    key={g.slug}
                    className={`tile ink-parent ${small ? "tile--sm" : ""}`}
                    style={{ gridColumn: `span ${spec.c}`, gridRow: `span ${spec.r}`, "--i": Math.min(i, 24) } as CSSProperties}
                  >
                    <button className="tile__btn" onClick={() => onOpen(g)} data-cursor="VIEW" aria-label={`Open ${g.title}`}>
                      <div className="tile__img">
                        <Artwork
                          game={g}
                          kind={spec.k}
                          width={spec.k === "landscape" ? (spec.c >= 7 ? 1000 : 700) : spec.c >= 5 ? 700 : 500}
                          sizes={mobile ? `${Math.round((spec.c / 6) * 100)}vw` : `${Math.round((spec.c / 12) * 92)}vw`}
                          liquid
                          priority={i < 2}
                        />
                      </div>
                      <div className="tile__cap">
                        <h3 className="tile__title">
                          <Ink>{g.title}</Ink>
                        </h3>
                        <span className={`status status--${g.status}`}>{g.status}</span>
                        <div className="tile__meta mono">
                          <span>{cat.label}</span>
                          {g.year && <span>{g.year}</span>}
                          {g.studio && !small && <span>{g.studio}</span>}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
