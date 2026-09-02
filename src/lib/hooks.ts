import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

/* ---------- media / capability ---------- */

function useMedia(query: string, initial = false) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" && "matchMedia" in window ? window.matchMedia(query).matches : initial,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatches(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return matches;
}

export const useReducedMotion = () => useMedia("(prefers-reduced-motion: reduce)");
export const useFinePointer = () => useMedia("(pointer: fine) and (hover: hover)");
export const useIsMobile = () => useMedia("(max-width: 767px)", false);

/** Cheap capability probe shared by all WebGL consumers. */
let webglSupport: boolean | null = null;
export function hasWebGL(): boolean {
  if (webglSupport !== null) return webglSupport;
  try {
    const c = document.createElement("canvas");
    webglSupport = !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

/* ---------- viewport ---------- */

export function useInView<T extends Element>(
  options: IntersectionObserverInit = { rootMargin: "0px 0px -10% 0px", threshold: 0.15 },
  once = true,
): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) setInView(false);
      }
    }, options);
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [once]);
  return [ref, inView];
}

/* ---------- persistence ---------- */

export function useLocalStorage<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  const set = useCallback(
    (v: T) => {
      setValue(v);
      try {
        localStorage.setItem(key, JSON.stringify(v));
      } catch {
        /* private mode etc. */
      }
    },
    [key],
  );
  return [value, set];
}

/* ---------- URL state (?game= ?category= ?filter= ?q=) ---------- */

export type UrlState = Record<string, string | null>;

const readUrl = (): UrlState => {
  const p = new URLSearchParams(window.location.search);
  const out: UrlState = {};
  p.forEach((v, k) => (out[k] = v));
  return out;
};

export function useUrlState(): [UrlState, (patch: UrlState, push?: boolean) => void] {
  const [state, setState] = useState<UrlState>(() => (typeof window === "undefined" ? {} : readUrl()));

  useEffect(() => {
    const on = () => setState(readUrl());
    window.addEventListener("popstate", on);
    return () => window.removeEventListener("popstate", on);
  }, []);

  const update = useCallback((patch: UrlState, push = false) => {
    const p = new URLSearchParams(window.location.search);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "" || v === undefined) p.delete(k);
      else p.set(k, v);
    }
    const qs = p.toString();
    const url = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
    if (push) history.pushState(null, "", url);
    else history.replaceState(null, "", url);
    setState(readUrl());
  }, []);

  return [state, update];
}

/* ---------- body scroll lock ---------- */

export function useLockBody(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    const prevPad = document.body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    return () => {
      document.body.style.overflow = prev;
      document.body.style.paddingRight = prevPad;
    };
  }, [locked]);
}

/* ---------- smooth scroll to a section ---------- */

export function scrollToId(id: string, offset = 72) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
}
