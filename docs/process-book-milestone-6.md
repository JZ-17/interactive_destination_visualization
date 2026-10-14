# Milestone 6 — Coordinated prototypes

**Live prototypes** — one link, both prototypes:

### https://claude.ai/artifact/TPLN5CyNmkim4PynZmeTsx

The page that opens is an overview with two cards:

- **Prototype A — "Start from a type, narrow down"**
- **Prototype B — "Start from a city, follow the thread"**

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
| **Type grid** | Christine's sketch 1 (16-personalities) | Gives every city a label and shows how the 50 distribute across labels. Answers "what is this city trying to be known for?" at a glance. |
| **Two-measure scatter** | Nate's sketch 10 (pick two qualities) | Lets the reader choose the comparison instead of us choosing it. Answers "where does my city sit relative to the rest?" |
| **Head-to-head** | Josh's sketch 15 (city vs. city) | The payoff view: two cities side by side, theme by theme. Answers "are these two actually alike?" |

**The question they answer together:** *What is a city trying to be known for,
and which other cities make that same pitch — even when they are nowhere near
each other?*

Each view alone is weak. The grid tells you Ghent is "The Night Owl" but not
who else is; the scatter shows clusters but not what the clusters mean; the
comparison is precise but you need to already know which pair to look at. Chained
together, the grid gives you a candidate set, the scatter shows you who sits
near your city, and the comparison tells you whether that nearness is real.

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

### Prototype A — faceted dashboard

```
type grid  --FILTER-->  stat row + scatter
any view   --LINK---->  every view (hover highlights)
any view   --SELECT-->  head-to-head (up to two cities)
```

- **Click a grid row** → filters. Those cities are *removed* from the scatter,
  and the four summary numbers recompute over the subset (e.g. selecting
  The Naturalist drops 50 → 8 cities and the "talks most about" figure changes).
- **Hover any mark** → links. The matching city is ringed in every view;
  nothing is removed and no aggregate moves.
- **Click any two cities** (in either view) → opens the head-to-head.
- Scatter axes stay pinned to all 50 cities so the frame does not jump while
  filtering.
- Toggle: group the grid by **what cities talk about** (Archetype) or
  **how they sell it** (Personality).

### Prototype B — stacked, map-first

```
obscurity brush --FILTER-->  map + scatter + cross-region stat
type grid       --LINK---->  map + scatter (highlight, nothing removed)
map click       --SELECT-->  twin arcs + head-to-head
```

- **Brush the obscurity strip** → filters. Cities leave the map and the scatter,
  and the cross-region statistic recomputes (50 → 32 cities moved it from 56%
  to 53%).
- **Click a grid row** → *highlights only.* Non-matching cities stay on the map,
  stay visible and stay clickable. This is the deliberate contrast with A.
- **Click a city on the map** → draws a great-circle arc to each of its four
  twins, one per definition, labelled underneath.
- Filtering moved to **Obscurity** (Wikipedia pageviews, log-scaled) rather than
  our hand-assigned popular/hidden label, because about 10 of the 50 cities sit
  on the wrong side of their own traffic (Chicago is tagged "hidden" on 3.6M
  views/year).

---

## 3. Screenshots

**Prototype A — default state** (`docs/screenshots/proto-a.png`)
All 50 cities, grouped by archetype.

**Prototype A — filtered and compared** (`docs/screenshots/proto-a-compare.png`)
"The Architect" selected: 50 → 6 cities, summary numbers recomputed, Bucharest
vs. Helsinki in the head-to-head below.

**Prototype B — twin arcs** (`docs/screenshots/proto-b-arcs.png`)
Ghent selected. Its four twins are Paris (same words), Sydney (same distinctive
words), Yerevan (same subjects) and Zurich (same sales pitch) — four different
cities, on three continents.

**Prototype B — brush filter + highlight** (`docs/screenshots/proto-b-brush-highlight.png`)
Brushed to the more obscure 32 cities, with The Aesthete highlighted. Note the
non-highlighted cities are still drawn and still clickable.

Dark mode renders are in `docs/screenshots/*-dark.png`.

---

## 4. Comparison, and what we would build on

| | Prototype A | Prototype B |
| --- | --- | --- |
| Best at | "Show me cities like *this kind*" | "Show me cities like *this one*" |
| Entry point | A category | A specific city |
| Filtering | Type grid (removes) | Obscurity brush (removes) |
| Geography | None | The whole premise |
| Weakness | Removing cities hides the comparison you did not know to want | Longer scroll; the brush is less discoverable than a clickable row |

**What coordinating the views revealed that one view could not.** In A, filtering
to a single archetype and then reading the scatter showed that cities sharing an
archetype are often *not* near each other on any two theme axes — the label is
doing less work than it appears to. In B, the arcs made the headline finding
visible immediately: **28 of 50 cities (56%) have their closest-sounding twin in
a different world region.** Ghent's nearest neighbour by distinctive vocabulary
is Sydney. No single view shows that; it needs the map plus the twin measure.

**What was confusing.** In B, the fact that the grid highlights but the brush
removes is not self-evident — we added a caption saying so, which is a sign the
interaction needs a better affordance rather than a label. In A, filtering down
to 4–6 cities makes the scatter look sparse and slightly pointless; a count
badge or an "N of 50" watermark inside the plot would help.

**Next steps.** We lean toward **B's selection-driven model as the spine** of the
final project, with A's faceted grid demoted to a filter panel beside it. The
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
  else. Archetype and personality have 10 levels each, which no categorical
  palette can carry; they get position and grouping instead.

> *Teammates: edit this section to match what each of us actually did before
> submitting — the content above is accurate to the build, but the "we" should
> be yours.*
