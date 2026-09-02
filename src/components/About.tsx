import { useEffect, useRef, useState } from "react";
import { Ink, Rise, SmokeReveal } from "@/components/fx/Text";
import { CHANNEL, STORAGE, type Stats } from "@/data/games";

export function AdultToggle({ enabled, onChange, compact = false }: { enabled: boolean; onChange: (v: boolean) => void; compact?: boolean }) {
  const [confirm, setConfirm] = useState(false);
  const yesRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!confirm) return;
    const t = setTimeout(() => yesRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setConfirm(false);
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [confirm]);

  const request = () => {
    if (enabled) onChange(false);
    else setConfirm(true);
  };

  return (
    <>
      <div className={`flex items-center gap-4 ${compact ? "" : "justify-between"}`}>
        {!compact && (
          <div>
            <p className="text-fg text-[0.95rem]">18+ content</p>
            <p className="mono text-fg-mute mt-1">{enabled ? "Visible in the vault" : "Hidden from every view"}</p>
          </div>
        )}
        {compact && <span className="mono text-fg-mute">18+ content</span>}
        <button
          role="switch"
          aria-checked={enabled}
          aria-label="Show 18+ content"
          className="switch"
          onClick={request}
          data-cursor={enabled ? "HIDE" : "SHOW"}
        />
      </div>

      {confirm && (
        <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="adult-title" onClick={(e) => e.target === e.currentTarget && setConfirm(false)}>
          <div className="dialog__box">
            <p className="mono text-peach">Confirmation</p>
            <h3 id="adult-title" className="display display-md mt-3 text-fg">
              Show 18+ titles?
            </h3>
            <p className="text-fg-dim mt-4 text-[0.95rem] leading-relaxed">
              This reveals adult titles in the vault, search and category counts on this device. The preference is stored locally and can be switched off at any time.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                ref={yesRef}
                className="btn btn--solid"
                onClick={() => {
                  onChange(true);
                  setConfirm(false);
                }}
              >
                I am 18 or older
              </button>
              <button className="btn" onClick={() => setConfirm(false)}>
                Keep hidden
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function About({ stats, adult, onAdult }: { stats: Stats; adult: boolean; onAdult: (v: boolean) => void }) {
  return (
    <section id="about" className="wrap py-[clamp(3rem,7vw,7rem)] bg-surface/40" aria-labelledby="about-title">
      <div className="grid gap-10 md:grid-cols-12">
        <div className="md:col-span-5">
          <SmokeReveal id="about-title" className="display display-xl">
            About the vault
          </SmokeReveal>
        </div>
        <div className="md:col-span-6 md:col-start-7 flex flex-col gap-8">
          <Rise>
            <p className="lede text-fg">
              This is the shelf behind the {CHANNEL.name} channel: {stats.total} titles, {STORAGE.tb} terabytes, and a lot of late nights. Not a review site and not a leaderboard, just the record of what I have actually installed and played.
            </p>
          </Rise>
          <Rise delay={80}>
            <p className="text-fg-dim text-[1rem] leading-relaxed max-w-[52ch]">
              Every count on this page is computed from the collection itself. Played means finished or played to my satisfaction. Backlog means installed and waiting. Nothing here is padded with numbers I do not have, so you will not find made-up hours or ratings.
            </p>
          </Rise>
          <Rise delay={160}>
            <div className="grid grid-cols-2 gap-6 border-t border-line pt-6">
              <div>
                <p className="mono text-fg-mute">Archive size</p>
                <p className="text-fg mt-1">{STORAGE.gb.toLocaleString("en-US", { minimumFractionDigits: 2 })} GB</p>
              </div>
              <div>
                <p className="mono text-fg-mute">Channel</p>
                <a className="text-fg no-underline mt-1 inline-block ink-parent" href={CHANNEL.url} target="_blank" rel="noopener noreferrer" data-cursor="PLAY">
                  <Ink>{CHANNEL.handle} ↗</Ink>
                </a>
              </div>
            </div>
          </Rise>
          <Rise delay={220}>
            <div className="border-t border-line pt-6">
              <AdultToggle enabled={adult} onChange={onAdult} />
            </div>
          </Rise>
        </div>
      </div>
    </section>
  );
}
