/**
 * Central dataset for the Game Vault.
 * Every count, filter, stat and layout in the UI derives from this file.
 *
 * `status` is the only editorial field (played / backlog). Adjust freely.
 * Release years and studios are public facts about the games, not play dates.
 * Fields like hours / rating / favorite are intentionally absent: never fabricated.
 */
import bloodborneArt from "@/assets/art/bloodborne.jpg";
import valorantArt from "@/assets/art/valorant.jpg";

export type CategoryId = "action" | "open-world" | "fps" | "story" | "racing" | "misc";
export type Status = "played" | "backlog";
export type Accent = "lime" | "peach" | "mint";

export interface Category {
  id: CategoryId;
  label: string; // compact filter label
  full: string; // editorial label
  accent: Accent;
}

export interface Game {
  slug: string;
  title: string;
  category: CategoryId;
  status: Status;
  description: string;
  /** Steam app id, used to source artwork. */
  steam?: number;
  /** Locally bundled artwork (for titles without Steam listings). */
  art?: string;
  year?: number;
  studio?: string;
  featured?: boolean;
  adult?: boolean;
  accent?: Accent;
}

export const CHANNEL = {
  name: "AmilgaulZed",
  handle: "@AmilgaulZed",
  url: "https://www.youtube.com/@AmilgaulZed",
};

/** Supplied storage statistic (not derived). */
export const STORAGE = { gb: 2201.88, tb: 2.15 };

export const CATEGORIES: Category[] = [
  { id: "action", label: "Action", full: "Action / Souls-like", accent: "peach" },
  { id: "open-world", label: "Open World", full: "Open World / Adventure", accent: "lime" },
  { id: "fps", label: "FPS", full: "Shooters / FPS", accent: "mint" },
  { id: "story", label: "Story", full: "Narrative / Story-driven", accent: "peach" },
  { id: "racing", label: "Racing", full: "Racing / Sports", accent: "lime" },
  { id: "misc", label: "Misc", full: "Action-Adventure / Misc", accent: "mint" },
];

export const categoryById = (id: CategoryId): Category =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];

export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’:.()]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

type Seed = Omit<Game, "slug"> & { slug?: string };

const seed: Seed[] = [
  // ACTION / SOULS-LIKE
  { title: "ELDEN RING", category: "action", status: "played", steam: 1245620, year: 2022, studio: "FromSoftware", featured: true, slug: "elden-ring", description: "FromSoftware's open-world epic. The Lands Between, the Erdtree, and a hundred ways to die." },
  { title: "Elden Ring: Nightreign", category: "action", status: "backlog", steam: 2622380, year: 2025, studio: "FromSoftware", description: "Co-op roguelike expeditions through a collapsing Limveld. Three nights, one Nightlord." },
  { title: "Bloodborne", category: "action", status: "played", art: bloodborneArt, year: 2015, studio: "FromSoftware", description: "Yharnam's gothic nightmare. Fast, brutal, and still unmatched in atmosphere." },
  { title: "Sekiro: Shadows Die Twice", category: "action", status: "played", steam: 814380, year: 2019, studio: "FromSoftware", featured: true, description: "Posture, parry, deflect. The purest combat FromSoftware has ever designed." },
  { title: "Stellar Blade", category: "action", status: "played", steam: 3489700, year: 2024, studio: "Shift Up", description: "Eve's sleek, stylish fight to reclaim a ruined Earth. Perfect parries and a killer soundtrack." },
  { title: "Devil May Cry 3: Special Edition", category: "action", status: "played", steam: 6550, year: 2006, studio: "Capcom", description: "Dante at his cockiest. The stylish-action blueprint that still holds up." },
  { title: "Sifu", category: "action", status: "played", steam: 2138710, year: 2022, studio: "Sloclap", description: "Kung fu revenge where every death ages you. Five levels, one long night." },
  { title: "Bloody Spell", category: "action", status: "backlog", steam: 1085660, year: 2019, description: "A wuxia action roguelite with fast, bloody swordplay and randomized runs." },
  { title: "Remnant II", category: "action", status: "played", steam: 1282100, year: 2023, studio: "Gunfire Games", description: "Souls-like structure with a shooter's feel. Procedural worlds built for co-op." },
  { title: "Ghostrunner 2", category: "action", status: "played", steam: 2144740, year: 2023, studio: "One More Level", description: "One hit kills, in both directions. First-person katana parkour at full speed." },

  // OPEN WORLD / ADVENTURE
  { title: "Ghost of Tsushima: Director's Cut", category: "open-world", status: "played", steam: 2215430, year: 2021, studio: "Sucker Punch", featured: true, description: "Jin Sakai's samurai epic, plus Iki Island. The wind shows the way." },
  { title: "Assassin's Creed Valhalla", category: "open-world", status: "played", steam: 2208920, year: 2020, studio: "Ubisoft Montreal", description: "Eivor's Viking saga across a sprawling ninth-century England." },
  { title: "Assassin's Creed Unity", category: "open-world", status: "played", steam: 289650, year: 2014, studio: "Ubisoft Montreal", description: "Revolutionary Paris, rendered with astonishing density. Arno's stealth playground." },
  { title: "Hogwarts Legacy", category: "open-world", status: "played", steam: 990080, year: 2023, studio: "Avalanche Software", description: "The wizarding world as an open-world RPG. Classes, broomsticks, and the Room of Requirement." },
  { title: "Red Dead Redemption 2", category: "open-world", status: "played", steam: 1174180, year: 2018, studio: "Rockstar Games", featured: true, description: "Arthur Morgan and the last days of the Van der Linde gang. Rockstar's masterpiece." },
  { title: "Grand Theft Auto V", category: "open-world", status: "played", steam: 271590, year: 2013, studio: "Rockstar North", description: "Los Santos. Three protagonists and one of the most-played worlds ever built." },
  { title: "Cyberpunk 2077", category: "open-world", status: "played", steam: 1091500, year: 2020, studio: "CD Projekt Red", featured: true, description: "Night City, V, and Johnny Silverhand. Redeemed, and now essential." },
  { title: "Forspoken", category: "open-world", status: "backlog", steam: 1680880, year: 2023, studio: "Luminous Productions", description: "Frey's magic-parkour journey across Athia. Movement is the star." },
  { title: "Where Winds Meet", category: "open-world", status: "backlog", steam: 3564740, year: 2025, studio: "Everstone Studio", description: "A wuxia open world set in the turbulent Ten Kingdoms era." },
  { title: "The Elder Scrolls IV: Oblivion Remastered", category: "open-world", status: "backlog", steam: 2623190, year: 2025, studio: "Bethesda / Virtuos", description: "Cyrodiil rebuilt in Unreal Engine 5. The Oblivion Gates, reopened." },
  { title: "Death Stranding: Director's Cut", category: "open-world", status: "played", steam: 1850570, year: 2021, studio: "Kojima Productions", description: "Sam Porter Bridges reconnects a broken America, one delivery at a time." },
  { title: "Marvel's Spider-Man Remastered", category: "open-world", status: "played", steam: 1817070, year: 2020, studio: "Insomniac Games", description: "Peter Parker's New York, swinging at its very best." },
  { title: "Marvel's Spider-Man: Miles Morales", category: "open-world", status: "played", steam: 1817190, year: 2020, studio: "Insomniac Games", description: "A snowy Harlem, venom powers, and a tighter, more personal story." },
  { title: "Marvel's Spider-Man 2", category: "open-world", status: "played", steam: 2651280, year: 2023, studio: "Insomniac Games", description: "Two Spider-Men, the symbiote, and Kraven's hunt across a bigger New York." },

  // SHOOTERS / FPS
  { title: "Call of Duty: Modern Warfare (2019)", category: "fps", status: "played", steam: 2000950, year: 2019, studio: "Infinity Ward", description: "The reboot that reset the series. Clean House. Enough said." },
  { title: "Call of Duty: Modern Warfare II", category: "fps", status: "played", steam: 1938090, year: 2022, studio: "Infinity Ward", description: "Task Force 141 returns. Gunsmith 2.0 and a globe-trotting campaign." },
  { title: "Call of Duty: Modern Warfare III", category: "fps", status: "played", steam: 2519060, year: 2023, studio: "Sledgehammer Games", description: "Makarov's return and the classic MW2 maps, remade." },
  { title: "Call of Duty: MW2 Campaign Remastered", category: "fps", status: "played", steam: 10180, year: 2020, studio: "Beenox", description: "Cliffhanger, Wolverines, the Gulag. The 2009 campaign, rebuilt." },
  { title: "Call of Duty: Black Ops 6", category: "fps", status: "played", steam: 2933620, year: 2024, studio: "Treyarch / Raven", description: "Omnimovement and a 1991 conspiracy thriller. Black Ops at its most agile." },
  { title: "Call of Duty: Ghosts", category: "fps", status: "played", steam: 209160, year: 2013, studio: "Infinity Ward", description: "The Federation, Riley the dog, and a campaign that went to space." },
  { title: "Battlefield 6", category: "fps", status: "backlog", steam: 2807960, year: 2025, studio: "Battlefield Studios", description: "All-out warfare returns with destruction, squads, and 64-player chaos." },
  { title: "VALORANT", category: "fps", status: "played", art: valorantArt, year: 2020, studio: "Riot Games", description: "Five-versus-five tactical precision. Agents, spike sites, and clutch rounds." },
  { title: "Overwatch 2", category: "fps", status: "played", steam: 2357570, year: 2022, studio: "Blizzard Entertainment", description: "Hero shooter in 5v5 form. Push maps, new heroes, endless team fights." },
  { title: "Marvel Rivals", category: "fps", status: "played", steam: 2767030, year: 2024, studio: "NetEase Games", description: "Marvel heroes, destructible maps, and team-up abilities in 6v6." },
  { title: "Deadlock", category: "fps", status: "backlog", steam: 1422450, year: 2024, studio: "Valve", description: "Valve's third-person hero shooter meets MOBA. Lanes, souls, and ziplines." },
  { title: "Bright Memory: Infinite", category: "fps", status: "played", steam: 1178830, year: 2021, studio: "FYQD Studio", description: "Sword and gun combos in a short, gorgeous shooter made by one person." },
  { title: "METAL EDEN", category: "fps", status: "backlog", steam: 990380, year: 2025, studio: "Reikon Games", description: "Fast sci-fi shooting from the makers of Ruiner. Core-ripping momentum." },

  // NARRATIVE / STORY-DRIVEN
  { title: "Clair Obscur: Expedition 33", category: "story", status: "played", steam: 1903340, year: 2025, studio: "Sandfall Interactive", featured: true, description: "Reactive turn-based combat in a painted world. Tomorrow comes." },
  { title: "The Last of Us: Part I", category: "story", status: "played", steam: 1888930, year: 2022, studio: "Naughty Dog", description: "Joel and Ellie's journey, remade from the ground up." },
  { title: "Detroit: Become Human", category: "story", status: "played", steam: 1222140, year: 2018, studio: "Quantic Dream", description: "Three androids, thousands of branching choices, one city on the edge." },
  { title: "Life is Strange: True Colors", category: "story", status: "played", steam: 936790, year: 2021, studio: "Deck Nine", description: "Alex Chen reads emotions in the small town of Haven Springs." },
  { title: "Uncharted: Legacy of Thieves Collection", category: "story", status: "played", steam: 1659420, year: 2022, studio: "Naughty Dog", description: "Nathan Drake's final treasure and Chloe's Lost Legacy, together." },
  { title: "Alan Wake Remastered", category: "story", status: "played", steam: 108710, year: 2021, studio: "Remedy Entertainment", description: "Bright Falls, the Dark Presence, and a writer fighting with a flashlight." },
  { title: "Hellblade: Senua's Sacrifice (Enhanced)", category: "story", status: "played", steam: 414340, year: 2017, studio: "Ninja Theory", description: "A journey into Helheim, and into psychosis. Play with headphones." },
  { title: "Senua's Saga: Hellblade II", category: "story", status: "played", steam: 2461850, year: 2024, studio: "Ninja Theory", description: "Iceland, giants, and one of the most photoreal games ever shipped." },
  { title: "Silent Hill f", category: "story", status: "backlog", steam: 2947440, year: 2025, studio: "NeoBards / Konami", description: "1960s Japan, blooming rot, and a new kind of fog." },
  { title: "South of Midnight", category: "story", status: "backlog", steam: 1934570, year: 2025, studio: "Compulsion Games", description: "Stop-motion folklore in the American Deep South. Hazel weaves the strands." },
  { title: "God of War Ragnarök", category: "story", status: "played", steam: 2322010, year: 2022, studio: "Santa Monica Studio", featured: true, description: "Kratos and Atreus face Fimbulwinter. Fatherhood, fate, and the Nine Realms." },
  { title: "Baldur's Gate 3", category: "story", status: "played", steam: 1086940, year: 2023, studio: "Larian Studios", featured: true, description: "Dungeons & Dragons with total freedom. Every choice and every companion matters." },

  // RACING / SPORTS
  { title: "Forza Horizon 5", category: "racing", status: "played", steam: 1551360, year: 2021, studio: "Playground Games", description: "Mexico's festival of speed. Hundreds of cars, one volcano." },
  { title: "Assetto Corsa Competizione", category: "racing", status: "played", steam: 805550, year: 2019, studio: "Kunos Simulazioni", description: "The official GT World Challenge sim. Pure racecraft." },
  { title: "Burnout Paradise Remastered", category: "racing", status: "played", steam: 1238080, year: 2018, studio: "Criterion Games", description: "Paradise City at 60fps. Takedowns, stunts, and that soundtrack." },
  { title: "MotoGP 23", category: "racing", status: "played", steam: 2100160, year: 2023, studio: "Milestone", description: "The full MotoGP season with dynamic weather and a deep career mode." },
  { title: "FIFA 23", category: "racing", status: "played", steam: 1811260, year: 2022, studio: "EA Vancouver", description: "The last FIFA. HyperMotion2 and the World Cup, one final time." },
  { title: "Prince of Persia: The Forgotten Sands", category: "racing", status: "played", steam: 33320, year: 2010, studio: "Ubisoft Montreal", description: "Time powers and wall runs, set between Sands of Time and Warrior Within." },

  // ACTION-ADVENTURE / MISC
  { title: "007 First Light", category: "misc", status: "backlog", steam: 3768760, year: 2026, studio: "IO Interactive", description: "A young Bond's origin from the Hitman studio. Gadgets, glamour, and grit." },
  { title: "Gears of War: Reloaded", category: "misc", status: "backlog", steam: 2523720, year: 2025, studio: "The Coalition", description: "The original Gears, remastered at 4K with the campaign in full co-op." },
  { title: "Injustice 2: Legendary Edition", category: "misc", status: "played", steam: 627270, year: 2018, studio: "NetherRealm Studios", description: "DC's roster at war. Every fighter, every gear set, one edition." },
  { title: "Immortals of Aveum", category: "misc", status: "played", steam: 2009100, year: 2023, studio: "Ascendant Studios", description: "A magic shooter. Three colors of spellcraft in Unreal Engine 5." },
  { title: "Marvel's Avengers", category: "misc", status: "played", steam: 997070, year: 2020, studio: "Crystal Dynamics", description: "Kamala Khan reassembles the Avengers in a campaign worth the visit." },
  { title: "Returnal", category: "misc", status: "played", steam: 1649240, year: 2021, studio: "Housemarque", description: "Selene, Atropos, and the loop. Bullet-hell roguelike done with class." },
  { title: "Hi-Fi RUSH", category: "misc", status: "played", steam: 1817230, year: 2023, studio: "Tango Gameworks", description: "Rhythm-action where the whole world moves to the beat. Pure joy." },
  { title: "Amenti", category: "misc", status: "backlog", steam: 3292260, description: "An indie oddity sitting in the queue, still unplayed." },
  { title: "TORMENTOR", category: "misc", status: "backlog", steam: 1493440, year: 2025, studio: "Madmind Studio", description: "Madmind Studio's grim horror, from the team behind Agony." },
  { title: "Nymphomaniac", category: "misc", status: "played", adult: true, description: "An adult title in the library. Shown only when 18+ content is enabled." },
];

export const GAMES: Game[] = seed.map((g) => ({
  ...g,
  slug: g.slug ?? slugify(g.title),
  accent: g.accent ?? categoryById(g.category).accent,
}));

export const FEATURED_ORDER = [
  "ELDEN RING",
  "Red Dead Redemption 2",
  "Cyberpunk 2077",
  "Ghost of Tsushima: Director's Cut",
  "Clair Obscur: Expedition 33",
  "God of War Ragnarök",
  "Baldur's Gate 3",
  "Sekiro: Shadows Die Twice",
];

export const featuredGames = (): Game[] =>
  FEATURED_ORDER.map((t) => GAMES.find((g) => g.title === t)).filter((g): g is Game => !!g && !g.adult);

/** Games visible under the current adult-content preference. */
export const visibleGames = (adult: boolean) => (adult ? GAMES : GAMES.filter((g) => !g.adult));

export interface Stats {
  total: number;
  played: number;
  backlog: number;
  categories: number;
  byCategory: Record<CategoryId, number>;
}

export const computeStats = (list: Game[]): Stats => {
  const byCategory = Object.fromEntries(CATEGORIES.map((c) => [c.id, 0])) as Record<CategoryId, number>;
  let played = 0;
  for (const g of list) {
    byCategory[g.category]++;
    if (g.status === "played") played++;
  }
  return {
    total: list.length,
    played,
    backlog: list.length - played,
    categories: CATEGORIES.filter((c) => byCategory[c.id] > 0).length,
    byCategory,
  };
};

/* ------------------------------------------------------------------ */
/* Artwork                                                             */
/* ------------------------------------------------------------------ */

export type ArtKind = "portrait" | "landscape" | "square";

const STEAM_CDN = "https://cdn.akamai.steamstatic.com/steam/apps";
const PROXY = "https://images.weserv.nl/?url=";

const proxied = (url: string, w: number) =>
  `${PROXY}${encodeURIComponent(url)}&w=${w}&output=webp&q=80&fit=inside&il`;

export interface ArtSource {
  src: string;
  srcSet?: string;
  /** Alternate URLs tried in order if `src` fails to load. */
  fallbacks: string[];
  /** Whether the source supports CORS (needed for WebGL textures). */
  cors: boolean;
}

/**
 * Build a responsive artwork source for a game.
 * Portrait / square tiles use Steam library capsules, landscape tiles use
 * the logo-free library hero art (more cinematic, more editorial).
 */
export function artSource(game: Game, kind: ArtKind, width = 600): ArtSource | null {
  if (game.adult) return null;
  if (game.art) return { src: game.art, fallbacks: [], cors: true };
  if (!game.steam) return null;
  const base = `${STEAM_CDN}/${game.steam}`;
  const file = kind === "landscape" ? "library_hero.jpg" : "library_600x900_2x.jpg";
  const full = `${base}/${file}`;
  const w1 = width;
  const w2 = Math.min(width * 2, kind === "landscape" ? 2400 : 1200);
  return {
    src: proxied(full, w1),
    srcSet: `${proxied(full, w1)} ${w1}w, ${proxied(full, w2)} ${w2}w`,
    fallbacks: [full, `${base}/header.jpg`],
    cors: true,
  };
}

export const gameBySlug = (slug: string | null | undefined) =>
  slug ? GAMES.find((g) => g.slug === slug) : undefined;
