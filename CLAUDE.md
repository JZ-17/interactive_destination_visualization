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
  differ in length by ~17x.
- **Judging criteria:**
  1. A reader can name what a city over-indexes on, and find another city that
     sounds like it, without reading any prose.
  2. No view implies a precision the data does not support (see Claims below).

## Site structure

- `/` is **the main page and the only one under active design**: a scrollable
  flight that starts at the boarding pass. FROM is always Boston (printed, not
  a control); TO is the page's one dropdown at the gate, so a first-time reader
  makes exactly one choice. The destination gets a journey about how it
  compares to the other 49 (its shared words, the two word boards, what is
  unique to it, who it sounds like, Rank the 50). Only then does an arrival
  scene ("You've arrived in …") offer a second city, on two stacked passes
  leaving from that city: ROUND TRIP (in front) compares the two, adding a
  second leg below (personality cards, themes, selling moves, shared words);
  ONE WAY flies on and starts a fresh journey with the next city, its stamp
  and strip reading FROM the city just left. Do not reintroduce a second city at the gate: offering
  the comparison up front was found overwhelming. A stacked one-way /
  round-trip pair of passes was tried at the gate and moved to the arrival. Add new views slowly; the globe is out for now.
- `/board`, `/prototype-a`, `/prototype-b` and `/story` are earlier drafts, kept
  in the menu bar for reference. Prototype B's dark skin predates the light-only
  rule and stays with the draft.

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
  `d3.csv` through SvelteKit's `base` (see `asset()` in `data.js`). A bare
  leading-slash path breaks under the GitHub Pages sub-path.
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

- **Colour encodes city category and nothing else**: big destination
  `#1668e3` (Expedia blue), hidden gem `#c77a00` (amber). Validated for CVD
  and contrast — run the dataviz skill's `validate_palette.js` before changing
  either. Expedia's own yellow `#ffc94d` fails (1.49:1, lightness 0.863) and
  must not be used for data.
- **On the globe a marker is its city's hue, ringed white for a big
  destination and near-black for a hidden gem**, each with an
  opposite-toned halo so the ring reads on dark ocean and pale desert alike.
  Luminance is the one channel that survives any terrain underneath and any
  colour blindness, which is why category sits there rather than in a hue.
- **The reader's own cities are the one exception to "colour is category".**
  The boarding pass, the personality cards and the reader's two cities (their
  deck cards and comparison marks) wear `VOICE_TICKET` from `data.js`, chosen by
  personality. It is stationery, not an encoding: the personality is printed
  beside it, there is no legend, and the other 48 cards never use it. Every
  colour must keep white type at 4.5:1 or better.
- **In Prototype A each city carries its own hue** for its card wash and its
  value bar, with category moved to a translucent border round the card. Same
  device as the country tints: identity only, no legend, no meaning. Hues are
  assigned off alphabetical order so they never shift when the deck re-sorts.
  Rank the 50's dot strip on the main page uses the same device: each dot is
  the city's hue inside a ring in its category colour (white gap between), and
  the reader's cities have their ticket colour inside the ring.
  Its deck draws each city as a small sideways boarding pass (`ticket` on CityCard):
  the left panel in the city's hue at low saturation, darkened until white type
  clears 5:1, with category in the outline. The last row is centred.
- **Country tints are basemap separation, not an encoding.** Golden-angle hues
  at fixed low saturation / high lightness, the way a political map gives
  neighbours different colours. There is no legend for them and nothing in the
  UI invites reading meaning into them. Never add one.
- Archetype (8 values) and theme (10 values) have too many levels for colour.
  They get **position, grouping, or text** — never an 8- or 10-hue ramp.
- Selection thickens the ring and adds an ink halo, never a new hue. Hover is
  opacity and scale.
- Legend present whenever two categories are on screen; direct-label where
  there is room. Identity is never carried by colour alone.
- **Light only. There is no dark mode.** The main page is pale sky `#eef3f9`
  (both category colours keep 3:1 on it); `#f7f1e8` tan stays the default token
  for the drafts.

## Data constraints (from data/METHODOLOGY.md — read it before adding a measure)

- 50 cities, 25 `popular` / 25 `hidden`, one row each. 139 columns.
- **Prefer `Obscurity` over `Category`** for any claim we intend to defend.
  `Category` is hand-assigned and ~20% disagrees with Wikipedia pageviews
  (Chicago is labelled hidden on 3.6M views/yr). We still *show* Category
  because the project's question is framed around it — but any quantitative
  claim about "hidden gems vs big destinations" is partly measuring the labels.
  Say so in the UI.
- **Similarity is cosine on descriptive TF-IDF and its corpus maximum is 0.169.**
  It is a *ranking*, not a percentage. Never render it as "95% similar" or as a
  percentage of anything. Show rank and the shared words instead.
- **`Distinctiveness` correlates −0.76 with description length** and
  `Vocabulary richness` −0.72. Do not put either on an axis. Use
  `Rare word share` when we need a distinctiveness-like measure.
- **Four twin definitions disagree on purpose** — `Sounds most like` (cosine
  TF-IDF), `Twin (vocabulary overlap)` (Jaccard), `Twin (theme profile)` and
  `Twin (personality profile)` (Euclidean, **lower is closer**). They agree for
  at most 8 of 50 cities. Never present one as "the" twin; show them together
  so the disagreement is visible.
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
- The main page has at least one link (highlight) and one filter (remove), and
  every selection can be cleared.
- Rates are labelled with units; the similarity caveat is visible in the UI, not
  just in this file.
