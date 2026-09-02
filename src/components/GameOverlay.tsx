import { useEffect, useRef } from "react";
import { Artwork } from "@/components/fx/LiquidImage";
import { MeshText, SwapText } from "@/components/fx/Text";
import { categoryById, type Game } from "@/data/games";
import { useLockBody } from "@/lib/hooks";

interface Props {
  game: Game | null;
  list: Game[];
  onClose: () => void;
  onNavigate: (g: Game) => void;
}

export function GameOverlay({ game, list, onClose, onNavigate }: Props) {
  const open = !!game;
  useLockBody(open);
  const closeRef = useRef<HTMLButtonElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const index = game ? list.findIndex((g) => g.slug === game.slug) : -1;
  const prev = index > 0 ? list[index - 1] : list[list.length - 1];
  const next = index >= 0 && index < list.length - 1 ? list[index + 1] : list[0];

  /* focus management + keyboard */
  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => closeRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && next) onNavigate(next);
      else if (e.key === "ArrowLeft" && prev) onNavigate(prev);
      else if (e.key === "Tab" && boxRef.current) {
        const f = boxRef.current.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      restoreRef.current?.focus?.();
    };
  }, [open, onClose, onNavigate, next, prev]);

  if (!game) return null;
  const cat = categoryById(game.category);

  return (
    <div
      ref={boxRef}
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-title"
      onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        if (!touch.current) return;
        const dx = e.changedTouches[0].clientX - touch.current.x;
        const dy = e.changedTouches[0].clientY - touch.current.y;
        touch.current = null;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          if (dx < 0 && next) onNavigate(next);
          else if (dx > 0 && prev) onNavigate(prev);
        }
      }}
    >
      <div className="overlay__art">
        <Artwork key={game.slug} game={game} kind="portrait" width={900} sizes="(max-width: 899px) 100vw, 46vw" priority alt={`${game.title} artwork`} />
      </div>

      <div className="overlay__body">
        <div className="flex items-center justify-between gap-4 mb-8 md:mb-auto">
          <p className="mono text-fg-dim overlay__row">
            {String(index + 1).padStart(2, "0")} / {String(list.length).padStart(2, "0")}
          </p>
          <div className="overlay__nav">
            <button className="iconbtn" onClick={() => prev && onNavigate(prev)} aria-label={`Previous: ${prev?.title ?? ""}`} data-cursor="PREV">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            <button className="iconbtn" onClick={() => next && onNavigate(next)} aria-label={`Next: ${next?.title ?? ""}`} data-cursor="NEXT">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button ref={closeRef} className="iconbtn ml-2" onClick={onClose} aria-label="Close" data-cursor="CLOSE">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-auto">
          <p className="mono text-peach mb-5 overlay__row">
            {cat.full}
            {game.year ? ` / ${game.year}` : ""}
          </p>
          <h2 id="game-title" className="display overlay__title text-fg">
            <MeshText key={game.slug} text={game.title} strength={10} radius={160} />
          </h2>
          <p className="lede text-fg-dim mt-6 overlay__row" style={{ animationDelay: "0.2s" }}>
            {game.description}
          </p>

          <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3 overlay__row" style={{ animationDelay: "0.3s" }}>
            <div>
              <dt className="mono text-fg-mute">Status</dt>
              <dd className={`mt-1 mono status--${game.status}`} style={{ fontSize: "0.8rem" }}>
                {game.status}
              </dd>
            </div>
            {game.studio && (
              <div>
                <dt className="mono text-fg-mute">Studio</dt>
                <dd className="mt-1 text-fg text-[0.95rem]">{game.studio}</dd>
              </div>
            )}
            <div>
              <dt className="mono text-fg-mute">Category</dt>
              <dd className="mt-1 text-fg text-[0.95rem]">{cat.label}</dd>
            </div>
          </dl>

          <div className="mt-10 flex flex-wrap items-center gap-4 overlay__row" style={{ animationDelay: "0.4s" }}>
            <button className="btn swap-parent" onClick={() => next && onNavigate(next)} data-cursor="NEXT">
              <SwapText text={`NEXT: ${next?.title.toUpperCase().slice(0, 22) ?? ""}`} />
              <span aria-hidden="true">→</span>
            </button>
            <span className="mono text-fg-mute hidden md:inline">← → to browse, Esc to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
