<script>
  /**
   * PROTOTYPE B — "Spin the globe, pick two."
   *
   * A large orthographic globe is the entry point and the only way in. Click a
   * city to select it; click a second and every comparison view below fills in
   * at once — the twin table, the theme-by-theme diverging bars, and the
   * scatter with both cities called out.
   *
   *   globe click --SELECT-->  head-to-head + scatter callouts + arc
   *   archetype pills --LINK->  globe + scatter (highlight, nothing removed)
   *   hover --LINK----------->  every view
   *
   * The contrast with Prototype A is the entry point: A starts from a measure
   * and ranks all fifty; B starts from a place and drills into a pair.
   */
  import { onMount } from 'svelte';
  import { loadCities, loadLand, greatCircleKm } from '$lib/data.js';
  import Globe from '$lib/Globe.svelte';
  import ThemeScatter from '$lib/ThemeScatter.svelte';
  import HeadToHead from '$lib/HeadToHead.svelte';
  import Legend from '$lib/Legend.svelte';

  let cities = $state([]);
  let land = $state(null);
  let error = $state(null);

  // --- shared selection state, one owner each ---------------------------
  let picks = $state([]);            // SELECT, up to two
  let hoveredCity = $state(null);    // LINK
  let highlightGroup = $state(null); // LINK (archetype)
  let xKey = $state('theme:History');
  let yKey = $state('theme:Food');

  let byName = $derived(new Map(cities.map((c) => [c.city, c])));
  let cityA = $derived(picks[0] ? byName.get(picks[0]) : null);
  let cityB = $derived(picks[1] ? byName.get(picks[1]) : null);

  // Highlight emphasises; it never removes.
  let highlightNames = $derived(
    highlightGroup
      ? new Set(cities.filter((c) => c.archetype === highlightGroup).map((c) => c.city))
      : null
  );

  let archetypes = $derived(
    [...new Set(cities.map((c) => c.archetype))].sort((a, b) => a.localeCompare(b))
  );

  let km = $derived(cityA && cityB ? greatCircleKm(cityA, cityB) : null);

  function pick(name) {
    if (picks.includes(name)) picks = picks.filter((p) => p !== name);
    else if (picks.length < 2) picks = [...picks, name];
    else picks = [picks[1], name]; // oldest falls off
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

<svelte:head><title>Prototype B — Spin the globe, pick two</title></svelte:head>

<main>
  <header class="top">
    <div>
      <p class="eyebrow">Prototype B · globe-led comparison</p>
      <h1>Pick two cities anywhere on Earth. Do they sound alike?</h1>
      <p class="lede">
        Spin the globe and click two cities. Everything below fills in for that
        pair: whether any measure calls them twins, what each one talks about,
        and where both sit against the other forty-eight.
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
    <section class="panel globe-panel">
      <Globe
        {cities}
        {land}
        {highlightNames}
        {hoveredCity}
        {picks}
        onhovercity={(c) => (hoveredCity = c)}
        onpickcity={pick}
      />

      <aside class="side">
        <div class="selected">
          <span class="eyebrow">Selected</span>
          {#if picks.length === 0}
            <p class="note">Nothing yet — click a city on the globe.</p>
          {:else}
            <ol class="picklist">
              {#each picks as name (name)}
                {@const c = byName.get(name)}
                <li class:gem={c.category === 'hidden'}>
                  <strong>{c.city}</strong>
                  <span>{c.country}</span>
                  <button class="drop" aria-label="Remove {c.city}" onclick={() => pick(name)}>×</button>
                </li>
              {/each}
            </ol>
            {#if km !== null}
              <p class="note km">{Math.round(km).toLocaleString()} km apart</p>
            {:else}
              <p class="note">Pick one more to compare.</p>
            {/if}
            <button onclick={() => (picks = [])}>Clear</button>
          {/if}
        </div>

        <div class="highlight">
          <span class="eyebrow">Highlight an archetype</span>
          <div class="pills">
            {#each archetypes as a}
              <button
                class="pill"
                aria-pressed={highlightGroup === a}
                onclick={() => (highlightGroup = highlightGroup === a ? null : a)}
              >{a}</button>
            {/each}
          </div>
          <p class="note">
            Highlighting dims the rest — it never removes them, and they stay
            clickable.
          </p>
        </div>

        <Legend />
      </aside>
    </section>

    <section class="panel">
      <HeadToHead
        a={cityA}
        b={cityB}
        {cities}
        onclear={() => (picks = [])}
        onhovercity={(c) => (hoveredCity = c)}
      />
    </section>

    <section class="panel">
      <ThemeScatter
        {cities}
        allCities={cities}
        {xKey}
        {yKey}
        {hoveredCity}
        {picks}
        {highlightNames}
        onhovercity={(c) => (hoveredCity = c)}
        onpickcity={pick}
        onchangeaxis={(which, id) => (which === 'x' ? (xKey = id) : (yKey = id))}
      />
      <p class="note hint">
        The two selected cities are ringed and labelled here, so you can see
        whether the pair you chose is unusual or sits in the middle of the pack.
      </p>
    </section>

    <footer class="note">
      Theme measures are mentions per 1,000 words. "Twin" has four competing
      definitions and they rarely agree — that disagreement is the finding, not
      a bug. Source: official tourism-board homepage text, 50 cities.
    </footer>
  {/if}
</main>

<style>
  main {
    max-width: 1100px;
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

  .globe-panel {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 250px;
    gap: 24px;
    align-items: start;
  }
  .side { display: flex; flex-direction: column; gap: 20px; padding-top: 6px; }

  .selected { display: flex; flex-direction: column; gap: 7px; align-items: flex-start; }
  .picklist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; width: 100%; }
  .picklist li {
    display: flex; align-items: baseline; gap: 6px;
    border-left: 3px solid var(--big);
    padding: 3px 0 3px 8px;
    font-size: 0.82rem;
  }
  .picklist li.gem { border-left-color: var(--gem); }
  .picklist span { color: var(--text-muted); font-size: 0.7rem; }
  .drop {
    margin-left: auto; border: none; background: none; padding: 0 4px;
    color: var(--text-muted); font-size: 0.95rem; line-height: 1;
  }
  .drop:hover { color: var(--text-primary); background: none; }
  .km { font-variant-numeric: tabular-nums; }

  .highlight { display: flex; flex-direction: column; gap: 7px; }
  .pills { display: flex; flex-wrap: wrap; gap: 4px; }
  .pill { font-size: 0.68rem; padding: 3px 8px; border-radius: 999px; }

  .hint { border-top: 1px solid var(--border); padding-top: 9px; margin-top: 10px; }
  .error { color: var(--text-primary); }
  footer { border-top: 1px solid var(--border); padding-top: 12px; max-width: 72ch; }

  @media (max-width: 880px) {
    .globe-panel { grid-template-columns: 1fr; }
    .top { flex-direction: column; gap: 12px; }
  }
</style>
