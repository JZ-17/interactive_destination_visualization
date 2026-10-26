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
  import WordGraph from '$lib/WordGraph.svelte';
  import ThemeOrbit from '$lib/ThemeOrbit.svelte';
  import ThemeScatter from '$lib/ThemeScatter.svelte';
  import Legend from '$lib/Legend.svelte';

  let cities = $state([]);
  let error = $state(null);

  // --- shared selection state, one owner each ---------------------------
  let measureKey = $state('theme:Food'); // SORT
  let direction = $state('desc');        // SORT
  let categoryFilter = $state('all');    // FILTER: all | popular | hidden
  let hoveredCity = $state(null);        // LINK
  let xKey = $state('theme:History');    // scatter axes
  let yKey = $state('theme:Food');
  let wordPool = $state('adjectives');   // which vocabulary the graph shows
  let selectedWord = $state(null);       // LINK into the shared-word graph
  /**
   * Two comparison slots, same as Prototype B. Unlike B the card is not
   * removed from the gallery when it is dropped — this is a ranking, and a
   * city vanishing out of its rank would break the thing the view is for. It
   * is marked as picked instead.
   */
  let slots = $state([null, null]);
  let picks = $derived(slots.filter(Boolean));
  let dragOver = $state(null);

  let measure = $derived(axisById(measureKey));

  // --- one derived subset; every filtered view reads this ---------------
  let filtered = $derived(
    categoryFilter === 'all' ? cities : cities.filter((c) => c.category === categoryFilter)
  );
  let filteredNames = $derived(new Set(filtered.map((c) => c.city)));

  let byName = $derived(new Map(cities.map((c) => [c.city, c])));
  let cityA = $derived(slots[0] ? byName.get(slots[0]) : null);
  let cityB = $derived(slots[1] ? byName.get(slots[1]) : null);

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

  function place(name, i) {
    const next = [...slots];
    const held = next.indexOf(name);
    if (held !== -1) next[held] = null;
    next[i] = name;
    slots = next;
  }

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
      ({ cities } = await loadCities());
    } catch (e) {
      error = e.message;
    }
  });
</script>

<svelte:head><title>Prototype A — Rank the 50</title></svelte:head>

<main class="apple">
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
        <button class="pushed" onclick={() => (slots = [null, null])}>Clear selection</button>
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

    <!-- Drag a card up here, or click two. Sits on the first screen so the
         comparison is something you build while scanning, not after it. -->
    <div class="dropbar panel">
      <div class="dropcopy">
        <span class="eyebrow">Compare two</span>
        <p class="note">Drag a card into a slot, or just click two of them.</p>
      </div>
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
            <span class="slot-bar" class:gem={held.category === 'hidden'}></span>
            <span class="slot-name">{held.city}</span>
            <span class="slot-sub">{held.country}</span>
            <span class="slot-x" aria-hidden="true">×</span>
          {:else}
            <span class="slot-empty">Drop a city here</span>
          {/if}
        </div>
      {/each}
    </div>

    <section>
      <CardGrid
        {cities}
        visibleNames={filteredNames}
        {measure}
        {direction}
        {hoveredCity}
        {picks}
        cityColor={true}
        draggable={true}
        columns={10}
        onhovercity={(c) => (hoveredCity = c)}
        onpickcity={pick}
      />
      <p class="note hint">
        The <strong>#</strong> on each card is its rank across all fifty, so it
        does not change when you filter to one category. Bar length is the
        city's value against the highest in the corpus.
      </p>
    </section>

    <!-- Trends across the whole corpus, rather than one city at a time. -->
    <section class="trendwrap">
      <header class="trendhead">
        <p class="eyebrow">Across all fifty</p>
        <h2>What the corpus has in common</h2>
        <p class="note">
          Three views of the whole set rather than one city at a time: the
          words nearly all of them reach for, how hard each pushes the theme it
          is known for, and where any two measures put them.
        </p>
      </header>

      <div class="panel trends">
        <WordGraph
          {cities}
          poolId={wordPool}
          {selectedWord}
          {hoveredCity}
          {picks}
          onselectword={({ pool, word }) => { wordPool = pool; selectedWord = word; }}
          onhovercity={(c) => (hoveredCity = c)}
          onpickcity={pick}
        />
      </div>

      <div class="panel trends">
        <ThemeOrbit
          {cities}
          {hoveredCity}
          {picks}
          onhovercity={(c) => (hoveredCity = c)}
          onpickcity={pick}
        />
      </div>

      <div class="panel trends wide">
        <ThemeScatter
          cities={filtered}
          allCities={cities}
          {xKey}
          {yKey}
          {hoveredCity}
          {picks}
          cityColor={true}
          onhovercity={(c) => (hoveredCity = c)}
          onpickcity={pick}
          onchangeaxis={(which, id) => (which === 'x' ? (xKey = id) : (yKey = id))}
        />
      </div>
    </section>

    <section class="panel compare">
      <HeadToHead
        a={cityA}
        b={cityB}
        {cities}
        cityColor={true}
        draggable={true}
        columns={10}
        onclear={() => (slots = [null, null])}
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
  /* --- Apple-flavoured surface treatment, scoped to this prototype ---------
     Prototype B keeps the Expedia tan; A is deliberately a different skin so
     the two can be judged side by side. Only chrome changes here — the data
     colours are untouched, and both were re-validated against this lighter
     surface (both clear 3:1). */
  :global(body:has(main.apple)) {
    background:
      radial-gradient(1200px 600px at 50% -10%, #ffffff 0%, rgba(255,255,255,0) 60%),
      #f5f5f7;
  }

  main.apple {
    --ring: rgba(22, 104, 227, 0.35);
    --lift-1: 0 1px 2px rgba(0, 0, 0, 0.04);
    --lift-2: 0 4px 16px rgba(0, 0, 0, 0.06);
    --lift-3: 0 18px 48px rgba(0, 0, 0, 0.1);
  }

  /* Panels: soft, layered, generously rounded. */
  main.apple :global(.panel) {
    background: rgba(255, 255, 255, 0.78);
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 18px;
    box-shadow: var(--lift-1), var(--lift-2);
    padding: 18px 20px;
  }

  /* Cards: lift and glow on hover, the glow tinted by the city's category. */
  main.apple :global(.card) {
    border-radius: 16px;
    box-shadow: var(--lift-1);
  }
  main.apple :global(.card:hover),
  main.apple :global(.card.hovered) {
    box-shadow:
      0 0 0 3px rgba(22, 104, 227, 0.14),
      var(--lift-3);
    border-color: rgba(22, 104, 227, 0.75);
  }
  main.apple :global(.card.gem:hover),
  main.apple :global(.card.gem.hovered) {
    box-shadow:
      0 0 0 3px rgba(199, 122, 0, 0.16),
      var(--lift-3);
    border-color: rgba(199, 122, 0, 0.8);
  }
  main.apple :global(.card.picked) {
    box-shadow:
      0 0 0 3px rgba(22, 104, 227, 0.28),
      var(--lift-2);
  }
  main.apple :global(.card.gem.picked) {
    box-shadow:
      0 0 0 3px rgba(199, 122, 0, 0.3),
      var(--lift-2);
  }

  /* Controls: pill-shaped, with a hairline and a soft press state. */
  main.apple :global(button),
  main.apple :global(select) {
    border-radius: 980px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: rgba(255, 255, 255, 0.9);
    box-shadow: var(--lift-1);
    padding: 6px 14px;
    transition: box-shadow 140ms, transform 140ms, background-color 140ms;
  }
  main.apple :global(select) { padding-right: 26px; }
  main.apple :global(button:hover) {
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.04), var(--lift-2);
  }
  main.apple :global(button:active) { transform: scale(0.97); }
  main.apple :global(button[aria-pressed='true']) {
    background: linear-gradient(180deg, #2d7df0 0%, #1668e3 100%);
    border-color: transparent;
    color: #fff;
    box-shadow: 0 0 0 3px var(--ring), var(--lift-2);
  }

  main {
    max-width: 1460px;
    margin: 0 auto;
    padding: 28px 16px 60px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; }
  main.apple { padding-top: 48px; }
  .top h1 {
    margin-top: 8px;
    font-size: 2.3rem;
    font-weight: 700;
    letter-spacing: -0.028em;
    line-height: 1.08;
  }
  .lede {
    margin-top: 12px; max-width: 58ch;
    color: var(--text-secondary);
    font-size: 1.02rem; line-height: 1.55;
    letter-spacing: -0.01em;
  }
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

  .dropbar {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
    gap: 14px;
    align-items: center;
  }
  .dropcopy .note { margin-top: 2px; }
  .slot {
    display: flex; align-items: center; gap: 8px;
    min-height: 46px; padding: 8px 12px;
    border: 1px dashed var(--axis); border-radius: 12px;
    font-size: 0.84rem;
    transition: border-color 140ms, background-color 140ms, box-shadow 140ms;
  }
  .slot.filled {
    border-style: solid; border-color: var(--border);
    background: var(--surface-1); cursor: pointer;
  }
  .slot.over {
    border-style: solid; border-color: var(--big);
    background: var(--big-soft);
    box-shadow: 0 0 0 3px rgba(22, 104, 227, 0.14);
  }
  .slot-bar { width: 4px; align-self: stretch; border-radius: 2px; background: var(--big); }
  .slot-bar.gem { background: var(--gem); }
  .slot-name { font-weight: 650; }
  .slot-sub { color: var(--text-muted); font-size: 0.7rem; }
  .slot-x { margin-left: auto; color: var(--text-muted); }
  .slot:hover .slot-x { color: var(--text-primary); }
  .slot-empty { color: var(--text-muted); font-size: 0.78rem; }

  .hint { border-top: 1px solid var(--border); padding-top: 9px; margin-top: 12px; }
  /* The corpus-wide views get their own framed band so they read as a group
     rather than as two more panels in the stack. */
  .trendwrap {
    display: grid;
    /* min(560px, 100%) — a bare 560px minimum cannot shrink, and forced the
       page to 576px of horizontal scroll on a 390px phone. */
    grid-template-columns: repeat(auto-fit, minmax(min(560px, 100%), 1fr));
    gap: 14px;
    align-items: start;
  }
  .trendhead { grid-column: 1 / -1; padding: 6px 2px 0; }
  .trendhead h2 { font-size: 1.35rem; margin-top: 3px; letter-spacing: -0.02em; }
  .trendhead .note { margin-top: 6px; max-width: 70ch; }
  .trends { padding: 20px 22px 18px; }
  .trends.wide { grid-column: 1 / -1; }
  .error { color: var(--text-primary); }
  footer { border-top: 1px solid var(--border); padding-top: 12px; max-width: 72ch; }

  @media (max-width: 900px) {
    .top { flex-direction: column; gap: 12px; }
    .legend-slot, .pushed { margin-left: 0; }
  }
</style>
