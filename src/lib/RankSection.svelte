<script>
  /**
   * Rank the 50, where the journey lands: all fifty on one theme, or on one
   * selling move.
   *
   * The mode, theme and move are the route's; this section reports changes
   * through `onby`, `ontheme` and `onvoice`. A selling move is scored in
   * standard deviations from the fifty-city average, so it runs below zero
   * where a theme rate cannot.
   *
   *   mode toggle   --SWAP---->  which chips show, and the measure
   *   chips         --SORT---->  strip, standing line, summary, list
   *   legend        --FILTER-->  strip + summary + list (removes a category)
   *   hover         --LINK---->  strip + list (highlight, nothing removed)
   *
   * Colour is category and nothing else, plus the reader's own cities in their
   * ticket colour. The list below the strip is the leaders, the reader's city
   * with a neighbour each side, and the last one: the rows a reader looks for
   * in a ranking of fifty, without drawing all fifty.
   */
  import { THEMES, PERSONALITIES, VOICE_SHORT, axisById, rankCities, rankSummary, VOICE_TICKET } from './data.js';
  import RankRunway from './RankRunway.svelte';

  let {
    cities = [],
    dest = '',
    compare = '',
    by = 'theme',
    theme = 'Food',
    voice = 'The Braggart',
    onby = () => {},
    ontheme = () => {},
    onvoice = () => {},
    onpick = () => {}
  } = $props();

  // The legend is the filter. One category always stays on, so the strip is
  // never empty and turning both on again is the clear.
  let show = $state({ popular: true, hidden: true });
  function toggle(cat) {
    const next = { ...show, [cat]: !show[cat] };
    if (!next.popular && !next.hidden) return;
    show = next;
  }
  let filtering = $derived(!show.popular || !show.hidden);

  let hoveredCity = $state(null);

  let isTheme = $derived(by === 'theme');
  /** A selling move as a measure, shaped like the theme measures in data.js. */
  const voiceMeasure = (p) => ({
    id: `voice:${p}`,
    label: p,
    unit: 'standard deviations from the fifty-city average',
    get: (c) => c.voice[p]
  });
  let measure = $derived(isTheme ? axisById(`theme:${theme}`) : voiceMeasure(voice));
  let filtered = $derived(cities.filter((c) => show[c.category]));
  let summary = $derived(rankSummary(filtered, measure));
  const fmt = (v) => (isTheme ? v.toFixed(1) : `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}`);

  // Ranks stay out of all fifty whatever is filtered, so a city's number never
  // changes under it; the filter only takes rows away.
  let rank = $derived(rankCities(cities, measure).rank);
  let picks = $derived([dest, compare].filter(Boolean));
  let held = $derived(cities.filter((c) => picks.includes(c.city)));
  let heldLine = $derived(
    picks
      .map((n) => held.find((c) => c.city === n))
      .filter(Boolean)
      .map((c) => `${c.city} is #${rank.get(c.city)} of 50 at ${fmt(measure.get(c))}`)
      .join(', and ')
  );
  let spots = $derived(new Map(held.map((c) => [c.city, VOICE_TICKET[c.personality]])));

  /** Leaders, each held city with a neighbour either side, and the last. */
  let list = $derived.by(() => {
    const { sorted } = rankCities(filtered, measure);
    if (!sorted.length) return [];
    const keep = new Set([0, 1, 2, 3, 4, sorted.length - 1].filter((i) => i < sorted.length));
    for (const name of picks) {
      const at = sorted.findIndex((c) => c.city === name);
      if (at >= 0) for (let i = at - 1; i <= at + 1; i++) if (i >= 0 && i < sorted.length) keep.add(i);
    }
    // Bars run from the lowest value shown, which is 0 for a theme rate and
    // below zero for a selling move.
    const max = measure.get(sorted[0]);
    const min = Math.min(0, measure.get(sorted[sorted.length - 1]));
    const span = Math.max(1e-9, max - min);
    const out = [];
    let prev = -1;
    for (const i of [...keep].sort((a, b) => a - b)) {
      if (i > prev + 1) out.push({ gap: true, key: `gap-${i}` });
      const c = sorted[i];
      out.push({ key: c.city, c, value: measure.get(c), width: ((measure.get(c) - min) / span) * 100 });
      prev = i;
    }
    return out;
  });
</script>

<section class="rank">
  <header>
    <div class="title-row">
      <h2>Rank the 50</h2>
      <div class="mode" role="group" aria-label="Rank by">
        <button aria-pressed={isTheme} onclick={() => onby('theme')}>By theme</button>
        <button aria-pressed={!isTheme} onclick={() => onby('personality')}>By personality</button>
      </div>
    </div>
    <p>
      {isTheme
        ? 'Every tourism board, sorted by how much it talks about one theme.'
        : 'Every tourism board, sorted by how hard it leans on one way of selling.'}
    </p>
  </header>

  {#if isTheme}
    <div class="themes" role="group" aria-label="Rank by theme">
      {#each THEMES as t (t)}
        <button aria-pressed={theme === t} onclick={() => ontheme(t)}>{t}</button>
      {/each}
    </div>
  {:else}
    <div class="themes" role="group" aria-label="Rank by selling move">
      {#each PERSONALITIES as p (p)}
        <button aria-pressed={voice === p} onclick={() => onvoice(p)} title={VOICE_SHORT[p]}>{p.replace(/^The /, '')}</button>
      {/each}
    </div>
  {/if}

  <p class="standing" aria-live="polite">
    {#if isTheme}
      On {theme}, {heldLine} mentions per 1,000 words.
    {:else}
      On {voice}’s move, {heldLine} standard deviations from the average site.
    {/if}
  </p>

  <!-- The ranking itself on the same white card as every other chart. -->
  <div class="board">
  <RankRunway
    cities={filtered}
    {measure}
    {picks}
    {spots}
    {hoveredCity}
    onhover={(c) => (hoveredCity = c)}
    {onpick}
  />

  <div class="legend" role="group" aria-label="Show category">
    <button class="big" aria-pressed={show.popular} onclick={() => toggle('popular')}><i></i>Big destinations</button>
    <button class="gem" aria-pressed={show.hidden} onclick={() => toggle('hidden')}><i></i>Hidden gems</button>
    {#if filtering}
      <button class="clear" onclick={() => (show = { popular: true, hidden: true })}>Show all 50</button>
    {/if}
    <span class="hand">Categories are hand-labelled, so a gap between them partly measures the labels.</span>
  </div>

  {#if summary}
    <p class="summary" aria-live="polite">
      {summary.leader.city} leads at {fmt(measure.get(summary.leader))}. The median of these {summary.n} is {fmt(summary.median)}.
      {#if isTheme && measure.get(summary.lowest[0]) === 0}
        {summary.lowest.length === 1 ? `${summary.lowest[0].city} never mentions it.` : `${summary.lowest.length} never mention it.`}
      {/if}
    </p>
  {/if}

  <ol class="list">
    {#each list as row (row.key)}
      {#if row.gap}
        <li class="gap" aria-hidden="true">···</li>
      {:else}
        <li>
          <button
            class="r"
            class:mine={picks.includes(row.c.city)}
            class:hovered={hoveredCity === row.c.city}
            onmouseenter={() => (hoveredCity = row.c.city)}
            onmouseleave={() => (hoveredCity = null)}
            onclick={() => onpick(row.c.city)}
            disabled={row.c.city === dest}
          >
            <span class="n">#{rank.get(row.c.city)}</span>
            <span class="name">{row.c.city}</span>
            <span class="bar-track">
              <span
                class="bar"
                class:gem={row.c.category === 'hidden'}
                style="width: {Math.max(1.5, row.width)}%;{spots.has(row.c.city) ? ` background:${spots.get(row.c.city)}` : ''}"
              ></span>
            </span>
            <span class="v">{fmt(row.value)}</span>
          </button>
        </li>
      {/if}
    {/each}
  </ol>
  <p class="hint">
    {compare ? `Click a city to compare it with ${dest} instead.` : `Click a city to compare it with ${dest}.`}
    Ranks are out of all 50, and ties share one.
  </p>
  </div>
</section>

<style>
  .rank { width: min(var(--scene-w), 100%); margin-inline: auto; padding-inline: 16px; }
  .board {
    --surface: #fff;
    margin-top: 20px;
    padding: var(--card-pad);
    border-radius: var(--card-radius);
    background: #fff;
    box-shadow: var(--card-shadow);
  }
  .title-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px 20px; }
  /* Two linked pills: the one choice of what to rank by. */
  .mode { display: inline-flex; padding: 3px; border-radius: 999px; background: #fff; box-shadow: inset 0 0 0 1px #dfe5ef; }
  .mode button { padding: 7px 16px; border-radius: 999px; background: transparent; color: var(--text-secondary); font-size: 0.88rem; box-shadow: none; }
  .mode button[aria-pressed='true'] { background: var(--text-primary); color: #fff; }
  h2 { font-family: var(--display); font-size: var(--scene-h2); font-weight: 400; letter-spacing: -0.01em; line-height: 1.1; }
  header p { margin-top: 8px; max-width: 62ch; font-size: 1rem; line-height: 1.5; color: var(--text-secondary); }
  .themes { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 20px; }
  .themes button { font-size: 0.88rem; padding: 7px 14px; border-radius: 999px; background: #fff; }
  .themes button[aria-pressed='true'] { background: var(--text-primary); }
  .standing { margin: 24px 0 0; font-family: var(--display); font-size: clamp(1.25rem, 2.6vw, 1.8rem); line-height: 1.2; text-wrap: balance; }

  .legend { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 10px; margin-top: 8px; }
  .legend button {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 5px 12px; border-radius: 999px; background: #fff; box-shadow: inset 0 0 0 1px #dfe5ef;
    color: var(--text-primary); font-size: 0.85rem;
  }
  .legend button[aria-pressed='false'] { opacity: 0.45; }
  .legend button[aria-pressed='false'] i { background: transparent; box-shadow: inset 0 0 0 2px currentColor; }
  .legend i { width: 11px; height: 11px; border-radius: 50%; display: inline-block; }
  .legend .big i { background: var(--big); color: var(--big); }
  .legend .gem i { background: var(--gem); color: var(--gem); }
  .legend .clear { background: transparent; text-decoration: underline; text-underline-offset: 3px; padding-inline: 4px; }
  .hand { font-size: 0.76rem; color: var(--text-muted); }

  .summary { margin-top: 12px; max-width: 86ch; font-size: 0.92rem; line-height: 1.5; color: var(--text-secondary); }

  .list { list-style: none; margin: 18px 0 0; padding: 0; display: grid; gap: 2px; max-width: 640px; }
  .r {
    width: 100%;
    display: grid;
    grid-template-columns: 2.6em 9em minmax(0, 1fr) 3.2em;
    align-items: center;
    gap: 10px;
    padding: 6px 8px;
    border: none;
    border-radius: 10px;
    background: transparent;
    color: var(--text-primary);
    font: inherit;
    font-size: 0.92rem;
    text-align: left;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
  }
  .r:hover:not(:disabled), .r.hovered { background: rgba(25, 30, 59, 0.05); }
  .r:disabled { cursor: default; opacity: 1; }
  .r.mine { font-weight: 650; }
  .r:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; }
  .n { color: var(--text-muted); text-align: right; }
  .name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .v { text-align: right; }
  .bar-track { display: block; height: 8px; border-radius: 4px; background: #e3e8f1; }
  .bar { display: block; height: 100%; border-radius: 4px; background: var(--big); }
  .bar.gem { background: var(--gem); }
  .gap { padding: 0 8px 0 3.4em; color: var(--text-muted); line-height: 1; }
  .hint { margin-top: 10px; font-size: 0.8rem; color: var(--text-muted); }

  @media (max-width: 520px) {
    .r { grid-template-columns: 2.4em 7em minmax(0, 1fr) 2.8em; gap: 8px; }
  }
</style>
