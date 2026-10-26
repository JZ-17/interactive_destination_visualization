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
  import CityCard from '$lib/CityCard.svelte';
  import ThemeScatter from '$lib/ThemeScatter.svelte';
  import HeadToHead from '$lib/HeadToHead.svelte';
  import Legend from '$lib/Legend.svelte';

  let cities = $state([]);
  let countries = $state(null);
  let error = $state(null);

  // --- shared selection state, one owner each ---------------------------
  /**
   * Two comparison slots. These are the source of truth for the selection:
   * a city is either in the inventory or in a slot, never both, so picking
   * one physically moves its card across.
   */
  let slots = $state([null, null]);
  let picks = $derived(slots.filter(Boolean));
  let dragOver = $state(null);       // slot index currently under a drag
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
  // A city held in a slot is out of the inventory — the card moved.
  let shownNames = $derived(
    new Set(shown.map((c) => c.city).filter((n) => !slots.includes(n)))
  );

  let byName = $derived(new Map(cities.map((c) => [c.city, c])));
  let cityA = $derived(slots[0] ? byName.get(slots[0]) : null);
  let cityB = $derived(slots[1] ? byName.get(slots[1]) : null);

  // Highlight emphasises; it never removes.
  let highlightNames = $derived(
    highlightGroup
      ? new Set(shown.filter((c) => c.archetype === highlightGroup).map((c) => c.city))
      : null
  );

  // The slots render the real card, so they need the same scale and rank the
  // deck uses — ranks over all 50, so a card keeps its standing in the slot.
  let maxMeasure = $derived(Math.max(1e-9, ...cities.map((c) => measure.get(c))));
  let rankOf = $derived.by(() => {
    const sorted = [...cities].sort((x, y) => measure.get(y) - measure.get(x));
    return new Map(sorted.map((c, i) => [c.city, i + 1]));
  });

  let archetypes = $derived(
    [...new Set(cities.map((c) => c.archetype))].sort((a, b) => a.localeCompare(b))
  );

  let km = $derived(cityA && cityB ? greatCircleKm(cityA, cityB) : null);

  /** Put a city in a specific slot, clearing it from the other one first. */
  function place(name, i) {
    const next = [...slots];
    const held = next.indexOf(name);
    if (held !== -1) next[held] = null;
    next[i] = name;
    slots = next;
  }

  /** Clicking: fill the first free slot, or push the older pick out. */
  function pick(name) {
    if (slots.includes(name)) {
      slots = slots.map((v) => (v === name ? null : v));
      return;
    }
    const free = slots.indexOf(null);
    if (free !== -1) place(name, free);
    else slots = [slots[1], name];
  }

  function clearSlot(i) {
    const next = [...slots];
    next[i] = null;
    slots = next;
  }

  function onDrop(e, i) {
    e.preventDefault();
    dragOver = null;
    const name = e.dataTransfer.getData('text/plain');
    if (byName.has(name)) place(name, i);
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

<main class="snap space">
  {#if error}
    <section class="hero"><p class="panel error">Could not load the data: {error}</p></section>
  {:else if !cities.length}
    <section class="hero"><p class="note">Loading 50 cities…</p></section>
  {:else}
    <!-- Screen one: the globe, and nothing competing with it. -->
    <section class="hero">
      <header class="hero-top">
        <p class="eyebrow">Prototype B · globe-led comparison</p>
        <h1>Pick two cities anywhere on Earth. Do they sound alike?</h1>
      </header>

      <div class="hero-body">
        <div class="globe-slot" class:with-result={cityA && cityB}>
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
        <div class="left-rail">
        <aside class="inventory">
          <header class="inv-head">
            <h2>All cities</h2>
            <span class="count">{shownNames.size} of {cities.length}</span>
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
              portrait={true}
              draggable={true}
              cityColor={true}
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

        <!-- The comparator: its own box in the bottom-right corner, so the
             deck on the left and the result on the right never crowd the
             globe between them. -->
        <aside class="comparator">
        <!-- Two slots you can drag a card into. A city is either in the
             inventory or in a slot, so selecting one visibly moves it. -->
        <div class="slots">
          {#each [0, 1] as i}
            {@const held = slots[i] ? byName.get(slots[i]) : null}
            <div
              class="slot"
              class:filled={!!held}
              class:over={dragOver === i}
              role="button"
              tabindex="0"
              aria-label={held ? `Slot ${i + 1}: ${held.city}. Press to remove.` : `Empty slot ${i + 1}. Drop a city here.`}
              ondragover={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; dragOver = i; }}
              ondragleave={() => (dragOver === i ? (dragOver = null) : null)}
              ondrop={(e) => onDrop(e, i)}
              onclick={() => held && clearSlot(i)}
              onkeydown={(e) => {
                if (held && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); clearSlot(i); }
              }}
            >
              {#if held}
                <CityCard
                  city={held}
                  {measure}
                  max={maxMeasure}
                  rank={rankOf.get(held.city)}
                  total={cities.length}
                  portrait={true}
                  cityColor={true}
                  picked={true}
                  hovered={hoveredCity === held.city}
                  onhover={(c) => (hoveredCity = c)}
                  onpick={() => clearSlot(i)}
                />
              {:else}
                <span class="slot-empty">Drop a city here</span>
              {/if}
            </div>
          {/each}
        </div>

        </aside>
        </div>

        <!-- The result appears on the right once both spots are filled. The
             globe reserves this width whether or not it is showing, so it
             never jumps when a pair completes. -->
        {#if cityA && cityB}
          <aside class="result">
            <HeadToHead
              a={cityA}
              b={cityB}
              {cities}
              compact={true}
              showEmptyState={false}
              cityColor={true}
              onclear={() => (slots = [null, null])}
              onhovercity={(c) => (hoveredCity = c)}
            />
          </aside>
        {/if}
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
          <button onclick={() => (slots = [null, null])}>Clear</button>
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
  /* --- Space skin, scoped to this prototype -------------------------------
     Reference: Linear's dark, luminous precision crossed with NASA's "Eyes on
     the Solar System", whose orbital arcs this view already echoes. The page
     goes to deep space so the globe reads as a lit planet rather than a
     diagram — the one thing that stays bright.

     Prototype A keeps its Apple light skin. Only chrome changes: the two data
     colours are the validated dark steps (#3b87f0 / #bf8228, all six checks
     pass on this surface), and the per-city hues are the same hues re-lit for
     a dark background rather than a second palette. */
  :global(body:has(main.space)) {
    background:
      radial-gradient(900px 520px at 72% -8%, rgba(74, 110, 220, 0.3), transparent 62%),
      radial-gradient(700px 480px at 12% 8%, rgba(150, 86, 220, 0.18), transparent 60%),
      #05070d;
  }

  main.space {
    --surface-1: rgba(18, 21, 33, 0.72);
    --page: #05070d;
    --text-primary: #e9edf7;
    --text-secondary: #a6b0c9;
    --text-muted: #6f7a93;
    --border: rgba(132, 164, 255, 0.16);
    --wash: rgba(140, 170, 255, 0.07);
    --gridline: rgba(132, 164, 255, 0.12);
    --axis: rgba(132, 164, 255, 0.28);
    --big: #3b87f0;
    --gem: #bf8228;
    --accent: #6ea8ff;

    /* The same city hues, re-lit for a dark surface. */
    --city-s: 72%;
    --city-l: 62%;
    --city-ws: 38%;
    --city-wl: 15%;
    /* Nearly opaque: at 50% the border composited over each card's dark wash
       and read as the city's hue rather than its category. */
    --cat-border: rgba(90, 160, 250, 0.92);
    --cat-border-gem: rgba(214, 152, 60, 0.92);
    --track-bg: rgba(255, 255, 255, 0.1);

    --glow: 0 0 0 1px rgba(132, 164, 255, 0.1), 0 24px 70px rgba(0, 0, 0, 0.62);
    color: var(--text-primary);
  }

  /* Panels are glass with a lit top edge, the way Linear draws a surface. */
  main.space :global(.panel),
  main.space .inventory,
  main.space .comparator,
  main.space .result {
    background: var(--surface-1);
    backdrop-filter: blur(18px) saturate(140%);
    -webkit-backdrop-filter: blur(18px) saturate(140%);
    border: 1px solid var(--border);
    border-radius: 16px;
    box-shadow: var(--glow), inset 0 1px 0 rgba(255, 255, 255, 0.06);
  }

  main.space :global(button),
  main.space :global(select) {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-primary);
    transition: background-color 140ms, box-shadow 140ms, border-color 140ms;
  }
  main.space :global(button:hover),
  main.space :global(select:hover) {
    background: rgba(255, 255, 255, 0.09);
    border-color: rgba(132, 164, 255, 0.34);
  }
  main.space :global(button[aria-pressed='true']) {
    background: linear-gradient(180deg, #4b92f5 0%, #2f6fd8 100%);
    border-color: transparent;
    color: #fff;
    box-shadow: 0 0 0 1px rgba(110, 168, 255, 0.5), 0 6px 22px rgba(47, 111, 216, 0.45);
  }
  main.space :global(select option) { background: #12151f; color: #e9edf7; }

  /* Empty drop spots read as sockets waiting for a card. */
  main.space .slot:not(.filled) {
    border-color: rgba(132, 164, 255, 0.3);
    background: rgba(132, 164, 255, 0.04);
  }
  main.space .slot.over {
    border-color: var(--accent);
    background: rgba(110, 168, 255, 0.12);
    box-shadow: 0 0 0 3px rgba(110, 168, 255, 0.18);
  }

  main.space .hero-top h1,
  main.space :global(h2),
  main.space :global(h3) { letter-spacing: -0.02em; }

  @media (prefers-reduced-motion: reduce) {
    main.space :global(button) { transition: none; }
  }

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
  /* The globe owns whatever is left between the rail and the result panel,
     and centres in it. With no pair chosen there is no right panel, so it
     spreads out — capped at two thirds of the viewport. */
  .globe-slot {
    position: absolute;
    top: 62px;
    bottom: 104px;
    left: 420px;
    right: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: right 180ms ease-out;
  }
  .globe-slot.with-result { right: 420px; }
  .globe-slot :global(figure) { height: 100%; width: 100%; justify-content: center; }
  /* Size the sphere from one dimension and let aspect-ratio supply the other.
     Letting flex resolve both left it square only by accident. */
  /* Driven by the slot's real height rather than a guess at the page chrome,
     so the sphere uses every pixel the layout actually leaves it. Width then
     follows from aspect-ratio, capped at two thirds of the viewport. */
  .globe-slot :global(.stage) {
    flex: none;
    height: 100%;
    width: auto;
    aspect-ratio: 1;
    max-width: min(100%, 66vw);
  }

  /* Both panels stack in one left rail: deck on top, drop slots and the
     comparison beneath it in the bottom-left corner. */
  .left-rail {
    position: absolute;
    top: 62px;
    left: 20px;
    bottom: 104px;
    width: 380px;
    z-index: 3;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .inventory {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 12px 6px 12px 12px;
    /* Three small playing cards to a row. */
    --card-min: 100px;
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

  /* The tray cards get dropped into, at the foot of the rail. Sized to its
     two spots now that the result has moved to the right. */
  .comparator {
    flex: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 12px 6px 12px 12px;
  }

  /* Two portrait spots side by side — the same proportions as a deck card, so
     a dragged card lands in a slot shaped like itself. */
  .slots {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    padding: 0 8px 0 0;
    flex: none;
  }
  .slot {
    display: flex; flex-direction: column; justify-content: center;
    align-items: flex-start; gap: 3px;
    aspect-ratio: 5 / 7;
    padding: 10px 11px;
    border: 1px dashed var(--axis);
    border-radius: var(--radius);
    font-size: 0.82rem;
    cursor: default;
    transition: border-color 120ms, background-color 120ms;
  }
  /* A filled slot is simply the card itself — the dashed frame belongs to the
     empty state. */
  .slot.filled {
    border: none;
    padding: 0;
    background: none;
    display: block;
  }
  .slot.filled > :global(.card) { height: 100%; }
  .slot.over {
    border-color: var(--text-primary);
    background: var(--wash);
    border-style: solid;
  }
  .slot-rank {
    height: 4px; width: 34px; border-radius: 2px;
    background: var(--big); flex: none; margin-bottom: 4px;
  }
  .slot-rank.gem { background: var(--gem); }
  .slot-name { font-weight: 650; }
  .slot-sub { color: var(--text-muted); font-size: 0.68rem; max-width: 100%;
              overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .slot-name { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .slot { position: relative; }
  .slot:hover .slot-x { color: var(--text-primary); }
  .slot-empty { color: var(--text-muted); font-size: 0.75rem; }

  /* Its own scroller too, so a long comparison never pushes the deck off. */
  .result {
    position: absolute;
    top: 62px;
    right: 20px;
    bottom: 104px;
    width: 380px;
    z-index: 3;
    overflow-y: auto;
    overscroll-behavior: contain;
    background: var(--surface-1);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 12px 6px 12px 12px;
  }
  .result::-webkit-scrollbar { width: 8px; }
  .result::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
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
    flex: none;
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
    pointer-events: none;
  }
  .hero-top h1 { margin-top: 4px; font-size: 1.3rem; }

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
    .hero-top h1 { font-size: 1.1rem; }
  }

  /* Snapping fights short viewports and anyone who prefers less motion. */
  @media (max-height: 620px), (prefers-reduced-motion: reduce) {
    .snap { scroll-snap-type: none; scroll-behavior: auto; }
  }
</style>
