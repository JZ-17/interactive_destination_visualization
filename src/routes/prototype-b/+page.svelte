<script>
  /**
   * PROTOTYPE B — "Start from a city, follow the thread."
   *
   * The same three views as Prototype A, recombined. Differences are
   * deliberate, so the two can be compared:
   *
   *   - Layout is a single stacked column, read top to bottom, instead of
   *     side-by-side facets.
   *   - The MAP is the entry point: clicking a city draws arcs to its four
   *     twins. In A there is no geography at all.
   *   - FILTERING moves to a brush over an external measure (Wikipedia
   *     obscurity) instead of the archetype grid.
   *   - The grid demotes to a LINK: hovering a row highlights those cities
   *     everywhere and removes nothing.
   *
   *   brush --filter--> map + scatter + stat line
   *   grid  --link---->  map + scatter   (highlight, nothing removed)
   *   map   --select-->  arcs + head-to-head
   */
  import { onMount } from 'svelte';
  import { loadCities, loadLand, THEMES } from '$lib/data.js';
  import WorldMap from '$lib/WorldMap.svelte';
  import ObscurityBrush from '$lib/ObscurityBrush.svelte';
  import ThemeScatter from '$lib/ThemeScatter.svelte';
  import ArchetypeGrid from '$lib/ArchetypeGrid.svelte';
  import HeadToHead from '$lib/HeadToHead.svelte';
  import Legend from '$lib/Legend.svelte';

  let cities = $state([]);
  let land = $state(null);
  let error = $state(null);

  // --- shared selection state, one owner each ---------------------------
  let obscurityRange = $state(null); // FILTER (brush, in data units)
  let highlightGroup = $state(null); // LINK   (archetype row)
  let hoveredCity = $state(null);    // LINK   (single mark)
  let picks = $state([]);            // selection for the comparison
  let groupBy = $state('archetype');
  let xKey = $state('obscurity');
  let yKey = $state('theme:Nature');

  // --- one derived subset; every filtered view reads this ---------------
  let filtered = $derived(
    obscurityRange
      ? cities.filter(
          (c) => c.obscurity >= obscurityRange[0] && c.obscurity <= obscurityRange[1]
        )
      : cities
  );
  let filteredNames = $derived(new Set(filtered.map((c) => c.city)));

  // Highlight narrows emphasis only — it never leaves the filtered set.
  let highlightNames = $derived(
    highlightGroup
      ? new Set(filtered.filter((c) => c[groupBy] === highlightGroup).map((c) => c.city))
      : null
  );

  let byName = $derived(new Map(cities.map((c) => [c.city, c])));
  let cityA = $derived(picks[0] ? byName.get(picks[0]) : null);
  let cityB = $derived(picks[1] ? byName.get(picks[1]) : null);
  // The map draws arcs for whichever city is currently in focus.
  let activeCity = $derived(hoveredCity ?? picks[picks.length - 1] ?? null);

  let crossRegion = $derived.by(() => {
    if (!filtered.length) return null;
    const n = filtered.filter((c) => c.crossRegionTwin).length;
    return { n, pct: Math.round((n / filtered.length) * 100) };
  });

  function pick(name) {
    if (picks.includes(name)) picks = picks.filter((p) => p !== name);
    else if (picks.length < 2) picks = [...picks, name];
    else picks = [picks[1], name];
  }

  onMount(async () => {
    try {
      const [loaded, geo] = await Promise.all([loadCities(), loadLand()]);
      cities = loaded.cities;
      land = geo;
    } catch (e) {
      error = e.message;
    }
  });
</script>

<svelte:head><title>Prototype B — Start from a city</title></svelte:head>

<main>
  <header class="top">
    <div>
      <p class="eyebrow">Prototype B · stacked, map-first</p>
      <h1>Which cities sound alike — and does distance have anything to do with it?</h1>
      <p class="lede">
        Fifty official tourism sites. Start on the map: click a city to see the
        four cities that most sound like it. Then narrow the field, or put two
        cities head to head.
      </p>
    </div>
    <nav>
      <a href="../">Overview</a>
      <a href="../prototype-a/">← Prototype A</a>
    </nav>
  </header>

  {#if error}
    <p class="panel error">Could not load the data: {error}</p>
  {:else if !cities.length}
    <p class="panel note">Loading 50 cities…</p>
  {:else}
    <section class="panel">
      <ObscurityBrush
        {cities}
        range={obscurityRange}
        {hoveredCity}
        onbrush={(r) => (obscurityRange = r)}
        onhovercity={(c) => (hoveredCity = c)}
      />
    </section>

    <section class="panel">
      <WorldMap
        cities={filtered}
        {land}
        {highlightNames}
        {activeCity}
        {hoveredCity}
        {picks}
        onhovercity={(c) => (hoveredCity = c)}
        onpickcity={pick}
      />
      <div class="statline">
        <Legend note={false} />
        {#if crossRegion}
          <p class="note">
            <strong>{crossRegion.n} of {filtered.length}</strong> cities on screen
            ({crossRegion.pct}%) have their closest-sounding twin in a different
            world region.
          </p>
        {/if}
      </div>
    </section>

    <div class="two-up">
      <section class="panel">
        <ThemeScatter
          cities={filtered}
          allCities={cities}
          {xKey}
          {yKey}
          {hoveredCity}
          {picks}
          {highlightNames}
          showExcluded={false}
          onhovercity={(c) => (hoveredCity = c)}
          onpickcity={pick}
          onchangeaxis={(which, id) => (which === 'x' ? (xKey = id) : (yKey = id))}
        />
      </section>

      <section class="panel">
        <div class="ghead">
          <div class="toggle">
            <button
              aria-pressed={groupBy === 'archetype'}
              onclick={() => { groupBy = 'archetype'; highlightGroup = null; }}
            >Talks about</button>
            <button
              aria-pressed={groupBy === 'personality'}
              onclick={() => { groupBy = 'personality'; highlightGroup = null; }}
            >Sells like</button>
          </div>
          {#if highlightGroup}
            <button onclick={() => (highlightGroup = null)}>Clear highlight</button>
          {/if}
        </div>
        <ArchetypeGrid
          cities={filtered}
          {groupBy}
          selectedGroup={highlightGroup}
          {hoveredCity}
          {picks}
          onselectgroup={(g) => (highlightGroup = g)}
          onhovercity={(c) => (hoveredCity = c)}
          onpickcity={pick}
        />
        <p class="note hint">
          Clicking a row <strong>highlights</strong> here — nothing leaves the map
          or the scatter. Only the brush above removes cities.
        </p>
      </section>
    </div>

    <section class="panel">
      <HeadToHead
        a={cityA}
        b={cityB}
        {cities}
        onclear={() => (picks = [])}
        onhovercity={(c) => (hoveredCity = c)}
      />
    </section>

    <footer class="note">
      Rates are per 1,000 words. "Twin" has four competing definitions here and
      they rarely agree — that disagreement is the finding, not a bug. Source:
      official tourism-board homepage text, 50 cities.
    </footer>
  {/if}
</main>

<style>
  main {
    max-width: 920px;
    margin: 0 auto;
    padding: 28px 16px 60px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; }
  .top h1 { margin-top: 5px; font-size: 1.45rem; }
  .lede { margin-top: 7px; max-width: 62ch; color: var(--text-secondary); font-size: 0.86rem; line-height: 1.5; }
  nav { display: flex; gap: 14px; font-size: 0.78rem; white-space: nowrap; }

  .statline {
    display: flex; justify-content: space-between; align-items: center;
    gap: 20px; flex-wrap: wrap;
    border-top: 1px solid var(--border);
    margin-top: 12px; padding-top: 10px;
  }
  .two-up {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
    gap: 14px;
    align-items: start;
  }
  .ghead { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px; }
  .toggle { display: flex; gap: 6px; }
  .hint { border-top: 1px solid var(--border); padding-top: 9px; margin-top: 10px; }

  .error { color: var(--text-primary); }
  footer { border-top: 1px solid var(--border); padding-top: 12px; max-width: 72ch; }

  @media (max-width: 860px) {
    .two-up { grid-template-columns: 1fr; }
    .top { flex-direction: column; gap: 12px; }
  }
</style>
