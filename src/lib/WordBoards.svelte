<script>
  /**
   * Two departures boards: this city's most-written words, and all fifty's.
   *
   * Twelve rows each, because a list that scrolls inside a scrolling page traps
   * the reader's wheel. Pointing at a word lights it on both boards, and if it
   * has not made the other board's top twelve it gets a row of its own at the
   * foot with its true rank. "Show all" opens the full list on purpose.
   */
  let { city, ranked = [], corpus = [] } = $props();

  const TOP = 12;
  let lit = $state(null);
  let all = $state(false);

  let own = $derived(new Set(ranked.map((w) => w.word)));
  let cityMax = $derived(Math.max(1, ...ranked.map((w) => w.own)));
  let corpusMax = $derived(corpus.length ? corpus[0].mentions : 1);
  let wcol = $derived(`${Math.max(9, ...corpus.map((w) => w.word.length)) + 1}ch`);

  let boards = $derived([
    { id: 'city', title: city.city, unit: `times ${city.city} writes it`, rows: ranked, value: (w) => w.own, max: cityMax },
    { id: 'all', title: 'All fifty', unit: 'times all fifty write it', rows: corpus, value: (w) => w.mentions, max: corpusMax }
  ]);

  function pinned(board) {
    if (!lit || all) return null;
    const i = board.rows.findIndex((w) => w.word === lit);
    return i >= TOP ? { w: board.rows[i], n: i + 1 } : null;
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
        <ol class:all>
          {#each all ? b.rows : b.rows.slice(0, TOP) as w, i (w.word)}
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
        {#if !all}
          <div class="pin" class:on={!!pin} aria-live="polite">
            {#if pin}
              <div class="row lit" style="--wcol:{wcol}">
                <span class="n">{pin.n}</span>
                <span class="w">{pin.w.word}</span>
                <span class="bar"><span style="width:{(b.value(pin.w) / b.max) * 100}%"></span></span>
                <span class="c">{b.value(pin.w)}</span>
              </div>
            {:else if lit && !b.rows.some((w) => w.word === lit)}
              <span class="pin-hint">{city.city} never writes “{lit}”</span>
            {:else}
              <span class="pin-hint">Point at a word to find it on both boards</span>
            {/if}
          </div>
        {/if}
      </article>
    {/each}
  </div>

  <div class="under">
    <p>
      Faded words on the right are ones {city.city} doesn’t use. These are raw
      counts, so longer sites add more: {city.city}’s runs {city.wordCount} words.
      The two boards use different scales.
    </p>
    <button onclick={() => (all = !all)} aria-pressed={all}>
      {all ? 'Show the top 12' : `Show all ${corpus.length} words`}
    </button>
  </div>
</div>

<style>
  .wrap { width: min(1120px, 100%); margin-inline: auto; padding-inline: 16px; }
  .boards { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(430px, 100%), 1fr)); gap: 22px; }
  .board {
    padding: 22px 22px 16px;
    border-radius: 16px;
    background: #191e3b;
    color: #f5f3ea;
    box-shadow: 0 22px 44px rgba(25, 30, 59, 0.28);
  }
  header { display: flex; align-items: baseline; justify-content: space-between; gap: 14px; }
  h3 { font-family: var(--display); font-size: 1.7rem; font-weight: 400; }
  header p { font-size: 0.74rem; color: #c5c9db; text-align: right; }
  ol { margin: 14px 0 0; padding: 0; list-style: none; }
  ol.all { max-height: 62vh; overflow-y: auto; scrollbar-color: #555c7c transparent; }

  /* Each row is a flap, split in two tones like a real board. A drawn line would
     run through the word and read as a strikethrough. */
  .row {
    position: relative;
    display: grid;
    grid-template-columns: 2.2em var(--wcol) 1fr 2.6em;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 5px 8px;
    margin-bottom: 3px;
    border: none;
    border-radius: 5px;
    background: linear-gradient(180deg, #2b3256 0 50%, #232949 50%);
    color: inherit;
    font-size: 0.84rem;
    text-align: left;
  }
  button.row:hover, .row.lit { background: linear-gradient(180deg, #f8f6ee 0 50%, #eeebdf 50%); color: #191e3b; }
  .row:focus-visible { outline: 2px solid #f5f3ea; outline-offset: 1px; }
  .row.theirs:not(.lit) { color: rgba(245, 243, 234, 0.42); }
  .n { font-size: 0.74rem; text-align: right; opacity: 0.75; font-variant-numeric: tabular-nums; }
  .w { font-weight: 650; letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .bar { display: block; }
  .bar span { display: block; height: 5px; border-radius: 999px; background: currentColor; opacity: 0.55; }
  .c { font-size: 0.76rem; text-align: right; font-variant-numeric: tabular-nums; }

  .pin { min-height: 32px; margin-top: 8px; padding-top: 8px; border-top: 1px dashed rgba(245, 243, 234, 0.3); }
  .pin-hint { display: block; padding: 3px 8px; font-size: 0.74rem; color: #c5c9db; }

  .under {
    display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
    gap: 10px 22px; margin-top: 16px;
  }
  .under p { max-width: 74ch; font-size: 0.8rem; line-height: 1.45; color: var(--text-secondary); }
  .under button { border-radius: 999px; padding: 6px 14px; background: #fff; }
  .under button[aria-pressed='true'] { background: var(--text-primary); }

  @media (max-width: 520px) {
    .row { grid-template-columns: 1.8em minmax(0, 10ch) 1fr 2.2em; gap: 7px; }
    .board { padding: 16px 12px 12px; }
  }
</style>
