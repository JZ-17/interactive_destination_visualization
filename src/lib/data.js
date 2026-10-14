// Loading and derivation for city_master.csv. Components never load anything
// themselves — they take plain objects through props.
//
// Everything here follows data/METHODOLOGY.md. Where we recompute something the
// pipeline already computed (theme-profile and personality-profile distance),
// we use the same definition so our numbers and its `Twin (...)` columns agree.
import { csv, json } from 'd3-fetch';
import { feature } from 'topojson-client';
import { base } from '$app/paths';
import { COORDS } from './coords.js';

// Static files sit next to the app, not at the domain root. A leading-slash
// path only works when the site is served from "/", so it breaks the moment
// the build is hosted under a sub-path. `base` is '' locally and the app's
// own prefix when hosted.
const asset = (file) => `${base}/${file}`;

/** The ten theme lexicons, in the order the pipeline lists them. */
export const THEMES = [
  'Food', 'History', 'Art & Culture', 'Nature', 'Beach & Water',
  'Nightlife', 'Shopping', 'Architecture', 'Modern & Business', 'Family'
];

/**
 * The nine personality dimensions and the per-1k-word rate columns each is
 * built from (the pipeline's VOICE map). A dimension built from two columns
 * takes the mean of their z-scores.
 */
export const VOICE = {
  'The Braggart':       ['Rank words per 1k words', 'Numeric scale per 1k words'],
  'The Name-Dropper':   ['Authority borrowing per 1k words', 'UNESCO per 1k words'],
  'The Closer':         ['Urgency per 1k words', 'Imperatives per 1k words'],
  'The Host':           ['Second person per 1k words'],
  'The Sensualist':     ['Sensory per 1k words', 'High sentiment noun per 1k words'],
  'The Underdog':       ['Defensive qualifiers per 1k words', 'Surprise per 1k words'],
  'The Bargain':        ['Price and value per 1k words'],
  'The Good Citizen':   ['Sustainability per 1k words', 'Inclusivity per 1k words'],
  'The Cliche Machine': ['Cliches per 1k words']
};
export const PERSONALITIES = Object.keys(VOICE);

/**
 * The four twin definitions. They disagree on purpose — see METHODOLOGY.md.
 * `lowerIsCloser` matters: two are similarities, two are distances.
 */
export const TWIN_METHODS = [
  {
    id: 'tfidf',
    label: 'Same words',
    question: 'Which city uses the same words, weighted by how distinctive they are?',
    partnerCol: 'Sounds most like',
    scoreCol: 'Similarity to twin',
    sharedCol: 'Shared with twin',
    unit: 'cosine similarity',
    lowerIsCloser: false,
    caveat: 'Cosine on descriptive TF-IDF. The corpus maximum is 0.20, so read it as a ranking, not a percentage.'
  },
  {
    id: 'jaccard',
    label: 'Same distinctive words',
    question: 'Which city has the most of its top-50 distinctive words in common?',
    partnerCol: 'Twin (vocabulary overlap)',
    scoreCol: 'Vocabulary overlap score',
    sharedCol: 'Shared distinctive words',
    unit: 'Jaccard overlap',
    lowerIsCloser: false,
    caveat: 'Unweighted set overlap of each city’s 50 highest-TF-IDF words.'
  },
  {
    id: 'theme',
    label: 'Same subjects',
    question: 'Which city talks about the same ten themes in the same proportions?',
    partnerCol: 'Twin (theme profile)',
    scoreCol: 'Theme profile distance',
    sharedCol: null,
    unit: 'sd apart',
    lowerIsCloser: true,
    caveat: 'Euclidean distance on the 10 z-scored theme rates. Lower is closer.'
  },
  {
    id: 'personality',
    label: 'Same sales pitch',
    question: 'Which city uses the same rhetorical moves to sell itself?',
    partnerCol: 'Twin (personality profile)',
    scoreCol: 'Personality profile distance',
    sharedCol: null,
    unit: 'sd apart',
    lowerIsCloser: true,
    caveat: 'Euclidean distance on the 9 z-scored personality dimensions. Lower is closer.'
  }
];

/**
 * What the scatter plot is allowed to put on an axis.
 *
 * `Distinctiveness` (-0.76 with description length) and `Vocabulary richness`
 * (-0.72) are deliberately absent: they largely measure how long the scrape
 * was. `Rare word share` is the robust stand-in. See CLAUDE.md.
 */
export const AXIS_OPTIONS = [
  ...THEMES.map((t) => ({
    id: `theme:${t}`,
    label: t,
    group: 'Theme emphasis',
    unit: 'mentions per 1,000 words',
    get: (c) => c.themes[t]
  })),
  {
    id: 'obscurity',
    label: 'Obscurity',
    group: 'How known it is',
    unit: '0 = famous, 1 = obscure',
    get: (c) => c.obscurity
  },
  {
    id: 'rareWordShare',
    label: 'Rare word share',
    group: 'Distinctiveness',
    unit: 'share of words no other city uses',
    get: (c) => c.rareWordShare
  },
  {
    id: 'themeFocus',
    label: 'Theme focus',
    group: 'Distinctiveness',
    unit: '1.0 = one-theme specialist, 0.1 = even generalist',
    get: (c) => c.themeFocus
  },
  {
    id: 'themeOverIndex',
    label: 'Theme over-index',
    group: 'Distinctiveness',
    unit: 'x above corpus average on its best theme',
    get: (c) => c.themeOverIndex
  },
  {
    id: 'superlativesPer1k',
    label: 'Superlatives',
    group: 'Sales pressure',
    unit: 'per 1,000 words',
    get: (c) => c.superlativesPer1k
  },
  {
    id: 'clichesPer1k',
    label: 'Clichés',
    group: 'Sales pressure',
    unit: 'per 1,000 words',
    get: (c) => c.clichesPer1k
  },
  {
    id: 'selfReferencePer1k',
    label: 'Self-reference',
    group: 'Sales pressure',
    unit: 'names itself, per 1,000 words',
    get: (c) => c.selfReferencePer1k
  },
  {
    id: 'personalityStrength',
    label: 'Personality strength',
    group: 'Sales pressure',
    unit: 'sd above the corpus mean',
    get: (c) => c.personalityStrength
  }
];

export const axisById = (id) => AXIS_OPTIONS.find((a) => a.id === id);

const num = (s) => {
  const v = parseFloat(s);
  return Number.isFinite(v) ? v : 0;
};
// Multi-value cells are joined with " | ".
const list = (s) => (s || '').split('|').map((d) => d.trim()).filter(Boolean);

/** Mean and (population) standard deviation of an array of numbers. */
function meanSd(values) {
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return { mean, sd: Math.sqrt(variance) || 1 };
}

/**
 * Load and parse the master CSV, then attach the derived profiles the views
 * need. Returns { cities, themeStats, corpusThemeMean }.
 */
export async function loadCities(fetchImpl = fetch) {
  const rows = await csv(asset('city_master.csv'), { fetch: fetchImpl });

  const cities = rows.map((r) => {
    const place = COORDS[r.City];
    if (!place) throw new Error(`src/lib/coords.js has no entry for "${r.City}"`);

    const themes = {};
    THEMES.forEach((t) => (themes[t] = num(r[`theme: ${t}`])));

    const themeWords = {};
    THEMES.forEach((t) => (themeWords[t] = list(r[`${t} words`])));

    return {
      city: r.City,
      country: r.Country,
      category: r.Category, // popular | hidden — hand-assigned, see CLAUDE.md
      lat: place.lat,
      lon: place.lon,
      region: place.region,
      siteLink: r['Site link'],

      // External popularity — the defensible version of "hidden gem".
      pageviews: num(r['Annual pageviews']),
      obscurity: num(r.Obscurity), // 0 = famous, 1 = obscure
      wikipediaTitle: r['Wikipedia title'],

      wordCount: num(r['Word count']),

      // What it talks about.
      archetype: r.Archetype,
      dominantTheme: r['Dominant theme'],
      themeOverIndex: num(r['Theme over-index']),
      themeFocus: num(r['Theme focus']),
      themes,
      themeWords,

      // How it sells.
      personality: r.Personality,
      personalityStrength: num(r['Personality strength']),

      // Distinctiveness. `distinctiveness` and `vocabularyRichness` are kept for
      // reference but must not go on an axis (-0.76 / -0.72 with length).
      distinctiveness: num(r.Distinctiveness),
      vocabularyRichness: num(r['Vocabulary richness']),
      rareWordShare: num(r['Rare word share']),
      signatureWord: r['Signature word'],

      fingerprintWords: list(r['Fingerprint words']),
      descriptiveFingerprint: list(r['Descriptive fingerprint']),

      clichesUsed: list(r['Cliches used']),
      clicheCount: num(r['Cliche count']),
      clichesPer1k: num(r['Cliches per 1k words']),
      superlativesPer1k: num(r['Superlatives per 1k words']),
      adjectivesPer1k: num(r['Adjectives per 1k words']),
      selfReferencePer1k: num(r['Self reference per 1k words']),

      comparisons: list(r.Comparisons),
      comparedTo: list(r['Compared to']),
      nicknameClaims: list(r['Nickname claims']),

      // The four twins, keyed by method id.
      twins: Object.fromEntries(
        TWIN_METHODS.map((m) => [
          m.id,
          {
            partner: r[m.partnerCol],
            score: num(r[m.scoreCol]),
            shared: m.sharedCol ? list(r[m.sharedCol]) : []
          }
        ])
      ),
      twinRegion: r['Twin region'],
      crossRegionTwin: r['Cross-region twin'] === 'yes',

      description: r.Description,
      // Raw row kept so the personality z-scores below can read rate columns.
      _raw: r
    };
  });

  // --- z-scored profiles -------------------------------------------------
  // Theme rates are z-scored per dimension, or Food (corpus mean ~3.4/1k)
  // would swamp Family on scale alone.
  const themeStats = {};
  THEMES.forEach((t) => {
    themeStats[t] = meanSd(cities.map((c) => c.themes[t]));
  });

  // Each personality dimension = mean of the z-scores of its source columns.
  const colStats = {};
  Object.values(VOICE).flat().forEach((col) => {
    if (!colStats[col]) colStats[col] = meanSd(cities.map((c) => num(c._raw[col])));
  });

  cities.forEach((c) => {
    c.themeZ = {};
    THEMES.forEach((t) => {
      const { mean, sd } = themeStats[t];
      c.themeZ[t] = (c.themes[t] - mean) / sd;
    });

    c.voice = {};
    PERSONALITIES.forEach((p) => {
      const zs = VOICE[p].map((col) => {
        const { mean, sd } = colStats[col];
        return (num(c._raw[col]) - mean) / sd;
      });
      c.voice[p] = zs.reduce((s, z) => s + z, 0) / zs.length;
    });

    delete c._raw;
  });

  // A dimension averaged from two correlated z-scores has sd < 1, so the nine
  // dimensions are NOT on a common scale yet. The pipeline z-scores them a
  // second time before measuring distance — verified against the
  // `Twin (personality profile)` column, which this reproduces 50/50 (it is
  // 39/50 without this step). `voice` stays un-rescaled because the label and
  // the 0.5 sd "The Understated" cutoff are defined on the mean-of-z value.
  const voiceStats = {};
  PERSONALITIES.forEach((p) => {
    voiceStats[p] = meanSd(cities.map((c) => c.voice[p]));
  });
  cities.forEach((c) => {
    c.voiceZ = {};
    PERSONALITIES.forEach((p) => {
      const { mean, sd } = voiceStats[p];
      c.voiceZ[p] = (c.voice[p] - mean) / sd;
    });
  });

  const corpusThemeMean = {};
  THEMES.forEach((t) => (corpusThemeMean[t] = themeStats[t].mean));

  return { cities, themeStats, corpusThemeMean };
}

/** World land outline for the map view, as GeoJSON. */
export async function loadLand(fetchImpl = fetch) {
  const topo = await json(asset('land-110m.json'), { fetch: fetchImpl });
  return feature(topo, topo.objects.land);
}

// --- pairwise measures, for any two cities the user picks ----------------

/** Euclidean distance on the 10 z-scored theme rates. Lower is closer. */
export function themeProfileDistance(a, b) {
  return Math.sqrt(THEMES.reduce((s, t) => s + (a.themeZ[t] - b.themeZ[t]) ** 2, 0));
}

/** Euclidean distance on the 9 z-scored personality dimensions. Lower is closer. */
export function personalityProfileDistance(a, b) {
  return Math.sqrt(
    PERSONALITIES.reduce((s, p) => s + (a.voiceZ[p] - b.voiceZ[p]) ** 2, 0)
  );
}

/** Great-circle distance in km. */
export function greatCircleKm(a, b) {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Words both cities use distinctively (intersection of descriptive fingerprints). */
export function sharedDescriptiveWords(a, b) {
  const other = new Set(b.descriptiveFingerprint);
  return a.descriptiveFingerprint.filter((w) => other.has(w));
}

/**
 * The cities closest to `city` by theme profile, nearest first.
 * Recomputes method 3 for every pair, so it extends the single `Twin (theme
 * profile)` column to a full ranking.
 */
export function nearestByTheme(city, cities, n = 5) {
  return cities
    .filter((c) => c.city !== city.city)
    .map((c) => ({ city: c, distance: themeProfileDistance(city, c) }))
    .sort((x, y) => x.distance - y.distance)
    .slice(0, n);
}
