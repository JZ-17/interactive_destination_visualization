<script>
  /**
   * What one city talks about, theme by theme, read straight off its text.
   *
   * One row per theme. The strip is the city's own description laid out from
   * its first word to its last, with a tick wherever a theme word falls, so a
   * row shows both how often the site comes back to a theme and where: all in
   * the opening, or threaded through. Hover a tick for the sentence around it.
   * Under the strip are the distinct words that matched, whole rather than
   * as the lexicon's stems ("history", not "histor"); at the right, the
   * theme's rate and the rank that rate earns among all fifty. Rows are ordered
   * by that rank, so the themes the city out-talks the others on come first.
   *
   * The ticks wear the ticket colour because they are this city's own words,
   * the same as its other marks. Positions are a share of its own text, so a
   * long site and a short one both run edge to edge.
   * Clicking a row opens that theme in Rank the 50.
   */
  import { THEMES, axisById, rankCities, themeMentions, mentionWords } from './data.js';

  let { cities = [], city, active = '', onpick = () => {} } = $props();

  const W = 400;
  const PAD = 6;

  let mentions = $derived(themeMentions(city));

  let rows = $derived(
    THEMES.map((theme) => {
      const measure = axisById(`theme:${theme}`);
      const { rank } = rankCities(cities, measure);
      return {
        theme,
        value: measure.get(city),
        rank: rank.get(city.city),
        words: mentionWords(mentions[theme]),
        ticks: mentions[theme].map((m, i) => ({ ...m, i, x: PAD + m.at * (W - 2 * PAD) }))
      };
    }).sort((a, b) => a.rank - b.rank || b.value - a.value)
  );

  /** Ranks of 1 to 3 read as the city's strong suits. */
  const strong = (r) => r.rank <= 3 && r.value > 0;
</script>

<section class="profile">
  <h2>What {city.city} talks about</h2>
  <p class="lede">Every mention of each theme, where it falls in {city.city}’s description, and where that puts it among the fifty.</p>

  <div class="head" aria-hidden="true">
    <span></span>
    <span class="ends"><span>first word</span><span>last word</span></span>
    <span class="r">rank · rate</span>
  </div>

  <ul>
    {#each rows as r (r.theme)}
      <li>
        <button
          class="row"
          class:strong={strong(r)}
          aria-pressed={active === r.theme}
          onclick={() => onpick(r.theme)}
          aria-label="{r.theme}: {r.ticks.length} {r.ticks.length === 1 ? 'mention' : 'mentions'}, {r.value.toFixed(1)} per 1,000 words, number {r.rank} of 50. Rank the fifty on {r.theme}."
        >
          <span class="theme">{r.theme}</span>
          <span class="track" aria-hidden="true">
            <svg viewBox="0 0 {W} 24" preserveAspectRatio="none">
              <line class="base" x1="0" x2={W} y1="12" y2="12" />
              {#each r.ticks as t (t.i)}
                <g class="mention">
                  <title>{t.word}: {t.context}</title>
                  <rect class="hit" x={t.x - 4} y="0" width="8" height="24" />
                  <line class="tick" x1={t.x} x2={t.x} y1="3" y2="21" />
                </g>
              {/each}
            </svg>
          </span>
          <span class="stat"><b>#{r.rank}</b> · {r.value.toFixed(1)}</span>
          <span class="words">
            {#if r.words.length}
              {#each r.words.slice(0, 6) as w (w)}<span>{w}</span>{/each}
              {#if r.words.length > 6}<span class="more">+{r.words.length - 6}</span>{/if}
            {:else}
              <span class="none">never mentioned</span>
            {/if}
          </span>
        </button>
      </li>
    {/each}
  </ul>

  <p class="note">
    Each tick is one mention, placed where it falls in {city.city}’s description.
    Rates are mentions per 1,000 words; the rank is among all fifty. Pick a theme
    to rank the fifty on it.
  </p>
</section>

<style>
  .profile { width: min(980px, 100%); margin-inline: auto; padding-inline: 16px; }
  h2 { font-family: var(--display); font-size: clamp(1.6rem, 3.2vw, 2.4rem); font-weight: 400; letter-spacing: -0.01em; line-height: 1.1; text-wrap: balance; }
  .lede { margin-top: 6px; color: var(--text-secondary); max-width: 60ch; }

  /* One grid template shared by the header and every row, so the columns line up. */
  .head, .row {
    display: grid;
    grid-template-columns: 9.5em minmax(0, 1fr) 6.5em;
    column-gap: 14px;
    align-items: center;
  }
  .head { margin-top: 26px; padding: 0 10px 6px; font-size: 0.76rem; color: var(--text-muted); }
  .ends { display: flex; justify-content: space-between; }
  .r { text-align: right; }

  ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
  .row {
    width: 100%;
    row-gap: 2px;
    padding: 9px 10px;
    border: none;
    border-radius: 12px;
    background: transparent;
    color: var(--text-primary);
    text-align: left;
    font: inherit;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  .row:hover { background: rgba(25, 30, 59, 0.045); }
  .row[aria-pressed='true'] { background: #fff; box-shadow: inset 0 0 0 1.5px var(--ticket); }
  .row:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; }

  .theme { font-size: 0.98rem; }
  .strong .theme { font-weight: 650; }

  .track { position: relative; display: block; height: 24px; }
  .track svg { display: block; width: 100%; height: 24px; overflow: visible; }
  /* The strip stretches with the row, so strokes keep a fixed width. */
  .base { stroke: #d6ddea; stroke-width: 1; vector-effect: non-scaling-stroke; }
  .tick { stroke: var(--ticket); stroke-width: 2.4; stroke-linecap: round; vector-effect: non-scaling-stroke; transition: stroke 0.4s ease; }
  /* A wider, invisible target than the 2px stroke, so a tick can be hovered. */
  .hit { fill: transparent; }
  .mention:hover .tick { stroke: var(--text-primary); }

  .stat { text-align: right; font-size: 0.9rem; color: var(--text-secondary); font-variant-numeric: tabular-nums; }
  .stat b { color: var(--text-primary); font-weight: 650; }

  /* The words sit under the strip, in its column, so they read as its evidence. */
  .words { grid-column: 2 / 4; display: flex; flex-wrap: wrap; gap: 4px; }
  .words span { font-size: 0.78rem; padding: 1px 8px; border-radius: 6px; background: #e8edf5; color: var(--text-secondary); }
  .words .more, .words .none { background: none; padding-inline: 2px; color: var(--text-muted); }

  .note { margin-top: 14px; font-size: 0.8rem; line-height: 1.45; color: var(--text-muted); max-width: 70ch; }

  @media (max-width: 600px) {
    .head, .row { grid-template-columns: 6.6em minmax(0, 1fr) 4.8em; column-gap: 8px; }
    .words { grid-column: 1 / 4; }
  }
  @media (prefers-reduced-motion: reduce) { .row { transition: none; } }
</style>
