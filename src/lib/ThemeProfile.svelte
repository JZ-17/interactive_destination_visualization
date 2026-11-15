<script>
  /**
   * What one city talks about, theme by theme, read straight off its text.
   *
   * One row per theme. The strip is the city's own description laid out from
   * its first word to its last, with a tick wherever a theme word falls, so a
   * row shows both how often the site comes back to a theme and where: all in
   * the opening, or threaded through. Hovering a tick (or tapping it) opens a
   * small card with the sentence around it, the matched word in bold. It is
   * drawn by the page rather than left to the SVG <title> tooltip, which
   * appears late or not at all depending on the browser, and never on touch.
   * Under the strip are the distinct words that matched, whole rather than
   * as the lexicon's stems ("history", not "histor"). The theme's rate sits
   * under its name; the rank that rate earns among all fifty stands alone and
   * large at the right, because it is the one number comparable across rows.
   * Rows are ordered by that rank, so the themes the city out-talks the others
   * on come first. Nothing is emphasised beyond that order.
   *
   * The ticks wear the ticket colour because they are this city's own words,
   * the same as its other marks. Positions are a share of its own text, so a
   * long site and a short one both run edge to edge. The rows are for reading;
   * Rank the 50 below has its own theme chips.
   */
  import { THEMES, axisById, rankCities, themeMentions, mentionWords } from './data.js';

  let { cities = [], city } = $props();

  const W = 400;
  const PAD = 6;

  let mentions = $derived(themeMentions(city));

  /** The tick being read: its theme and its index in that theme's mentions. */
  let tip = $state(null);
  const isTip = (theme, i) => tip?.theme === theme && tip?.i === i;
  const toggle = (theme, i) => (tip = isTip(theme, i) ? null : { theme, i });

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
</script>

<section class="profile">
  <h2>What {city.city} talks about</h2>
  <p class="lede">Each tick is one mention, placed where it falls in {city.city}’s description. Hover a tick to read the sentence around it.</p>

  <div class="board">
  <div class="head" aria-hidden="true">
    <span></span>
    <span class="ends"><span>first word</span><span>last word</span></span>
    <span class="r">rank of 50</span>
  </div>

  <ul>
    {#each rows as r (r.theme)}
      <li class="row" aria-label="{r.theme}: {r.ticks.length} {r.ticks.length === 1 ? 'mention' : 'mentions'}, {r.value.toFixed(1)} per 1,000 words, number {r.rank} of 50">
        <span class="label" aria-hidden="true">
          <span class="theme">{r.theme}</span>
          <span class="rate">{r.value.toFixed(1)} per 1,000 words</span>
        </span>
        <span class="track" aria-hidden="true">
          <svg viewBox="0 0 {W} 24" preserveAspectRatio="none">
            <line class="base" x1="0" x2={W} y1="12" y2="12" />
            {#each r.ticks as t (t.i)}
              <g
                class="mention"
                class:on={isTip(r.theme, t.i)}
                role="presentation"
                onpointerenter={(e) => { if (e.pointerType === 'mouse') tip = { theme: r.theme, i: t.i }; }}
                onpointerleave={(e) => { if (e.pointerType === 'mouse' && isTip(r.theme, t.i)) tip = null; }}
                onclick={() => toggle(r.theme, t.i)}
              >
                <rect class="hit" x={t.x - 4} y="0" width="8" height="24" />
                <line class="tick" x1={t.x} x2={t.x} y1="3" y2="21" />
              </g>
            {/each}
          </svg>
          {#if tip?.theme === r.theme}
            {@const t = r.ticks[tip.i]}
            {#if t}
              <span
                class="tip"
                class:start={t.at < 0.18}
                class:end={t.at > 0.82}
                style="left: {(t.x / W) * 100}%"
              >{t.context.pre}<strong>{t.context.hit}</strong>{t.context.post}</span>
            {/if}
          {/if}
        </span>
        <span class="rank" aria-hidden="true">#{r.rank}</span>
        <span class="words" aria-hidden="true">
          {#if r.words.length}
            {#each r.words.slice(0, 6) as w (w)}<span>{w}</span>{/each}
            {#if r.words.length > 6}<span class="more">+{r.words.length - 6}</span>{/if}
          {:else}
            <span class="none">never mentioned</span>
          {/if}
        </span>
      </li>
    {/each}
  </ul>

  </div>
</section>

<style>
  .profile { width: min(980px, 100%); margin-inline: auto; padding-inline: 16px; }
  h2 { font-family: var(--display); font-size: clamp(1.6rem, 3.2vw, 2.4rem); font-weight: 400; letter-spacing: -0.01em; line-height: 1.1; text-wrap: balance; }
  .lede { margin-top: 6px; color: var(--text-secondary); max-width: 60ch; }

  /* One grid template shared by the header and every row, so the columns line
     up: name and rate, the strip and its words, the rank alone at the right. */
  .head, .row {
    display: grid;
    grid-template-columns: 11em minmax(0, 1fr) 4.5em;
    column-gap: 18px;
  }
  /* Everything under the subtitle sits on one white card, so the strips read
     as one instrument rather than lines loose on the page. */
  .board {
    margin-top: 24px;
    padding: clamp(16px, 2.6vw, 28px) clamp(16px, 2.8vw, 32px) clamp(14px, 2.2vw, 22px);
    border-radius: 20px;
    background: #fff;
    box-shadow: 0 1px 2px rgba(25, 30, 59, 0.05), 0 8px 28px rgba(25, 30, 59, 0.07);
  }
  .head { padding: 0 0 6px; font-size: 0.76rem; color: var(--text-muted); }
  .ends { display: flex; justify-content: space-between; }
  .r { text-align: right; white-space: nowrap; }

  ul { list-style: none; margin: 0; padding: 0; display: grid; }
  .row {
    grid-template-rows: auto auto;
    row-gap: 4px;
    padding: 12px 0;
    color: var(--text-primary);
  }

  .label { grid-row: 1 / 3; display: flex; flex-direction: column; gap: 2px; padding-top: 1px; }
  .theme { font-size: 0.98rem; line-height: 1.25; }
  .rate { font-size: 0.76rem; color: var(--text-muted); font-variant-numeric: tabular-nums; }

  /* The rank is the row's comparable number, so it is broken out and set large. */
  .rank {
    grid-column: 3;
    grid-row: 1 / 3;
    align-self: center;
    text-align: right;
    font-family: var(--display);
    font-size: clamp(1.5rem, 2.6vw, 2rem);
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .track { position: relative; display: block; height: 24px; }
  .track svg { display: block; width: 100%; height: 24px; overflow: visible; }
  /* The strip stretches with the row, so strokes keep a fixed width. */
  .base { stroke: #d6ddea; stroke-width: 1; vector-effect: non-scaling-stroke; }
  .tick { stroke: var(--ticket); stroke-width: 2.4; stroke-linecap: round; vector-effect: non-scaling-stroke; transition: stroke 0.4s ease; }
  /* A wider, invisible target than the 2px stroke, so a tick can be hovered. */
  .hit { fill: transparent; }
  .mention { cursor: pointer; }
  .mention:hover .tick, .mention.on .tick { stroke: var(--text-primary); }

  /* The sentence around a tick, floated above the strip. Anchored on the tick,
     then shifted so it never runs past either end of the row. */
  .tip {
    position: absolute;
    bottom: calc(100% + 8px);
    z-index: 5;
    width: max-content;
    max-width: min(340px, 80vw);
    padding: 8px 11px;
    border-radius: 10px;
    background: #fff;
    box-shadow: 0 6px 20px rgba(25, 30, 59, 0.16), 0 0 0 1px rgba(25, 30, 59, 0.08);
    font-size: 0.82rem;
    line-height: 1.4;
    color: var(--text-secondary);
    transform: translateX(-50%);
    pointer-events: none;
  }
  .tip.start { transform: translateX(-12px); }
  .tip.end { transform: translateX(calc(-100% + 12px)); }
  .tip strong { color: var(--text-primary); font-weight: 650; }

  /* The words sit under the strip, in its column, so they read as its evidence. */
  .words { grid-column: 2; grid-row: 2; display: flex; flex-wrap: wrap; gap: 4px; }
  .words span { font-size: 0.78rem; padding: 1px 8px; border-radius: 6px; background: #e8edf5; color: var(--text-secondary); }
  .words .more, .words .none { background: none; padding-inline: 2px; color: var(--text-muted); }


  @media (max-width: 600px) {
    .head, .row { grid-template-columns: 7.2em minmax(0, 1fr) 3.2em; column-gap: 10px; }
  }
</style>
