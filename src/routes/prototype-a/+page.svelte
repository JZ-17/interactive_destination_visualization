<script>
  /**
   * PROTOTYPE A — "Rank the 50."
   *
   * Pick a theme; all 50 cities sort into a card gallery, highest or lowest
   * first. Reading down a sorted column needs no chart literacy, which suits
   * the audience better than a scatter does for "who leads on X?".
   *
   *   theme + direction --SORT----->  card order
   *   category pills    --FILTER--->  cards + the summary numbers
   *   hover             --LINK----->  cards (highlight, nothing removed)
   *   two clicks        --SELECT--->  head-to-head
   */
  import { onMount } from 'svelte';
  import { loadCities, AXIS_OPTIONS, axisById } from '$lib/data.js';
  import CardGrid from '$lib/CardGrid.svelte';
  import HeadToHead from '$lib/HeadToHead.svelte';
  import Legend from '$lib/Legend.svelte';

  let cities = $state([]);
  let error = $state(null);

  // --- shared selection state, one owner each ---------------------------
  let measureKey = $state('theme:Food'); // SORT
  let direction = $state('desc');        // SORT
  let categoryFilter = $state('all');    // FILTER: all | popular | hidden
  let hoveredCity = $state(null);        // LINK
  let picks = $state([]);                // up to two, for the comparison

  let measure = $derived(axisById(measureKey));

  // --- one derived subset; every filtered view reads this ---------------
  let filtered = $derived(
    categoryFilter === 'all' ? cities : cities.filter((c) => c.category === categoryFilter)
  );
  let filteredNames = $derived(new Set(filtered.map((c) => c.city)));

  let byName = $derived(new Map(cities.map((c) => [c.city, c])));
  let cityA = $derived(picks[0] ? byName.get(picks[0]) : null);
  let cityB = $derived(picks[1] ? byName.get(picks[1]) : null);

  // Aggregates recompute over `filtered`, never over the full 50.
  let stats = $derived.by(() => {
    if (!filtered.length) return null;
    const vals = filtered.map((c) => measure.get(c)).sort((a, b) => a - b);
    const top = [...filtered].sort((a, b) => measure.get(b) - measure.get(a));
    return {
      n: filtered.length,
      median: vals[Math.floor(vals.length / 2)],
      leader: top[0],
      trailer: top[top.length - 1]
    };
  });

  const groups = [...new Set(AXIS_OPTIONS.map((a) => a.group))];
  let decimals = $derived(stats && stats.median <= 1.5 ? 2 : 1);

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

<svelte:head><title>Prototype A — Rank the 50</title></svelte:head>

<main>
  <header class="top">
    <div>
      <p class="eyebrow">Prototype A · sorted card gallery</p>
      <h1>Which cities push this hardest?</h1>
      <p class="lede">
        Pick a theme and all fifty tourism boards sort by how much they talk
        about it. Flip the order to see who barely mentions it at all. Click any
        two cards to put those cities head to head.
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
      <label class="field">
        <span class="eyebrow">Sort by</span>
        <select bind:value={measureKey}>
          {#each groups as g}
            <optgroup label={g}>
              {#each AXIS_OPTIONS.filter((a) => a.group === g) as a}
                <option value={a.id}>{a.label}</option>
              {/each}
            </optgroup>
          {/each}
        </select>
      </label>

      <div class="field">
        <span class="eyebrow">Order</span>
        <div class="segmented">
          <button aria-pressed={direction === 'desc'} onclick={() => (direction = 'desc')}>
            Most first
          </button>
          <button aria-pressed={direction === 'asc'} onclick={() => (direction = 'asc')}>
            Least first
          </button>
        </div>
      </div>

      <div class="field">
        <span class="eyebrow">Show</span>
        <div class="segmented">
          <button aria-pressed={categoryFilter === 'all'} onclick={() => (categoryFilter = 'all')}>
            All 50
          </button>
          <button aria-pressed={categoryFilter === 'popular'} onclick={() => (categoryFilter = 'popular')}>
            Big destinations
          </button>
          <button aria-pressed={categoryFilter === 'hidden'} onclick={() => (categoryFilter = 'hidden')}>
            Hidden gems
          </button>
        </div>
      </div>

      {#if picks.length}
        <button class="pushed" onclick={() => (picks = [])}>Clear selection</button>
      {/if}
    </div>

    <div class="stats panel" aria-live="polite">
      <div class="stat">
        <span class="eyebrow">Showing</span>
        <strong>{stats.n}</strong>
        <span class="unit">of {cities.length} cities</span>
      </div>
      <div class="stat">
        <span class="eyebrow">Leads on {measure.label}</span>
        <strong class="small">{stats.leader.city}</strong>
        <span class="unit">{measure.get(stats.leader).toFixed(decimals)} · {measure.unit}</span>
      </div>
      <div class="stat">
        <span class="eyebrow">Median</span>
        <strong>{stats.median.toFixed(decimals)}</strong>
        <span class="unit">{measure.unit}</span>
      </div>
      <div class="stat">
        <span class="eyebrow">Barely mentions it</span>
        <strong class="small">{stats.trailer.city}</strong>
        <span class="unit">{measure.get(stats.trailer).toFixed(decimals)} · {measure.unit}</span>
      </div>
      <div class="legend-slot"><Legend note={false} /></div>
    </div>

    <section>
      <CardGrid
        {cities}
        visibleNames={filteredNames}
        {measure}
        {direction}
        {hoveredCity}
        {picks}
        onhovercity={(c) => (hoveredCity = c)}
        onpickcity={pick}
      />
      <p class="note hint">
        The <strong>#</strong> on each card is its rank across all fifty, so it
        does not change when you filter to one category. Bar length is the
        city's value against the highest in the corpus.
      </p>
    </section>

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
      Theme measures are mentions per 1,000 words, so a long scrape and a short
      one are comparable. Source: official tourism-board homepage text, 50 cities.
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

  .controls { display: flex; gap: 22px; align-items: flex-end; flex-wrap: wrap; }
  .field { display: flex; flex-direction: column; gap: 5px; }
  .segmented { display: flex; gap: 5px; }
  .pushed { margin-left: auto; }

  .stats { display: flex; gap: 26px; align-items: flex-end; flex-wrap: wrap; }
  .stat { display: flex; flex-direction: column; gap: 1px; }
  .stat strong { font-size: 1.5rem; font-weight: 650; line-height: 1.1; font-variant-numeric: tabular-nums; }
  .stat strong.small { font-size: 1.05rem; padding-top: 5px; font-variant-numeric: normal; }
  .stat .unit { font-size: 0.7rem; color: var(--text-muted); }
  .legend-slot { margin-left: auto; }

  .hint { border-top: 1px solid var(--border); padding-top: 9px; margin-top: 12px; }
  .error { color: var(--text-primary); }
  footer { border-top: 1px solid var(--border); padding-top: 12px; max-width: 72ch; }

  @media (max-width: 900px) {
    .top { flex-direction: column; gap: 12px; }
    .legend-slot, .pushed { margin-left: 0; }
  }
</style>
