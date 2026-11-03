<script>
  /**
   * All 50 cities as cards, ordered by whichever measure is selected.
   *
   * Sorting (rather than plotting) is the point: it answers "who leads on
   * food?" by reading down a column, which needs no chart literacy at all.
   * The ranks are computed over the full 50 so a card keeps its true standing
   * even when the category filter hides some of its neighbours.
   */
  import { flip } from 'svelte/animate';
  import CityCard from './CityCard.svelte';
  import { rankCities } from './data.js';

  let {
    /** All 50, for ranking. */
    cities = [],
    /** The subset that survives the filter — others are dimmed or dropped. */
    visibleNames = null,
    measure,
    direction = 'desc',
    hoveredCity = null,
    picks = [],
    /** Lead each card with its archetype rather than the measure value. */
    typeFirst = false,
    /** Compact horizontal rows, for a single-column list. */
    dense = false,
    /** Portrait, playing-card proportions. */
    portrait = false,
    /** Allow cards to be dragged into a comparison slot. */
    draggable = false,
    /** Tint each card with its city's own hue. */
    cityColor = false,
    /** Force an exact number of columns instead of auto-filling. */
    columns = null,
    /** LINK: names to keep emphasised. The rest dim; none are removed. */
    highlightNames = null,
    /** Name -> a short label hung on that card. */
    tags = null,
    /** Name -> a colour; that card wears it, solid, like the reader's ticket. */
    spots = null,
    /** Print each portrait card's selling style in words. */
    showVoice = false,
    onhovercity = () => {},
    onpickcity = () => {}
  } = $props();

  // Rank over all 50, descending on the measure: rank 1 = the highest value.
  let ranked = $derived.by(() => {
    const { sorted, rank } = rankCities(cities, measure);
    const ordered = direction === 'desc'
      ? sorted
      : [...cities].sort((a, b) => measure.get(a) - measure.get(b) || a.city.localeCompare(b.city));
    return ordered.map((c) => ({ city: c, rank: rank.get(c.city) }));
  });

  // Cards travel to their new rank, which shows what a re-sort changed.
  const still = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let shown = $derived(
    visibleNames ? ranked.filter((r) => visibleNames.has(r.city.city)) : ranked
  );
  let max = $derived(Math.max(1e-9, ...cities.map((c) => measure.get(c))));
</script>

<div
  class="grid"
  class:fixed-cols={!!columns}
  style={columns ? `--cols: ${columns};` : undefined}
  role="list"
>
  {#each shown as r (r.city.city)}
    <div role="listitem" animate:flip={{ duration: still ? 0 : 320 }}>
      <CityCard
        city={r.city}
        {measure}
        {max}
        rank={r.rank}
        total={cities.length}
        {typeFirst}
        {dense}
        {portrait}
        {draggable}
        {cityColor}
        picked={picks.includes(r.city.city)}
        hovered={hoveredCity === r.city.city}
        dimmed={!!highlightNames && !highlightNames.has(r.city.city)}
        tag={tags?.get(r.city.city) ?? null}
        spot={spots?.get(r.city.city) ?? null}
        {showVoice}
        onhover={onhovercity}
        onpick={onpickcity}
      />
    </div>
  {/each}
</div>

{#if !shown.length}
  <p class="note empty">No cities match this filter.</p>
{/if}

<style>
  .grid > :global(div) { display: flex; }
  .grid > :global(div) > :global(*) { width: 100%; }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(var(--card-min, 188px), 1fr));
    gap: 10px;
  }
  /* A fixed column count only once there is room for it. Forcing ten columns
     at phone width pushed the page to 442px of horizontal scroll, because the
     cards cannot shrink below their content. */
  @media (min-width: 1100px) {
    .grid.fixed-cols {
      grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
    }
  }
  .empty { padding: 28px; text-align: center; }
</style>
