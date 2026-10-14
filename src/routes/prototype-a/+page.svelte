<script>
  /**
   * PROTOTYPE A — "Start from a type, narrow down."
   *
   * Three views, one shared selection, laid out as a classic faceted dashboard.
   * The grid on the left is the control surface: picking a group FILTERS the
   * scatter, the stat row and the comparison pool. Hovering anywhere LINKS
   * (highlights) without removing anything.
   *
   *   grid  --filter-->  stat row + scatter
   *   any view --link-->  every view (hover)
   *   any view --pick-->  head-to-head (up to two cities)
   */
  import { onMount } from 'svelte';
  import { loadCities, THEMES, axisById } from '$lib/data.js';
  import ArchetypeGrid from '$lib/ArchetypeGrid.svelte';
  import ThemeScatter from '$lib/ThemeScatter.svelte';
  import HeadToHead from '$lib/HeadToHead.svelte';
  import Legend from '$lib/Legend.svelte';

  let cities = $state([]);
  let error = $state(null);

  // --- shared selection state, one owner each ---------------------------
  let groupBy = $state('archetype');
  let selectedGroup = $state(null);  // FILTER
  let hoveredCity = $state(null);    // LINK
  let picks = $state([]);            // up to two, for the comparison
  let xKey = $state('theme:History');
  let yKey = $state('theme:Food');

  // --- one derived subset; every filtered view reads this ---------------
  let filtered = $derived(
    selectedGroup ? cities.filter((c) => c[groupBy] === selectedGroup) : cities
  );
  let filteredNames = $derived(new Set(filtered.map((c) => c.city)));

  let byName = $derived(new Map(cities.map((c) => [c.city, c])));
  let cityA = $derived(picks[0] ? byName.get(picks[0]) : null);
  let cityB = $derived(picks[1] ? byName.get(picks[1]) : null);

  // Aggregates recompute over `filtered`, never over the full 50.
  let stats = $derived.by(() => {
    if (!filtered.length) return null;
    const n = filtered.length;
    const gems = filtered.filter((c) => c.category === 'hidden').length;
    const obsc = [...filtered.map((c) => c.obscurity)].sort((a, b) => a - b);
    const median = obsc[Math.floor(n / 2)];
    const themeTotals = THEMES.map((t) => ({
      t,
      v: filtered.reduce((s, c) => s + c.themes[t], 0) / n
    })).sort((a, b) => b.v - a.v);
    return { n, gems, median, top: themeTotals[0], second: themeTotals[1] };
  });

  function pick(name) {
    if (picks.includes(name)) picks = picks.filter((p) => p !== name);
    else if (picks.length < 2) picks = [...picks, name];
    else picks = [picks[1], name]; // oldest falls off
  }

  onMount(async () => {
    try {
      ({ cities } = await loadCities());
    } catch (e) {
      error = e.message;
    }
  });
</script>

<svelte:head><title>Prototype A — Start from a type</title></svelte:head>

<main>
  <header class="top">
    <div>
      <p class="eyebrow">Prototype A · faceted dashboard</p>
      <h1>What is this city trying to be known for?</h1>
      <p class="lede">
        Fifty official tourism sites, scraped and counted. Pick a type on the left
        to narrow everything else down; click any two cities to put them head to
        head.
      </p>
    </div>
    <nav>
      <a href="../">Overview</a>
      <a href="../prototype-b/">Prototype B →</a>
    </nav>
  </header>

  {#if error}
    <p class="panel error">Could not load the data: {error}</p>
  {:else if !cities.length}
    <p class="panel note">Loading 50 cities…</p>
  {:else}
    <div class="controls panel">
      <div class="toggle">
        <span class="eyebrow">Group cities by</span>
        <div>
          <button
            aria-pressed={groupBy === 'archetype'}
            onclick={() => { groupBy = 'archetype'; selectedGroup = null; }}
          >What they talk about</button>
          <button
            aria-pressed={groupBy === 'personality'}
            onclick={() => { groupBy = 'personality'; selectedGroup = null; }}
          >How they sell it</button>
        </div>
      </div>
      <Legend />
    </div>

    <!-- Aggregates over the filtered subset. -->
    <div class="stats panel" aria-live="polite">
      <div class="stat">
        <span class="eyebrow">Showing</span>
        <strong>{stats.n}</strong>
        <span class="unit">of {cities.length} cities</span>
      </div>
      <div class="stat">
        <span class="eyebrow">Hidden gems</span>
        <strong>{stats.gems}</strong>
        <span class="unit">{Math.round((stats.gems / stats.n) * 100)}% of the selection</span>
      </div>
      <div class="stat">
        <span class="eyebrow">Median obscurity</span>
        <strong>{stats.median.toFixed(2)}</strong>
        <span class="unit">0 famous → 1 obscure</span>
      </div>
      <div class="stat wide">
        <span class="eyebrow">Talks most about</span>
        <strong>{stats.top.t}</strong>
        <span class="unit">
          {stats.top.v.toFixed(1)} per 1,000 words · then {stats.second.t}
          ({stats.second.v.toFixed(1)})
        </span>
      </div>
      {#if selectedGroup}
        <button class="clear" onclick={() => (selectedGroup = null)}>
          Clear "{selectedGroup}"
        </button>
      {/if}
    </div>

    <div class="grid-layout">
      <section class="panel left">
        <ArchetypeGrid
          {cities}
          {groupBy}
          {selectedGroup}
          {hoveredCity}
          {picks}
          onselectgroup={(g) => (selectedGroup = g)}
          onhovercity={(c) => (hoveredCity = c)}
          onpickcity={pick}
        />
        <p class="note hint">
          Click a row to keep only those cities. Click a dot to add that city to
          the comparison below.
        </p>
      </section>

      <section class="panel right">
        <ThemeScatter
          cities={filtered}
          allCities={cities}
          {xKey}
          {yKey}
          {hoveredCity}
          {picks}
          showExcluded={false}
          onhovercity={(c) => (hoveredCity = c)}
          onpickcity={pick}
          onchangeaxis={(which, id) => (which === 'x' ? (xKey = id) : (yKey = id))}
        />
        <p class="note hint">
          Filtered to <strong>{filtered.length}</strong> cities{#if selectedGroup}{' · '}{selectedGroup}{/if}.
          Axes stay fixed to all 50 so the frame does not jump as you filter.
        </p>
      </section>
    </div>

    <section class="panel compare">
      <HeadToHead
        a={cityA}
        b={cityB}
        {cities}
        onclear={() => (picks = [])}
        onhovercity={(c) => (hoveredCity = c)}
      />
    </section>

    <footer class="note">
      Rates are per 1,000 words, so a long scrape and a short one are comparable.
      Archetype is the theme a city over-indexes on, not the one it mentions most.
      Source: official tourism-board homepage text, 50 cities.
    </footer>
  {/if}
</main>

<style>
  main {
    max-width: 1180px;
    margin: 0 auto;
    padding: 28px 16px 60px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; }
  .top h1 { margin-top: 5px; }
  .lede { margin-top: 7px; max-width: 62ch; color: var(--text-secondary); font-size: 0.86rem; line-height: 1.5; }
  nav { display: flex; gap: 14px; font-size: 0.78rem; white-space: nowrap; }

  .controls {
    display: flex; justify-content: space-between; align-items: center;
    gap: 20px; flex-wrap: wrap;
  }
  .toggle { display: flex; flex-direction: column; gap: 5px; }
  .toggle > div { display: flex; gap: 6px; }

  .stats { display: flex; gap: 26px; align-items: flex-end; flex-wrap: wrap; }
  .stat { display: flex; flex-direction: column; gap: 1px; }
  .stat strong { font-size: 1.5rem; font-weight: 650; line-height: 1.1; }
  .stat .unit { font-size: 0.7rem; color: var(--text-muted); }
  .stat.wide strong { font-size: 1.05rem; padding-top: 6px; }
  .clear { margin-left: auto; }

  .grid-layout {
    display: grid;
    grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
    gap: 14px;
    align-items: stretch;
  }
  .left, .right { display: flex; flex-direction: column; gap: 10px; }
  .hint { border-top: 1px solid var(--border); padding-top: 9px; margin-top: auto; }

  .error { color: var(--text-primary); }
  footer { border-top: 1px solid var(--border); padding-top: 12px; max-width: 72ch; }

  @media (max-width: 900px) {
    .grid-layout { grid-template-columns: 1fr; }
    .top { flex-direction: column; gap: 12px; }
  }
</style>
