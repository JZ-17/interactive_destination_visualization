<script>
  /**
   * Rank the 50, where both journeys land. The reader's cities stay visible at
   * three distances: flagged on the runway, named in the line above it, and as
   * the two cards in the deck that wear their ticket colour.
   *
   *   theme + order --SORT---->  runway stays by value, card order changes
   *   Show pills    --FILTER-->  runway + cards + summary line
   *   hover         --LINK---->  runway + cards (highlight, nothing removed)
   */
  import {
    AXIS_OPTIONS, axisById, rankCities, rankSummary, THEMES, VOICE_TICKET
  } from './data.js';
  import CardGrid from './CardGrid.svelte';
  import RankRunway from './RankRunway.svelte';
  import Legend from './Legend.svelte';

  let { cities = [], from = '', to = '', onpick = () => {} } = $props();

  let measureKey = $state('theme:Food');
  let direction = $state('desc');
  let categoryFilter = $state('all');
  let hoveredCity = $state(null);

  let measure = $derived(axisById(measureKey));
  const THEME_KEYS = THEMES.map((t) => `theme:${t}`);
  const OTHER_MEASURES = AXIS_OPTIONS.filter((a) => a.group !== 'Theme emphasis');

  let filtered = $derived(
    categoryFilter === 'all' ? cities : cities.filter((c) => c.category === categoryFilter)
  );
  let filteredNames = $derived(new Set(filtered.map((c) => c.city)));
  let summary = $derived(rankSummary(filtered, measure));
  let isTheme = $derived(measure.group === 'Theme emphasis');
  // Same rule as the cards, so a number reads the same in both places.
  let decimals = $derived(Math.max(0, ...cities.map(measure.get)) <= 1.5 ? 2 : 1);
  const fmt = (v) => v.toFixed(decimals);

  let picks = $derived([from, to].filter(Boolean));
  let rank = $derived(rankCities(cities, measure).rank);
  let held = $derived(cities.filter((c) => picks.includes(c.city)));
  let heldLine = $derived(
    picks
      .map((n) => held.find((c) => c.city === n))
      .filter(Boolean)
      .map((c) => `${c.city} is #${rank.get(c.city)} at ${fmt(measure.get(c))}`)
      .join(', and ')
  );

  let tags = $derived.by(() => {
    // A card in its ticket colour has no category border, so its tag says it.
    const kind = (name) =>
      cities.find((c) => c.city === name)?.category === 'hidden' ? 'hidden gem' : 'big destination';
    const out = new Map();
    if (from) out.set(from, `From, ${kind(from)}`);
    if (to) out.set(to, `To, ${kind(to)}`);
    return out;
  });
  let spots = $derived(new Map(held.map((c) => [c.city, VOICE_TICKET[c.personality]])));
</script>

<section class="rank">
  <header>
    <h2>Rank the 50</h2>
    <p>
      {picks.length === 2
        ? 'Every tourism board, sorted by how much it talks about one thing. Click a card to make it your new destination.'
        : 'Every tourism board, sorted by how much it talks about one thing. Click a card to compare that city with yours.'}
    </p>
  </header>

  <div class="themes" role="group" aria-label="Sort by theme">
    {#each THEME_KEYS as key (key)}
      <button aria-pressed={measureKey === key} onclick={() => (measureKey = key)}>{axisById(key).label}</button>
    {/each}
  </div>

  <p class="standing" aria-live="polite">
    On {measure.label}, {heldLine}{isTheme ? ' mentions per 1,000 words' : ''}.
  </p>

  <RankRunway
    cities={filtered}
    {measure}
    {picks}
    {hoveredCity}
    onhover={(c) => (hoveredCity = c)}
    {onpick}
  />

  <p class="summary" aria-live="polite">
    {summary.leader.city} leads at {fmt(measure.get(summary.leader))}, and the median of these {summary.n} is {fmt(summary.median)}.
    {#if isTheme && measure.get(summary.lowest[0]) === 0}
      {summary.lowest.length === 1 ? `${summary.lowest[0].city} never mentions it.` : `${summary.lowest.length} never mention it.`}
    {:else if summary.lowest.length === 1}
      {summary.lowest[0].city} is lowest at {fmt(measure.get(summary.lowest[0]))}.
    {:else}
      {summary.lowest.length} tie for lowest at {fmt(measure.get(summary.lowest[0]))}.
    {/if}
    {#if !isTheme}<span class="unit">Unit: {measure.unit}.</span>{/if}
  </p>

  <div class="secondary">
    <label class="field">
      <span>Or sort by</span>
      <select value={isTheme ? '' : measureKey} onchange={(e) => { if (e.currentTarget.value) measureKey = e.currentTarget.value; }}>
        <option value="">Another measure</option>
        {#each OTHER_MEASURES as a (a.id)}<option value={a.id}>{a.label}</option>{/each}
      </select>
    </label>
    <div class="field">
      <span id="order-label">Order</span>
      <div class="segmented" role="group" aria-labelledby="order-label">
        <button aria-pressed={direction === 'desc'} onclick={() => (direction = 'desc')}>Most first</button>
        <button aria-pressed={direction === 'asc'} onclick={() => (direction = 'asc')}>Least first</button>
      </div>
    </div>
    <div class="field">
      <span id="show-label">Show</span>
      <div class="segmented" role="group" aria-labelledby="show-label">
        <button aria-pressed={categoryFilter === 'all'} onclick={() => (categoryFilter = 'all')}>All 50</button>
        <button aria-pressed={categoryFilter === 'popular'} onclick={() => (categoryFilter = 'popular')}>Big destinations</button>
        <button aria-pressed={categoryFilter === 'hidden'} onclick={() => (categoryFilter = 'hidden')}>Hidden gems</button>
      </div>
    </div>
    <div class="legend-box"><Legend note={false} /></div>
  </div>
  <p class="legend-note">
    A card’s border shows the category, and its tint only tells cities apart. Yours
    wear their ticket colour. Top line: the theme a city over-indexes on. Bottom: how it sells. Rank is out of
    all 50, and ties share one.
  </p>

  <div class="deck">
    <CardGrid
      {cities}
      visibleNames={filteredNames}
      {measure}
      {direction}
      {hoveredCity}
      {picks}
      {tags}
      {spots}
      portrait={true}
      cityColor={true}
      showVoice={true}
      onhovercity={(c) => (hoveredCity = c)}
      onpickcity={onpick}
    />
  </div>
</section>

<style>
  .rank { width: min(1280px, 100%); margin-inline: auto; padding-inline: 16px; --card-min: 156px; }
  h2 { font-family: var(--display); font-size: clamp(2.2rem, 5vw, 3.6rem); font-weight: 400; letter-spacing: -0.015em; line-height: 1.05; }
  header p { margin-top: 4px; max-width: 66ch; font-size: 1rem; line-height: 1.5; color: var(--text-secondary); }
  .themes { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 20px; }
  .themes button { font-size: 0.88rem; padding: 7px 14px; border-radius: 999px; background: #fff; }
  .themes button[aria-pressed='true'] { background: var(--text-primary); }
  .standing { margin-top: 22px; font-family: var(--display); font-size: clamp(1.25rem, 2.6vw, 1.8rem); line-height: 1.2; }
  .summary { margin-top: 10px; max-width: 86ch; font-size: 0.92rem; line-height: 1.5; color: var(--text-secondary); }
  .unit { color: var(--text-muted); }
  .secondary { display: flex; flex-wrap: wrap; gap: 14px 26px; align-items: flex-end; margin-top: 18px; }
  .field { display: flex; flex-direction: column; gap: 4px; }
  .field > span { font-size: 0.74rem; color: var(--text-muted); }
  .field select { background: #fff; padding: 6px 9px; }
  .segmented { display: flex; flex-wrap: wrap; gap: 4px; }
  .segmented button { background: #fff; }
  .segmented button[aria-pressed='true'] { background: var(--text-primary); }
  .legend-box { margin-left: auto; padding-bottom: 6px; }
  .legend-note { margin-top: 12px; max-width: 86ch; font-size: 0.76rem; line-height: 1.4; color: var(--text-muted); }
  .deck { margin-top: 20px; }
  .deck :global(.grid) { gap: 16px 12px; }
  @media (max-width: 760px) { .legend-box { margin-left: 0; } }
</style>
