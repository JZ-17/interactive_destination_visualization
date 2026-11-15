<script>
  /**
   * Two ranked lists: this city's most-written words, and all fifty's, on the
   * same white cards and in the same row style as every other ranking on the
   * page. The city's bars wear its ticket colour; all fifty's are neutral, and
   * faded where the city never uses the word. Pointing at a word tints its row.
   *
   * Each board holds every word and scrolls on its own, twelve rows tall.
   * Pointing at a word lights it on both boards; if it is scrolled out of view
   * on the other one, it gets a row of its own at that board's foot with its
   * true rank, and clicking that row scrolls the board to it.
   */
  let { city, ranked = [], corpus = [] } = $props();

  let lit = $state(null);
  /** Each board's scrolling list, to tell whether a row is in view. */
  let lists = $state({});
  /** Bumped on every scroll, so the pinned rows re-check what is in view. */
  let scrolled = $state(0);

  let own = $derived(new Set(ranked.map((w) => w.word)));
  let cityMax = $derived(Math.max(1, ...ranked.map((w) => w.own)));
  let corpusMax = $derived(corpus.length ? corpus[0].mentions : 1);
  let wcol = $derived(`${Math.max(9, ...corpus.map((w) => w.word.length)) + 1}ch`);

  let boards = $derived([
    { id: 'city', title: city.city, unit: `times ${city.city} writes it`, rows: ranked, value: (w) => w.own, max: cityMax },
    { id: 'all', title: 'All fifty', unit: 'times all fifty write it', rows: corpus, value: (w) => w.mentions, max: corpusMax }
  ]);

  /** The lit word's row on this board, if it is scrolled out of view. */
  function pinned(board) {
    scrolled;
    const ol = lists[board.id];
    if (!lit || !ol) return null;
    const i = board.rows.findIndex((w) => w.word === lit);
    const li = ol.children[i];
    if (!li) return null;
    const box = ol.getBoundingClientRect();
    const row = li.getBoundingClientRect();
    const inView = row.top >= box.top - 1 && row.bottom <= box.bottom + 1;
    return inView ? null : { w: board.rows[i], n: i + 1 };
  }

  function reveal(board, n) {
    const ol = lists[board.id];
    const li = ol?.children[n - 1];
    if (li) ol.scrollTo({ top: li.offsetTop - (ol.clientHeight - li.offsetHeight) / 2, behavior: 'smooth' });
  }

</script>

<div class="wrap">
  <header class="scene-head">
    <h2>The words {city.city} writes most</h2>
    <p class="lede">
      Beside the words all fifty write most. These are raw counts, so longer sites add
      more: {city.city}’s runs {city.wordCount.toLocaleString('en-US')} words. Faded words
      on the right are ones {city.city} doesn’t use.
    </p>
  </header>

  <div class="boards" onmouseleave={() => (lit = null)} role="presentation">
    {#each boards as b (b.id)}
      {@const pin = pinned(b)}
      <article class="board" class:mine={b.id === 'city'}>
        <header>
          <h3>{b.title}</h3>
          <p>{b.unit}</p>
        </header>
        <ol bind:this={lists[b.id]} onscroll={() => scrolled++} aria-label="{b.title}, all {b.rows.length} words">
          {#each b.rows as w, i (w.word)}
            <li>
              <button
                class="row"
                class:lit={lit === w.word}
                class:theirs={b.id === 'all' && !own.has(w.word)}
                onmouseenter={() => (lit = w.word)}
                onfocus={() => (lit = w.word)}
                onclick={() => (lit = w.word)}
                style="--wcol:{wcol}"
              >
                <span class="n">{i + 1}</span>
                <span class="w">{w.word}</span>
                <span class="bar"><span style="width:{(b.value(w) / b.max) * 100}%"></span></span>
                <span class="c">{b.value(w)}</span>
              </button>
            </li>
          {/each}
        </ol>
        <div class="pin" class:on={!!pin} aria-live="polite">
          {#if pin}
            <button class="row lit" style="--wcol:{wcol}" onclick={() => reveal(b, pin.n)} title="Scroll to #{pin.n}">
              <span class="n">{pin.n}</span>
              <span class="w">{pin.w.word}</span>
              <span class="bar"><span style="width:{(b.value(pin.w) / b.max) * 100}%"></span></span>
              <span class="c">{b.value(pin.w)}</span>
            </button>
          {:else if lit && !b.rows.some((w) => w.word === lit)}
            <span class="pin-hint">{city.city} never writes “{lit}”</span>
          {:else}
            <span class="pin-hint">Point at a word to find it on both boards. Scroll for all {b.rows.length}.</span>
          {/if}
        </div>
      </article>
    {/each}
  </div>

</div>

<style>
  .wrap { width: min(var(--scene-w), 100%); margin-inline: auto; padding-inline: 16px; }
  h2 { font-family: var(--display); font-size: var(--scene-h2); font-weight: 400; letter-spacing: -0.01em; line-height: 1.1; text-wrap: balance; }
  .lede { margin-top: 8px; max-width: 62ch; line-height: 1.5; color: var(--text-secondary); }

  .boards { margin-top: 28px; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(420px, 100%), 1fr)); gap: 24px; }
  .board {
    padding: var(--card-pad);
    border-radius: var(--card-radius);
    background: #fff;
    color: var(--text-primary);
    box-shadow: var(--card-shadow);
  }
  header:not(.scene-head) { display: flex; align-items: baseline; justify-content: space-between; gap: 14px; }
  h3 { font-family: var(--display); font-size: 1.45rem; font-weight: 400; }
  header:not(.scene-head) p { font-size: 0.76rem; color: var(--text-muted); text-align: right; }

  /* Twelve rows tall: each row is --row-h plus its 2px gap. Positioned so a
     row's offsetTop is measured from the list, for scrolling to it. */
  ol {
    --row-h: 30px;
    position: relative;
    max-height: calc(12 * (var(--row-h) + 2px) - 2px);
    margin: 14px 0 0;
    padding: 0 4px 0 0;
    list-style: none;
    overflow-y: auto;
    scrollbar-color: #c9d0e3 transparent;
  }

  /* The same row as Rank the 50's list: rank, word, bar on a track, count. */
  .row {
    display: grid;
    grid-template-columns: 2em var(--wcol) minmax(0, 1fr) 2.6em;
    align-items: center;
    gap: 10px;
    width: 100%;
    height: var(--row-h, 30px);
    padding: 0 8px;
    margin-bottom: 2px;
    border: none;
    border-radius: 10px;
    background: transparent;
    color: var(--text-primary);
    font-size: 0.92rem;
    text-align: left;
    font-variant-numeric: tabular-nums;
  }
  button.row:hover, .row.lit { background: rgba(25, 30, 59, 0.05); }
  .row.lit .w { font-weight: 650; }
  .row:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 1px; }
  .n { color: var(--text-muted); text-align: right; font-size: 0.84rem; }
  .w { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .bar { display: block; height: 8px; border-radius: 4px; background: #eef1f7; }
  .bar span { display: block; height: 100%; border-radius: 4px; background: #b8c1d4; }
  .mine .bar span, .row.lit .bar span { background: var(--ticket); }
  .c { text-align: right; }
  .row.theirs:not(.lit) .w, .row.theirs:not(.lit) .c { color: #a3a9ba; }
  .row.theirs:not(.lit) .bar span { background: #d3d9e5; }

  .pin { min-height: 32px; margin-top: 10px; }
  .pin-hint { display: block; padding: 3px 8px; font-size: 0.76rem; color: var(--text-muted); }

  @media (max-width: 520px) {
    .row { grid-template-columns: 1.8em minmax(0, 10ch) minmax(0, 1fr) 2.2em; gap: 7px; }
  }
</style>
