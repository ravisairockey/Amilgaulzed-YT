import { useEffect, useState } from "react";
import { SwapText } from "@/components/fx/Text";
import { CHANNEL } from "@/data/games";

export type NavTarget = "vault" | "categories" | "played" | "backlog" | "about";

const LINKS: { id: NavTarget; label: string }[] = [
  { id: "vault", label: "Vault" },
  { id: "categories", label: "Categories" },
  { id: "played", label: "Played" },
  { id: "backlog", label: "Backlog" },
  { id: "about", label: "About" },
];

export function Nav({ onNavigate, onSearch, active }: { onNavigate: (t: NavTarget) => void; onSearch: () => void; active: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let raf = 0;
    const on = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setScrolled(window.scrollY > 24);
      });
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const go = (t: NavTarget) => {
    setOpen(false);
    onNavigate(t);
  };

  return (
    <>
      <header className={`nav ${scrolled ? "is-scrolled" : ""}`}>
        <a
          href="#top"
          className="flex items-baseline gap-3 no-underline text-fg"
          data-cursor="TOP"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <span className="display text-[1.05rem] tracking-[-0.02em]" style={{ fontVariationSettings: '"opsz" 40, "wdth" 85' }}>
            AmilgaulZed
          </span>
          <span className="mono text-fg-mute hidden sm:inline">Game Vault</span>
        </a>

        <nav aria-label="Primary" className="hidden md:flex items-center">
          {LINKS.map((l) => (
            <button key={l.id} className="nav__link swap-parent" aria-current={active === l.id ? "true" : undefined} onClick={() => go(l.id)}>
              <SwapText text={l.label.toUpperCase()} seed={l.label.length * 3} />
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button className="nav__link" onClick={onSearch} aria-label="Search the vault" data-cursor="FIND">
            <span className="hidden sm:inline mr-2">Search</span>
            <span className="kbd" aria-hidden="true">
              /
            </span>
          </button>
          <button
            className="nav__link md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </header>

      <div id="mobile-menu" className={`menu md:hidden ${open ? "is-open" : ""}`} aria-hidden={!open}>
        <nav aria-label="Mobile">
          {LINKS.map((l, i) => (
            <button
              key={l.id}
              className="menu__link display display-lg text-fg"
              style={{ transitionDelay: `${i * 40}ms` }}
              onClick={() => go(l.id)}
              tabIndex={open ? 0 : -1}
            >
              {l.label}
            </button>
          ))}
        </nav>
        <div className="mt-8 flex items-center justify-between">
          <span className="mono text-fg-mute">{CHANNEL.handle}</span>
          <a className="mono text-peach" href={CHANNEL.url} target="_blank" rel="noopener noreferrer" tabIndex={open ? 0 : -1}>
            YouTube ↗
          </a>
        </div>
      </div>
    </>
  );
}
