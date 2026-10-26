<script>
  /**
   * PROTOTYPE B — "Spin the globe, pick two."
   *
   * A large orthographic globe is the entry point and the only way in. Click a
   * city to select it; click a second and every comparison view below fills in
   * at once — the theme-by-theme diverging bars, the shared vocabulary, and the
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
  import { loadCities, loadCountries, greatCircleKm, AXIS_OPTIONS, axisById } from '$lib/data.js';
  import Globe from '$lib/Globe.svelte';
  import CardGrid from '$lib/CardGrid.svelte';
  import ThemeScatter from '$lib/ThemeScatter.svelte';
  import HeadToHead from '$lib/HeadToHead.svelte';
  import Legend from '$lib/Legend.svelte';

  let cities = $state([]);
  let countries = $state(null);
  let error = $state(null);

  // --- shared selection state, one owner each ---------------------------
  let picks = $state([]);            // SELECT, up to two
  let onFace = $state(0);            // cities currently on the near hemisphere
  let hoveredCity = $state(null);    // LINK
  let highlightGroup = $state(null); // LINK (archetype)
  let measureKey = $state('theme:Food'); // SORT, drives the inventory order
  let direction = $state('desc');        // SORT
  let categoryFilter = $state('all');    // FILTER: all | popular | hidden
  let xKey = $state('theme:History');
  let yKey = $state('theme:Food');

  let measure = $derived(axisById(measureKey));
  const measureGroups = [...new Set(AXIS_OPTIONS.map((a) => a.group))];

  // One derived subset. The globe, the inventory and the count all read it.
  let shown = $derived(
    categoryFilter === 'all' ? cities : cities.filter((c) => c.category === categoryFilter)
  );
  let shownNames = $derived(new Set(shown.map((c) => c.city)));

  let byName = $derived(new Map(cities.map((c) => [c.city, c])));
  let cityA = $derived(picks[0] ? byName.get(picks[0]) : null);
  let cityB = $derived(picks[1] ? byName.get(picks[1]) : null);

  // Highlight emphasises; it never removes.
  let highlightNames = $derived(
    highlightGroup
      ? new Set(shown.filter((c) => c.archetype === highlightGroup).map((c) => c.city))
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
      const [loaded, geo] = await Promise.all([loadCities(), loadCountries()]);
      cities = loaded.cities;
      countries = geo;
    } catch (e) {
      error = e.message;
    }
  });
</script>

<svelte:head><title>Prototype B — Spin the globe, pick two</title></svelte:head>

<main class="snap">
  {#if error}
    <section class="hero"><p class="panel error">Could not load the data: {error}</p></section>
  {:else if !cities.length}
    <section class="hero"><p class="note">Loading 50 cities…</p></section>
  {:else}
    <!-- Screen one: the globe, and nothing competing with it. -->
    <section class="hero">
      <header class="hero-top">
        <div>
          <p class="eyebrow">Prototype B · globe-led comparison</p>
          <h1>Pick two cities anywhere on Earth. Do they sound alike?</h1>
        </div>
        <nav>
          <a href="../">Overview</a>
          <a href="../prototype-a/">← Prototype A</a>
        </nav>
      </header>

      <div class="hero-body">
        <div class="globe-slot">
          <Globe
            cities={shown}
            {countries}
            {highlightNames}
            {hoveredCity}
            {picks}
            focusCities={picks}
            showCaption={false}
            onhovercity={(c) => (hoveredCity = c)}
            onpickcity={pick}
            onvisiblecount={(n) => (onFace = n)}
          />
        </div>

        <!-- The inventory: every city on screen at once, scrollable, so the
             cities hidden round the back of the globe are still reachable. -->
        <aside class="inventory">
          <header class="inv-head">
            <h2>All cities</h2>
            <span class="count">{shown.length} of {cities.length}</span>
          </header>

          <div class="inv-list">
            <CardGrid
              {cities}
              visibleNames={shownNames}
              {measure}
              {direction}
              {hoveredCity}
              {picks}
              typeFirst={true}
              onhovercity={(c) => (hoveredCity = c)}
              onpickcity={pick}
            />
          </div>

          <div class="inv-filters">
            <label class="field">
              <span class="eyebrow">Sort by</span>
              <select bind:value={measureKey}>
                {#each measureGroups as g}
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
                <button aria-pressed={direction === 'desc'} onclick={() => (direction = 'desc')}>Most</button>
                <button aria-pressed={direction === 'asc'} onclick={() => (direction = 'asc')}>Least</button>
              </div>
            </div>

            <div class="field">
              <span class="eyebrow">Show <span class="tag">removes</span></span>
              <div class="segmented">
                <button aria-pressed={categoryFilter === 'all'} onclick={() => (categoryFilter = 'all')}>All</button>
                <button aria-pressed={categoryFilter === 'hidden'} onclick={() => (categoryFilter = 'hidden')}>Gems</button>
                <button aria-pressed={categoryFilter === 'popular'} onclick={() => (categoryFilter = 'popular')}>Big</button>
              </div>
            </div>

            <label class="field">
              <span class="eyebrow">Highlight <span class="tag">dims only</span></span>
              <select bind:value={highlightGroup}>
                <option value={null}>No highlight</option>
                {#each archetypes as a}<option value={a}>{a}</option>{/each}
              </select>
            </label>
          </div>
        </aside>
      </div>

      <div class="hero-stack">
      <!-- Selection sits directly under the globe: it is click feedback, so it
           has to stay next to the thing being clicked. Fixed min-height so the
           page does not jump as picks come and go. -->
      <div class="selected-bar" class:empty={picks.length === 0} aria-live="polite">
        {#if picks.length > 0}
          <ul class="picklist">
            {#each picks as name (name)}
              {@const c = byName.get(name)}
              <li class:gem={c.category === 'hidden'}>
                <strong>{c.city}</strong>
                <span>{c.country}</span>
                <button class="drop" aria-label="Remove {c.city}" onclick={() => pick(name)}>×</button>
              </li>
            {/each}
          </ul>
          {#if km !== null}
            <span class="km">{Math.round(km).toLocaleString()} km apart</span>
          {:else}
            <span class="note">Pick one more.</span>
          {/if}
          <button onclick={() => (picks = [])}>Clear</button>
        {/if}
      </div>

      <div class="hero-foot">
        <Legend note={false} />
        <span class="face">{onFace} of {cities.length} cities on this face</span>
        <span class="cue" aria-hidden="true">Scroll for the wider picture ↓</span>
      </div>
      </div>
    </section>

    <!-- Screen two: everything that is about the whole corpus. -->
    <section class="trends">
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
      Theme measures are mentions per 1,000 words. Source: official
      tourism-board homepage text, 50 cities.
    </footer>
    </section>
  {/if}
</main>

<style>
  /* Two screens, and no resting place between them: scrolling down lands on
     the trends, scrolling up returns to the globe. The scroll container is
     this page rather than the document, so the snap never leaks to other
     routes. */
  .snap {
    height: 100dvh;
    overflow-y: auto;
    scroll-snap-type: y mandatory;
    scroll-behavior: smooth;
  }
  .hero, .trends { scroll-snap-align: start; scroll-snap-stop: always; }

  /* The hero is exactly one screen: header / globe / controls stacked, with
     the globe taking whatever is left so it is always as large as it can be. */
  /* Controls float over the globe rather than stacking above and below it.
     Stacked, the header and the control rows took ~340px of an 900px screen
     and the sphere could only reach 560. Overlaid, it reaches ~720. */
  .hero {
    position: relative;
    height: 100dvh;
    overflow: hidden;
  }
  /* Globe and inventory share the hero. The globe keeps the centre of
     attention; the inventory makes the far side of the sphere reachable. */
  /* The globe stays centred on the page; the inventory floats over the right
     instead of taking a grid column, which would push the sphere off centre. */
  .hero-body {
    position: absolute;
    inset: 0;
    padding: 62px 20px 104px;
  }
  .globe-slot {
    position: absolute;
    inset: 62px 20px 104px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .globe-slot :global(figure) { height: 100%; width: 100%; justify-content: center; }
  /* Size the sphere from one dimension and let aspect-ratio supply the other.
     Letting flex resolve both left it square only by accident. */
  .globe-slot :global(.stage) {
    flex: none;
    /* Leave room for the floating inventory on the right (340px + gutters)
       on both sides, so the sphere stays centred and never runs under it. */
    width: min(calc(100% - 720px), calc(100dvh - 240px));
    height: auto;
    aspect-ratio: 1;
  }

  .inventory {
    position: absolute;
    top: 62px;
    right: 20px;
    bottom: 104px;
    width: 340px;
    z-index: 3;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 12px 6px 12px 12px;
    --card-min: 148px;
  }
  .inv-head {
    display: flex; align-items: baseline; justify-content: space-between;
    gap: 10px; padding-right: 6px;
  }
  .inv-head h2 { font-size: 0.95rem; }
  .count { font-size: 0.72rem; color: var(--text-muted); font-variant-numeric: tabular-nums; }

  /* Its own scroller, so running out of cards hands the scroll back to the
     page and the snap still works. */
  .inv-list {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 2px 6px 2px 2px;
  }
  .inv-list::-webkit-scrollbar { width: 8px; }
  .inv-list::-webkit-scrollbar-thumb {
    background: var(--border); border-radius: 4px;
  }

  .inv-filters {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 10px;
    padding: 10px 10px 2px 0;
    border-top: 1px solid var(--border);
  }
  .inv-filters .field { gap: 3px; }
  .inv-filters select { width: 100%; }
  .inv-filters .segmented button { flex: 1; padding: 4px 6px; }
  .tag {
    font-weight: 500; letter-spacing: 0.02em; text-transform: none;
    color: var(--text-muted);
  }

  .hero-top {
    position: absolute;
    top: 0; left: 0; right: 0;
    z-index: 2;
    padding: 16px 20px;
    max-width: 1100px;
    margin: 0 auto;
    display: flex; justify-content: space-between; align-items: flex-start; gap: 24px;
    pointer-events: none;
  }
  .hero-top a, .hero-top nav { pointer-events: auto; }
  .hero-top h1 { margin-top: 4px; font-size: 1.3rem; }
  nav { display: flex; gap: 14px; font-size: 0.78rem; white-space: nowrap; }

  .field { display: flex; flex-direction: column; gap: 4px; }
  .segmented { display: flex; gap: 4px; }

  .hero-foot {
    display: flex; align-items: center; justify-content: center;
    gap: 16px; flex-wrap: wrap;
  }
  .cue { font-size: 0.7rem; color: var(--text-muted); }

  /* The floating foot: selection, pills and legend in one centred stack. */
  .hero-stack {
    position: absolute;
    left: 0; right: 0; bottom: 14px;
    z-index: 2;
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    padding: 0 16px;
  }

  /* Screen two scrolls normally inside its own snap area. */
  .trends {
    max-width: 1100px;
    margin: 0 auto;
    padding: 28px 16px 60px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }


  /* Everything from the selection bar down floats at the foot of the hero. */
  .hero .selected-bar,
  .hero .hero-foot { position: relative; z-index: 2; }

  .selected-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 10px 14px;
    /* Fixed, not min-: the picked state's chips are a hair taller than the
       hint text, and the bar is bottom-anchored, so any height change nudges
       it. Both states are one line, so a fixed height is safe here. */
    height: 42px;
    transition: background-color 120ms, border-color 120ms;
    padding: 6px 14px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: var(--wash);
  }
  /* Nothing picked: the bar keeps its height so the controls below never
     shift, but shows no chrome — spinning and clicking need no instructions. */
  .selected-bar.empty { background: none; border-color: transparent; }

  .picklist { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 10px; }
  .picklist li {
    display: flex; align-items: baseline; gap: 6px;
    border-left: 3px solid var(--big);
    padding: 1px 0 1px 8px;
    font-size: 0.85rem;
  }
  .picklist li.gem { border-left-color: var(--gem); }
  .picklist span { color: var(--text-muted); font-size: 0.7rem; }
  .drop {
    border: none; background: none; padding: 0 2px;
    color: var(--text-muted); font-size: 1rem; line-height: 1;
  }
  .drop:hover { color: var(--text-primary); background: none; }
  .km { font-size: 0.78rem; font-variant-numeric: tabular-nums; color: var(--text-secondary); }
  .face { font-size: 0.7rem; color: var(--text-muted); }

  /* Legend is shared with Prototype A, so centre it only inside this panel. */
  .hero :global(.legend) {
    justify-content: center;
    text-align: center;
    max-width: 620px;
  }
  .pill { font-size: 0.68rem; padding: 3px 8px; border-radius: 999px; }
  .clear-pill { color: var(--text-muted); }

  .hint { border-top: 1px solid var(--border); padding-top: 9px; margin-top: 10px; }
  .error { color: var(--text-primary); }
  footer { border-top: 1px solid var(--border); padding-top: 12px; max-width: 72ch; }

  @media (max-width: 880px) {
    /* Narrow screens wrap the bar, so let it grow again. */
    .selected-bar { height: auto; min-height: 42px; }
    .hero-top { flex-direction: column; gap: 8px; }
    .hero-top h1 { font-size: 1.1rem; }
  }

  /* Snapping fights short viewports and anyone who prefers less motion. */
  @media (max-height: 620px), (prefers-reduced-motion: reduce) {
    .snap { scroll-snap-type: none; scroll-behavior: auto; }
  }
</style>
