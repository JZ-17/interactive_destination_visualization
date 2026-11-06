<script>
  /**
   * Two departures boards: this city's most-written words, and all fifty's.
   * Paper boards on the page's pale sky, with the split-flap rows kept in two
   * light tones; the word you point at lights up in the ticket's colour.
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
  <div class="boards" onmouseleave={() => (lit = null)} role="presentation">
    {#each boards as b (b.id)}
      {@const pin = pinned(b)}
      <article class="board">
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

  <div class="under">
    <p>
      Faded words on the right are ones {city.city} doesn’t use. These are raw
      counts, so longer sites add more: {city.city}’s runs {city.wordCount} words.
      The two boards use different scales.
    </p>
  </div>
</div>

<style>
  .wrap { width: min(1120px, 100%); margin-inline: auto; padding-inline: 16px; }
  .boards { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(430px, 100%), 1fr)); gap: 22px; }
  .board {
    padding: 22px 22px 16px;
    border-radius: 16px;
    background: #fff;
    color: var(--text-primary);
    border: 1px solid rgba(25, 30, 59, 0.07);
    box-shadow: 0 14px 34px rgba(25, 30, 59, 0.08), 0 2px 6px rgba(25, 30, 59, 0.04);
  }
  header { display: flex; align-items: baseline; justify-content: space-between; gap: 14px; }
  h3 { font-family: var(--display); font-size: 1.7rem; font-weight: 400; }
  header p { font-size: 0.74rem; color: var(--text-muted); text-align: right; }
  /* Twelve rows tall: each row is --row-h plus its 3px gap. Positioned so a
     row's offsetTop is measured from the list, for scrolling to it. */
  ol {
    --row-h: 27px;
    position: relative;
    max-height: calc(12 * (var(--row-h) + 3px) - 3px);
    margin: 14px 0 0;
    padding: 0 4px 0 0;
    list-style: none;
    overflow-y: auto;
    scrollbar-color: #c9d0e3 transparent;
  }

  /* Each row is a flap, split in two tones like a real board. A drawn line would
     run through the word and read as a strikethrough. */
  .row {
    position: relative;
    display: grid;
    grid-template-columns: 2.2em var(--wcol) 1fr 2.6em;
    align-items: center;
    gap: 10px;
    width: 100%;
    height: var(--row-h, 27px);
    padding: 0 8px;
    margin-bottom: 3px;
    border: none;
    border-radius: 5px;
    background: linear-gradient(180deg, #f5f7fc 0 50%, #edf1f9 50%);
    color: inherit;
    font-size: 0.84rem;
    text-align: left;
  }
  /* The ticket's colour, stationery not encoding: every ticket keeps white
     type at 4.5:1. The overlay keeps the flap's split showing through it. */
  button.row:hover, .row.lit {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0 50%, rgba(0, 0, 0, 0.04) 50%), var(--ticket);
    color: #fff;
  }
  .row:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 1px; }
  .row.theirs:not(.lit) { color: rgba(25, 30, 59, 0.38); }
  .n { font-size: 0.74rem; text-align: right; opacity: 0.75; font-variant-numeric: tabular-nums; }
  .w { font-weight: 650; letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .bar { display: block; }
  .bar span { display: block; height: 5px; border-radius: 999px; background: currentColor; opacity: 0.55; }
  .c { font-size: 0.76rem; text-align: right; font-variant-numeric: tabular-nums; }

  .pin { min-height: 32px; margin-top: 8px; padding-top: 8px; border-top: 1px dashed rgba(25, 30, 59, 0.16); }
  .pin-hint { display: block; padding: 3px 8px; font-size: 0.74rem; color: var(--text-muted); }

  .under {
    display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
    gap: 10px 22px; margin-top: 16px;
  }
  .under p { max-width: 74ch; font-size: 0.8rem; line-height: 1.45; color: var(--text-secondary); }

  @media (max-width: 520px) {
    .row { grid-template-columns: 1.8em minmax(0, 10ch) 1fr 2.2em; gap: 7px; }
    .board { padding: 16px 12px 12px; }
  }
</style>
