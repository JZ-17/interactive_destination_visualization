<script>
  /**
   * All 50 cities as cards, ordered by whichever measure is selected.
   *
   * Sorting (rather than plotting) is the point: it answers "who leads on
   * food?" by reading down a column, which needs no chart literacy at all.
   * The ranks are computed over the full 50 so a card keeps its true standing
   * even when the category filter hides some of its neighbours.
   */
  import CityCard from './CityCard.svelte';

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
    /** Allow cards to be dragged into a comparison slot. */
    draggable = false,
    onhovercity = () => {},
    onpickcity = () => {}
  } = $props();

  // Rank over all 50, descending on the measure: rank 1 = the highest value.
  let ranked = $derived.by(() => {
    const byValue = [...cities].sort((a, b) => measure.get(b) - measure.get(a));
    const rank = new Map(byValue.map((c, i) => [c.city, i + 1]));
    const ordered = direction === 'desc' ? byValue : [...byValue].reverse();
    return ordered.map((c) => ({ city: c, rank: rank.get(c.city) }));
  });

  let shown = $derived(
    visibleNames ? ranked.filter((r) => visibleNames.has(r.city.city)) : ranked
  );
  let max = $derived(Math.max(1e-9, ...cities.map((c) => measure.get(c))));
</script>

<div class="grid" role="list">
  {#each shown as r (r.city.city)}
    <div role="listitem">
      <CityCard
        city={r.city}
        {measure}
        {max}
        rank={r.rank}
        total={cities.length}
        {typeFirst}
        {dense}
        {draggable}
        picked={picks.includes(r.city.city)}
        hovered={hoveredCity === r.city.city}
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
  .empty { padding: 28px; text-align: center; }
</style>
