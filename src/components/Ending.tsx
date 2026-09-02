import { WaveArc } from "@/components/fx/Canvas";
import { Ink, Magnetic, MeshText, SmokeReveal } from "@/components/fx/Text";
import { AdultToggle } from "@/components/About";
import { CHANNEL, STORAGE, type Stats } from "@/data/games";

export function Ending() {
  return (
    <section className="ending wrap" aria-labelledby="ending-title">
      <WaveArc className="ending__canvas" lines={7} tint="238,248,205" />
      <div className="py-[10vh]">
        <SmokeReveal id="ending-title" className="display display-xxl text-fg" as="h2">
          The vault is still growing.
        </SmokeReveal>
        <p className="display display-lg text-fg-dim mt-6 md:mt-10" style={{ fontVariationSettings: '"opsz" 96, "wdth" 90', fontWeight: 500 }}>
          Watch the journey.
        </p>
        <div className="mt-12 md:mt-20 grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-8">
            <Magnetic strength={0.2} radius={140}>
              <a
                className="yt-link display ink-parent"
                style={{ fontSize: "clamp(2rem, 6.5vw, 6.5rem)", fontVariationSettings: '"opsz" 96, "wdth" 82' }}
                href={CHANNEL.url}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="PLAY"
              >
                <span className="flex flex-col items-start leading-[0.9]">
                  <MeshText text={CHANNEL.name.toUpperCase()} strength={14} radius={200} />
                  <span className="text-peach">
                    <Ink color="#D9FFF4">YOUTUBE</Ink>
                    <span className="arrow ml-[0.15em]" aria-hidden="true">
                      ↗
                    </span>
                  </span>
                </span>
              </a>
            </Magnetic>
          </div>
          <p className="lede text-fg-dim md:col-span-4">
            New videos, new titles, and a shelf that keeps getting heavier. Subscribe and watch the vault fill up.
          </p>
        </div>
      </div>
    </section>
  );
}

export function Footer({ stats, adult, onAdult }: { stats: Stats; adult: boolean; onAdult: (v: boolean) => void }) {
  return (
    <footer className="wrap border-t border-line py-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <p className="mono text-fg-mute">
          {CHANNEL.name} Game Vault <span className="text-fg-dim mx-2">/</span> {stats.total} titles, {STORAGE.tb} TB
        </p>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <AdultToggle enabled={adult} onChange={onAdult} compact />
          <a className="mono text-fg-dim hover:text-fg no-underline transition-colors" href={CHANNEL.url} target="_blank" rel="noopener noreferrer">
            YouTube ↗
          </a>
          <button
            className="mono text-fg-dim hover:text-fg transition-colors"
            onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
          >
            Back to top ↑
          </button>
        </div>
      </div>
      <p className="mono text-fg-mute mt-8 text-[0.6rem] normal-case tracking-[0.06em]">
        Artwork belongs to the respective publishers and is shown for archival reference. Names of games are trademarks of their owners.
      </p>
    </footer>
  );
}
