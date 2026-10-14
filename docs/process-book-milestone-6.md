# Milestone 6 — Coordinated prototypes

**Live prototypes** — one link, both prototypes:

### https://claude.ai/artifact/TPLN5CyNmkim4PynZmeTsx

The page that opens is an overview with two cards:

- **Prototype A — "Rank the 50"** (sorted card gallery)
- **Prototype B — "Spin the globe, pick two"** (large rotatable globe)

Click either card to open that prototype; each has a nav link back to the
overview and across to the other. (The link is currently **private** — it has to
be shared from the artifact's Share menu before teammates or graders can open
it.)

Source: SvelteKit + Svelte 5 runes + D3, in our project repo. `npm run dev`, no
console errors. Both prototypes read the same `static/city_master.csv`
(50 cities × 139 columns).

---

## 1. Which sketches we combined, and why

Our Milestone 4 review found that nearly all 27 sketches collapsed into three
buckets: **city breakdowns by personality/type**, **direct comparisons between
cities**, and **overall trends across cities**. We took the strongest sketch
from each bucket and built exactly those three views, so the prototypes test
the combination rather than inventing new charts.

| View | From | What it contributes |
| --- | --- | --- |
| **Sorted city cards** | Christine's sketch 3 (identity cards) + Nate's sketch 1 (cities ranked by descriptor) | Every city gets a card carrying its headline number, rank, archetype and personality. Sorting by a theme answers "who pushes this hardest?" by reading down a column — no chart literacy required. |
| **Globe** | Nate's sketch 3 (cities on a world map) + Josh's sketch 3 (spinning globe, click two to compare) | Puts the pair-picking on the actual planet, so "these two are 9,000 km apart and still sound alike" is something you see rather than read. |
| **Head-to-head** | Josh's sketch 15 (city vs. city) | The payoff view: twin table, theme-by-theme diverging bars, shared vocabulary. Answers "are these two actually alike?" |
| **Two-measure scatter** | Nate's sketch 10 (pick two qualities) | Supporting view in B: shows whether the chosen pair is unusual or sits in the middle of the pack. |

**The question they answer together:** *What is a city trying to be known for,
and which other cities make that same pitch — even when they are nowhere near
each other?*

Each view alone is weak. A ranked list tells you Tasmania leads on food but not
whether anything else about it is unusual; a globe shows you where cities are but
nothing about what they say; the comparison is precise but you need to already
know which pair to look at. Chained together, one view hands the next a
candidate and the last one adjudicates.

**One correction the data forced on the sketches.** Josh's sketch 15 showed an
"Overall Similarity: 95%" badge. The dataset cannot produce that number:
similarity is cosine on descriptive TF-IDF and its **corpus maximum is 0.20**.
So we dropped the single badge and show **all four of the pipeline's competing
twin definitions** instead — same words, same distinctive words, same subjects,
same sales pitch. They pick the same partner for at most 8 of the 50 cities, and
making that disagreement visible turned out to be more interesting than any
single score would have been.

---

## 2. How the views interact

Both prototypes use one shared selection per value and a single `$derived`
subset that every filtered view reads. The difference between A and B is
**which interaction does the filtering** and **how the views are laid out**.

### Prototype A — sorted card gallery

```
theme + direction --SORT----->  card order
category pills    --FILTER--->  cards + the summary numbers
hover             --LINK----->  cards (highlight, nothing removed)
two clicks        --SELECT--->  head-to-head
```

- **Pick a measure** (any of the ten themes, plus obscurity, rare-word share,
  superlative rate and others) → all fifty cards re-sort. Food puts Tasmania
  first at 66.7 per 1,000 words; switching to Nightlife puts Ghent first.
- **Most first / Least first** → flips the order. "Least first" is the more
  interesting direction: it surfaces London at **0.0** mentions of food.
- **All 50 / Big destinations / Hidden gems** → filters. Cards are *removed*
  and the four summary numbers recompute over the subset.
- **The rank badge is computed over all fifty** and does not renumber when you
  filter, so a card keeps its true standing.
- **Hover** → links (highlight only). **Click any two cards** → head-to-head.

### Prototype B — globe-led comparison

```
globe click     --SELECT-->  arc + head-to-head + scatter callouts
archetype pills --LINK---->  globe + scatter (highlight, nothing removed)
hover           --LINK---->  every view
```

- **Drag the globe** to spin it. Orthographic projection, so only the near
  hemisphere is drawn — about 41 of the 50 at any one time. A globe was chosen
  over a flat map because the question underneath this prototype is about
  distance, and a rectangular projection lies about distance.
- **Click a city** → it is selected *and* the globe turns to bring it to the
  front, so a click near the rim does not feel random.
- **Click a second city** → a great-circle arc is drawn between the pair and
  every view below fills in at once: the twin table, the theme-by-theme
  diverging bars, and the scatter with both cities ringed and labelled.
- **Archetype pills** → *highlight only.* Non-matching cities stay on the globe,
  stay drawn and stay clickable. This is the deliberate contrast with A's
  category filter, which removes.

---

## 3. Screenshots

**Prototype A — all 50, sorted by Food** (`docs/screenshots/proto-a.png`)
Tasmania #1 at 66.7 mentions per 1,000 words, down to London #50 at 0.0.

**Prototype A — filtered and compared** (`docs/screenshots/proto-a-compare.png`)
Sorted by Nightlife, filtered to the 25 hidden gems, with two cards selected and
the head-to-head open below.

**Prototype B — the globe** (`docs/screenshots/proto-b.png`)
41 of the 50 cities on the visible face. Drag to bring the rest around.

**Prototype B — a pair selected** (`docs/screenshots/proto-b-compare.png`)
Istanbul and Tokyo, 8,943 km apart, arc drawn between them, with the twin table,
theme bars and scatter callouts all filled in for that pair.

Dark mode renders are in `docs/screenshots/*-dark.png`; phone-width renders in
`*-mobile.png`.

---

## 4. Comparison, and what we would build on

| | Prototype A | Prototype B |
| --- | --- | --- |
| Best at | "Who pushes *this theme* hardest?" | "Do *these two places* sound alike?" |
| Entry point | A measure | A place |
| Primary view | 50 ranked cards | One large globe |
| Coordination | Sort + filter + select | Select + highlight |
| Geography | None | The whole premise |
| Weakness | Fifty cards is a lot of scrolling; no sense of *where* anything is | Only half the cities are visible at once; you must spin to find a city you cannot see |

**What coordinating the views revealed that one view could not.** Sorting in A is
blunt but it exposes the range: food runs from **66.7 per 1,000 words (Tasmania)
to 0.0 (London)** — the London tourism board does not mention food at all on its
homepage. In B, picking two cities on opposite sides of the globe and watching
the twin table come back "—" on both word-based measures makes the point that
sounding alike is rare and mostly not geographic. **28 of 50 cities (56%) have
their closest-sounding twin in a different world region**, and Ghent's nearest
neighbour by distinctive vocabulary is Sydney.

**What was confusing.** On the globe, cities on the far side simply do not exist
until you spin — there is no affordance telling you nine cities are hidden, only
a count in the caption. In A, fifty cards is a long scroll, and the eye loses the
sort order once the fold passes; a sticky header carrying the current measure
would help.

**Next steps.** The globe is the stronger opening — it is the view people want to
touch — so we lean toward **B as the spine**, with A's sorted cards becoming the
"browse everything" panel you reach after the globe has made its point. The
twin-disagreement table is the most novel thing we have and should get more
room. We also want to replace the hand-assigned popular/hidden colour with the
continuous obscurity measure, or at least stop implying the label is a fact.

---

## 5. How we used Claude, and what we changed

We gave Claude the lab handouts, our sketches, `city_master.csv` and the two
documentation files (`COLUMNS.md`, `METHODOLOGY.md`) and asked it to build both
prototypes in our SvelteKit stack following a project `CLAUDE.md`.

Things we had to correct or decide ourselves:

- **It started in the wrong stack.** Its first scaffold was plain Vite + Svelte 4
  with a Node pre-build step that baked the CSV into JSON. We pointed it at the
  lab requirements and it rebuilt on SvelteKit + Svelte 5 runes, loading the CSV
  client-side with `d3.csv` from `static/`, with marks rendered by `{#each}`.
- **It used a stale copy of the dataset.** It found an older 82-column
  `city_master.csv` on the desktop before we supplied the real 139-column file.
  The city list had also changed (Kraków out, Luxembourg City in), which only
  surfaced because the loader throws when a city has no coordinates.
- **We made it verify its own maths.** We asked it to reproduce the pipeline's
  `Twin (theme profile)` and `Twin (personality profile)` columns client-side so
  that *any* pair could be compared, not just each city's precomputed twin. The
  first attempt matched the theme twin 49/50 but the personality twin only
  39/50. The cause was real: averaging two correlated z-scores gives a dimension
  with sd < 1, so the nine personality dimensions are not on a common scale.
  Z-scoring them a second time before measuring distance reproduces the
  pipeline **50/50**. This is our numerical check.
- **We enforced the methodology's own warnings.** `Distinctiveness` and
  `Vocabulary richness` correlate −0.76 and −0.72 with description length, so we
  banned both from the axis menu and offer `Rare word share` instead. We also
  killed the "95% similar" badge, as above.
- **Colour.** We held it to one rule: colour encodes city category and nothing
  else. Archetype and personality have 8-10 levels each, which no categorical
  palette can carry; they get position, grouping and text instead.
- **We redesigned both prototypes after the first round.** The first pass gave us
  an archetype grid and a flat map; we replaced them with a sorted card gallery
  and a large draggable globe, because ranking and spinning are things our
  audience already knows how to do.
- **One bug it shipped and we caught:** the data files were fetched from the
  domain root, which works locally and breaks the moment the build is hosted
  under a sub-path. Both prototypes showed "Could not load the data" until the
  paths were resolved against the app's own base.

> *Teammates: edit this section to match what each of us actually did before
> submitting — the content above is accurate to the build, but the "we" should
> be yours.*
