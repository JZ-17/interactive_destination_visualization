# City Marketing Language: project context

How 50 cities' official tourism sites describe themselves, and which cities sound alike.

## My question

- **Question:** What is each city trying to be known for, and which cities make
  that pitch in the same words — even when they are nowhere near each other?
- **Audience:** Prospective travellers comparing destinations. General-interest
  readers, moderate visualization literacy (maps, bars, scatter plots are fine;
  anything less common needs a label and a one-line introduction).
- **Measure:** Per-city theme rates (`theme: <Theme>`, mentions per 1,000 words)
  and the four twin/similarity measures. Rates, never raw counts — descriptions
  differ in length by ~10x.
- **Judging criteria:**
  1. A reader can name what a city over-indexes on, and find another city that
     sounds like it, without reading any prose.
  2. No view implies a precision the data does not support (see Claims below).

## Stack

- SvelteKit (runs on Vite). Dev server: `npm run dev`, http://localhost:5173.
- Svelte 5 runes (`$state`, `$derived`, `$props`; never legacy `$:`).
- D3 for scales, axes, geo projection, and CSV loading. **Svelte renders the data
  marks with `{#each}`** — never `d3.select().append()` for marks. D3 axis and
  brush generators may use selections inside their own dedicated `<g>` elements.

## Conventions

- One component per `.svelte` file in `src/lib/`; import with the `$lib` alias.
- `src/lib/data.js` owns all loading and derivation. Components receive plain
  arrays/objects through props and never load anything themselves.
- The dataset lives in `static/city_master.csv`; load it client-side with
  `d3.csv` from `/city_master.csv` (leading slash, no `static/`).
- Every value loads as a string. Convert numeric columns on load.
- Multi-value cells are joined with ` | `. Split on `|` and trim.
- D3 margin convention. Label axes with units ("mentions per 1,000 words").

## Coordination rules

- Shared selection state lives in the route (`+page.svelte`), one owner per value.
  Components report interactions through callback props.
- **Linking = highlight.** Dim non-matches, remove nothing, aggregates unchanged.
- **Filtering = remove.** Non-matches leave the result views and aggregates
  recompute over the subset.
- Every filtered view reads the same `$derived` subset. Context views (the one
  being brushed/picked from) keep the full 50 cities so the selection can change.
- Every selection must be clearable.

## Encoding rules

- **Colour encodes city category and nothing else**, everywhere, in both
  prototypes: big destination `#2a78d6` (blue), hidden gem `#eb6834` (orange).
  Validated for CVD and contrast in light and dark mode.
- Archetype (10 values) and theme (10 values) have too many levels for colour.
  They get **position, grouping, or length** — never a 10-hue ramp.
- Selection is a ring + label, never a new hue. Hover is opacity.
- Legend present whenever two categories are on screen; direct-label where there
  is room. Identity is never carried by colour alone.
- Dark mode is defined explicitly, not an automatic flip.

## Data constraints (from data/METHODOLOGY.md — read it before adding a measure)

- 50 cities, 25 `popular` / 25 `hidden`, one row each. 139 columns.
- **Prefer `Obscurity` over `Category`** for any claim we intend to defend.
  `Category` is hand-assigned and ~20% disagrees with Wikipedia pageviews
  (Chicago is labelled hidden on 3.6M views/yr). We still *show* Category
  because the project's question is framed around it — but any quantitative
  claim about "hidden gems vs big destinations" is partly measuring the labels.
  Say so in the UI.
- **Similarity is cosine on descriptive TF-IDF and its corpus maximum is 0.20.**
  It is a *ranking*, not a percentage. Never render it as "95% similar" or as a
  percentage of anything. Show rank and the shared words instead.
- **`Distinctiveness` correlates −0.76 with description length** and
  `Vocabulary richness` −0.72. Do not put either on an axis. Use
  `Rare word share` when we need a distinctiveness-like measure.
- **Four twin definitions disagree on purpose** — `Sounds most like` (cosine
  TF-IDF), `Twin (vocabulary overlap)` (Jaccard), `Twin (theme profile)` and
  `Twin (personality profile)` (Euclidean, **lower is closer**). They agree for
  at most 8 of 50 cities. Never present one as "the" twin; let the user switch
  and show that they disagree.
- **`Archetype` is not the most-mentioned theme.** It is the theme with the
  highest rate ÷ corpus-mean ratio, among themes clearing 9.0 mentions/1k words.
  Food leads corpus-wide, so raw counts would make nearly everyone a Gourmand.
- `Personality` is the rhetorical counterpart: how a city sells, from the tagged
  vocabulary rates. 9 personalities + **The Understated** (8 of 50 cities scored
  below 0.5 sd and are not leaning on anything).
- `Annual tourists` and `Annual international tourists` are **empty for all 50
  rows**. Do not build a view on them.
- `UNESCO` is also inside `Authority borrowing`; `Surprise` is also inside
  `Defensive qualifiers`. **Never sum those columns together.**
- `<Theme> count` counts repeats; `<Theme> words` lists distinct matches only.
  They are expected to differ.
- `Sustainability` appears for 7/50 cities — a flag, not a rate.
- Self-reference misses renamed cities (Mecca scores 0.00 because the site
  writes "Makkah").

## Definition of done

- `npm run dev` runs with no console errors, including during interaction.
- Both prototypes answer the same question from the same 50 rows and the same
  rate measures.
- Each prototype has at least one link (highlight) and one filter (remove), and
  every selection can be cleared.
- Rates are labelled with units; the similarity caveat is visible in the UI, not
  just in this file.
