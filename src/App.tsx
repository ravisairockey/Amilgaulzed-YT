import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Cursor, ScrollProgress } from "@/components/fx/Chrome";
import { Nav, type NavTarget } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { CategoryIndex, StatsBand } from "@/components/Stats";
import { Featured } from "@/components/Featured";
import { applyFilters, Vault, type VaultFilters } from "@/components/Vault";
import { History } from "@/components/History";
import { About } from "@/components/About";
import { Gravity } from "@/components/Gravity";
import { Ending, Footer } from "@/components/Ending";
import { CATEGORIES, computeStats, gameBySlug, visibleGames, type CategoryId, type Game, type Status } from "@/data/games";
import { scrollToId, useLocalStorage, useUrlState } from "@/lib/hooks";

const GameOverlay = lazy(() => import("@/components/GameOverlay").then((m) => ({ default: m.GameOverlay })));

const isCategory = (v: string | null | undefined): v is CategoryId => !!v && CATEGORIES.some((c) => c.id === v);
const isStatus = (v: string | null | undefined): v is Status => v === "played" || v === "backlog";

export default function App() {
  const [adult, setAdult] = useLocalStorage<boolean>("gv:adult", false);
  const [url, setUrl] = useUrlState();
  const [active, setActive] = useState<string>("vault");
  const searchRef = useRef<HTMLInputElement>(null);

  const games = useMemo(() => visibleGames(adult), [adult]);
  const stats = useMemo(() => computeStats(games), [games]);

  const filters: VaultFilters = useMemo(
    () => ({
      category: isCategory(url.category) ? url.category : null,
      status: isStatus(url.filter) ? url.filter : null,
      q: url.q ?? "",
    }),
    [url.category, url.filter, url.q],
  );

  const filtered = useMemo(() => applyFilters(games, filters), [games, filters]);

  /* open game from URL, but never an adult title while the preference is off */
  const openGame: Game | null = useMemo(() => {
    const g = gameBySlug(url.game);
    if (!g) return null;
    if (g.adult && !adult) return null;
    return g;
  }, [url.game, adult]);

  const setFilters = useCallback(
    (patch: Partial<VaultFilters>) => {
      setUrl({
        ...(patch.category !== undefined ? { category: patch.category } : {}),
        ...(patch.status !== undefined ? { filter: patch.status } : {}),
        ...(patch.q !== undefined ? { q: patch.q || null } : {}),
      });
    },
    [setUrl],
  );

  const open = useCallback((g: Game) => setUrl({ game: g.slug }, true), [setUrl]);
  const close = useCallback(() => setUrl({ game: null }), [setUrl]);
  const navigateGame = useCallback((g: Game) => setUrl({ game: g.slug }), [setUrl]);

  /* overlay browses through the currently visible (filtered) list, or the whole vault as fallback */
  const overlayList = useMemo(() => {
    if (openGame && !filtered.some((g) => g.slug === openGame.slug)) return games;
    return filtered.length ? filtered : games;
  }, [filtered, games, openGame]);

  const focusSearch = useCallback(() => {
    scrollToId("vault", 40);
    setTimeout(() => searchRef.current?.focus(), 350);
  }, []);

  const onNavigate = useCallback(
    (t: NavTarget) => {
      setActive(t);
      if (t === "vault") scrollToId("vault");
      else if (t === "categories") scrollToId("categories");
      else if (t === "played") {
        setFilters({ status: "played", category: null });
        scrollToId("vault");
      } else if (t === "backlog") scrollToId("backlog");
      else if (t === "about") scrollToId("about");
    },
    [setFilters],
  );

  /* keyboard: "/" or Cmd/Ctrl+K focuses search */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        focusSearch();
      } else if (e.key === "/" && !typing && !openGame) {
        e.preventDefault();
        focusSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusSearch, openGame]);

  /* track the active section for the nav */
  useEffect(() => {
    const ids = ["vault", "categories", "backlog", "about"];
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.1, 0.25] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  /* if adult gets switched off while an adult title is open or filtered, the URL cleans itself */
  useEffect(() => {
    const g = gameBySlug(url.game);
    if (g?.adult && !adult) setUrl({ game: null });
  }, [adult, url.game, setUrl]);

  return (
    <>
      <a href="#vault" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[300] focus:bg-lime focus:text-ink focus:px-4 focus:py-2 mono">
        Skip to the vault
      </a>
      <ScrollProgress />
      <Cursor />
      <div className="grain" aria-hidden="true" />

      <Nav onNavigate={onNavigate} onSearch={focusSearch} active={active} />

      <main id="main">
        <Hero stats={stats} onEnter={() => onNavigate("vault")} />
        <StatsBand stats={stats} />
        <CategoryIndex
          games={games}
          stats={stats}
          onSelect={(id) => {
            setFilters({ category: id, status: null });
            scrollToId("vault");
          }}
        />
        <Featured onOpen={open} />
        <Vault games={games} stats={stats} filters={filters} onFilters={setFilters} onOpen={open} searchRef={searchRef} />
        <History games={games} stats={stats} onOpen={open} />
        <About stats={stats} adult={adult} onAdult={setAdult} />
        <Gravity games={games} onOpen={open} />
        <Ending />
      </main>

      <Footer stats={stats} adult={adult} onAdult={setAdult} />

      <Suspense fallback={null}>
        {openGame && <GameOverlay game={openGame} list={overlayList} onClose={close} onNavigate={navigateGame} />}
      </Suspense>
    </>
  );
}
