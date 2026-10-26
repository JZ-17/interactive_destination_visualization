<script>
  /**
   * Josh's sketch 15, with one correction from the methodology: similarity is
   * cosine on descriptive TF-IDF and the corpus maximum is 0.20, so the sketch's
   * "Overall similarity 95%" is not a number this data can produce, and no
   * single similarity score is shown.
   *
   * Comparison is a diverging bar chart: themes down the middle, city A's
   * rate to the left, city B's to the right, on one shared length scale with a
   * zero baseline at the centre.
   */
  import { scaleLinear } from 'd3-scale';
  import {
    THEMES, PERSONALITIES, VOICE_BLURB, VOICE_SHORT,
    greatCircleKm, sharedDescriptiveWords
  } from './data.js';

  let {
    a = null,
    b = null,
    cities = [],
    /** Narrow geometry, for the column beside the globe. */
    compact = false,
    /**
     * Prompt shown before two cities are chosen. Prototype B turns it off:
     * its two empty drop slots already say what to do.
     */
    showEmptyState = true,
    /**
     * Colour each side by the city's own hue instead of its category. Worth
     * it beyond matching the deck: two hidden gems otherwise draw two
     * identical amber bars, told apart only by which side they sit on.
     */
    cityColor = false,
    onclear = () => {},
    onhovercity = () => {}
  } = $props();

  // Drawn near its real display size: an SVG much smaller than its container
  // gets upscaled, and the 10px type scales with it. The compact geometry
  // exists for the same reason in reverse — at full width the chart would be
  // squeezed into ~370px and every label would shrink with it.
  let ROW = $derived(compact ? 21 : 27);
  let LABEL_W = $derived(compact ? 118 : 150);
  let ARM = $derived(compact ? 92 : 230);
  let GUTTER = $derived(compact ? 8 : 14);
  /**
   * Every row carries both values, so each side reserves a fixed column for
   * them at the outer edge. Putting the number against the end of its own bar
   * does not work when every bar is labelled: a zero-length bar would push its
   * value into the theme names in the middle.
   */
  let VAL_W = $derived(compact ? 30 : 44);
  let width = $derived(GUTTER * 2 + VAL_W * 2 + ARM * 2 + LABEL_W);
  let LEFT_BASE = $derived(GUTTER + VAL_W + ARM);     // zero baseline for city A
  let RIGHT_BASE = $derived(LEFT_BASE + LABEL_W);     // zero baseline for city B
  let height = $derived(THEMES.length * ROW + 36);

  // One fixed length scale across every pairing, so a bar of a given length
  // means the same rate no matter which two cities are on screen.
  let themeMax = $derived(
    Math.max(1, ...cities.flatMap((c) => THEMES.map((t) => c.themes[t])))
  );
  let len = $derived(scaleLinear().domain([0, themeMax]).range([0, ARM]));

  let km = $derived(a && b ? greatCircleKm(a, b) : 0);
  let shared = $derived(a && b ? sharedDescriptiveWords(a, b) : []);

  /** The strongest rhetorical moves a city leans on, for the voice read-out. */
  /**
   * The next strongest moves after the one the city is named for. The winner
   * is excluded: listing it again produced "The Cliche Machine 1.68 sd Cliche
   * Machine · Braggart · Closer", which says the same thing twice.
   */
  function alsoLeansOn(c, n = 2) {
    return [...PERSONALITIES]
      .filter((p) => p !== c.personality)
      .sort((x, y) => c.voice[y] - c.voice[x])
      .slice(0, n)
      .map((p) => ({ name: p, short: VOICE_SHORT[p] ?? '' }));
  }

  const fmt = (v, d = 2) => v.toFixed(d);
</script>

{#if !a || !b}
  {#if showEmptyState}
    <div class="empty">
      <p class="note">
        <strong>Pick two cities</strong> to compare them head to head. Click one,
        then another — in any view on this page.
      </p>
      {#if a}
        <p class="note holding">Holding <strong>{a.city}</strong>. Pick a second.</p>
      {/if}
    </div>
  {/if}
{:else}
  <div
    class="h2h"
    class:compact
    class:city-color={cityColor}
    style={cityColor ? `--a-h: ${a.hue}; --b-h: ${b.hue};` : undefined}
  >
    <header>
      <div class="card" class:gem={a.category === 'hidden'}
           onmouseenter={() => onhovercity(a.city)} onmouseleave={() => onhovercity(null)}
           role="presentation">
        <span class="eyebrow">{a.category === 'hidden' ? 'Hidden gem' : 'Big destination'}</span>
        <h2>{a.city}</h2>
        <p class="sub">{a.country} · {a.region}</p>
      </div>
      <div class="vs">
        <span>vs</span>
        <button onclick={onclear}>Clear</button>
      </div>
      <div class="card right" class:gem={b.category === 'hidden'}
           onmouseenter={() => onhovercity(b.city)} onmouseleave={() => onhovercity(null)}
           role="presentation">
        <span class="eyebrow">{b.category === 'hidden' ? 'Hidden gem' : 'Big destination'}</span>
        <h2>{b.city}</h2>
        <p class="sub">{b.country} · {b.region}</p>
      </div>
    </header>

    <p class="distance note">
      <strong>{Math.round(km).toLocaleString()} km</strong> apart
      {#if a.region !== b.region}· different regions{:else}· same region{/if}
    </p>


    <!-- Diverging bars: zero baseline down the centre, one shared length scale. -->
    <section>
      <h3>What they talk about</h3>
      <svg viewBox="0 0 {width} {height}" role="img"
           aria-label="Theme mention rates for {a.city} and {b.city}">
        <text class="side" x={LEFT_BASE} y="11" text-anchor="end">{a.city}</text>
        <text class="side" x={RIGHT_BASE} y="11" text-anchor="start">{b.city}</text>

        {#each THEMES as t, i}
          {@const rowY = 26 + i * ROW}
          {@const midY = rowY + (ROW - 8) / 2}
          <g class="trow">
            <rect x="0" y={rowY - 2} width={width} height={ROW - 2} class="stripe" />
            <text class="tlabel" x={(LEFT_BASE + RIGHT_BASE) / 2} y={midY}
                  text-anchor="middle" dominant-baseline="middle">{t}</text>

            <!-- left arm: city A, growing away from the centre -->
            <rect
              class="bar side-a" class:gem={a.category === 'hidden'}
              x={LEFT_BASE - len(a.themes[t])}
              y={rowY}
              width={len(a.themes[t])}
              height={ROW - 8}
              rx="2"
            ><title>{a.city} · {t}: {fmt(a.themes[t])} per 1,000 words</title></rect>

            <!-- right arm: city B -->
            <rect
              class="bar side-b" class:gem={b.category === 'hidden'}
              x={RIGHT_BASE}
              y={rowY}
              width={len(b.themes[t])}
              height={ROW - 8}
              rx="2"
            ><title>{b.city} · {t}: {fmt(b.themes[t])} per 1,000 words</title></rect>

            <!-- Every theme carries its number, in a fixed column at each
                 outer edge so the figures line up and never collide with a
                 bar or with the theme names. The archetype theme is set in
                 heavier ink rather than being the only one labelled. -->
            <text
              class="flag" class:arch={a.dominantTheme === t}
              x={GUTTER + VAL_W - 6} y={midY}
              text-anchor="end" dominant-baseline="middle"
            >{fmt(a.themes[t], 1)}</text>
            <text
              class="flag" class:arch={b.dominantTheme === t}
              x={width - GUTTER - VAL_W + 6} y={midY}
              text-anchor="start" dominant-baseline="middle"
            >{fmt(b.themes[t], 1)}</text>
          </g>
        {/each}
        <line class="baseline" x1={LEFT_BASE} x2={LEFT_BASE} y1="18" y2={height - 8} />
        <line class="baseline" x1={RIGHT_BASE} x2={RIGHT_BASE} y1="18" y2={height - 8} />
      </svg>
      <p class="note">
        Mentions per 1,000 words. The <strong>bold figure</strong> on each side
        is that city's archetype theme — the one it over-indexes on, which is
        not always its longest bar.
      </p>
    </section>

    <section class="two-up">
      <div>
        <h3>How they sell it</h3>
        <p class="note scalenote">
          Each city's strongest rhetorical move, then the next two it leans on.
          <strong>sd</strong> is standard deviations: every vocabulary rate is
          scored against the fifty-city average and spread, and a move's
          strength is the mean of its rates. 1.41 sd means that city sits 1.41
          standard deviations above average on that kind of language. Below
          0.5 sd a city is called <em>The Understated</em> — it is not leaning
          on anything.
        </p>
        <dl class="voice">
          {#each [a, b] as c (c.city)}
            <dt>{c.city}</dt>
            <dd>
              <span class="lead">
                <strong>{c.personality}</strong>
                <span class="score">{fmt(c.personalityStrength)} sd</span>
              </span>
              <span class="blurb">{VOICE_BLURB[c.personality] ?? ''}</span>
              <ul class="also">
                {#each alsoLeansOn(c) as m (m.name)}
                  <li><span class="also-name">{m.name.replace('The ', '')}</span> {m.short}</li>
                {/each}
              </ul>
            </dd>
          {/each}
        </dl>
      </div>
      <div>
        <h3>Words they share</h3>
        {#if shared.length}
          <ul class="words">
            {#each shared as w}
              <li class:signature={w === a.signatureWord && w === b.signatureWord}>
                {w}
                {#if w === a.signatureWord && w === b.signatureWord}
                  <span class="badge">both over-use</span>
                {/if}
              </li>
            {/each}
          </ul>
        {:else}
          <p class="note">
            No overlap in their top-8 distinctive words — these two pitch
            themselves with different vocabulary entirely.
          </p>
        {/if}
        {#if a.signatureWord && a.signatureWord === b.signatureWord}
          {#if !shared.includes(a.signatureWord)}
          <!-- Both over-use the same word: say it once rather than printing
               the same word twice with a city name after each. -->
            <p class="note sig">
              Both over-use the same word: <strong>{a.signatureWord}</strong>
            </p>
          {/if}
        {:else}
          <p class="note siglabel">Signature word — most over-used against the rest of the corpus</p>
          <dl class="sigs">
            <dt>{a.city}</dt>
            <dd>{a.signatureWord || '—'}</dd>
            <dt>{b.city}</dt>
            <dd>{b.signatureWord || '—'}</dd>
          </dl>
        {/if}
      </div>
    </section>
  </div>
{/if}

<style>
  .empty {
    display: flex; flex-direction: column; gap: 7px;
    align-items: center; justify-content: center;
    min-height: 150px; padding: 24px;
    border: 1px dashed var(--border); border-radius: var(--radius);
  }
  .empty p { text-align: center; max-width: 46ch; }
  .holding { color: var(--text-primary); }
  .h2h { display: flex; flex-direction: column; gap: 18px; }

  header { display: grid; grid-template-columns: 1fr auto 1fr; align-items: stretch; gap: 10px; }
  .card {
    border-left: 3px solid var(--big);
    padding: 6px 10px;
  }
  .card.gem { border-left-color: var(--gem); }
  .card.right { border-left: none; border-right: 3px solid var(--big); text-align: right; }
  .card.right.gem { border-right-color: var(--gem); }
  .h2h.city-color header .card,
  .h2h.city-color header .card.gem { border-left-color: var(--a-color); }
  .h2h.city-color header .card.right,
  .h2h.city-color header .card.right.gem { border-right-color: var(--b-color); }
  .card h2 { font-size: 1.25rem; margin-top: 2px; }
  .sub { font-size: 0.75rem; color: var(--text-secondary); margin-top: 1px; }
  .vs {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 6px;
    font-size: 0.75rem; color: var(--text-muted);
  }
  .distance { text-align: center; margin-top: -8px; }

  h3 { color: var(--text-secondary); margin-bottom: 7px; }


  svg { width: 100%; height: auto; }
  .stripe { fill: transparent; }
  .trow:hover .stripe { fill: var(--wash); }
  .tlabel { font-size: 10.5px; fill: var(--text-secondary); }
  .side { font-size: 10px; font-weight: 650; fill: var(--text-muted);
          text-transform: uppercase; letter-spacing: 0.05em; }
  .bar { fill: var(--big); }
  .bar.gem { fill: var(--gem); }
  /* Repeat .gem so the city hue wins on specificity rather than source order
     — the same trap that silently collapsed the deck to one gem colour. */
  .h2h.city-color {
    --a-color: hsl(var(--a-h) var(--city-s, 58%) var(--city-l, 47%));
    --b-color: hsl(var(--b-h) var(--city-s, 58%) var(--city-l, 47%));
  }
  .h2h.city-color .bar.side-a,
  .h2h.city-color .bar.side-a.gem { fill: var(--a-color); }
  .h2h.city-color .bar.side-b,
  .h2h.city-color .bar.side-b.gem { fill: var(--b-color); }
  .baseline { stroke: var(--axis); stroke-width: 1; }
  .flag {
    font-size: 9.5px; font-weight: 500; fill: var(--text-muted);
    font-variant-numeric: tabular-nums;
  }
  /* The archetype theme: heavier, since it is no longer the only one labelled. */
  .flag.arch { font-weight: 750; fill: var(--text-primary); }

  .two-up { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  /* In the narrow column there is no room for two; stack them. */
  .h2h.compact .two-up { grid-template-columns: 1fr; gap: 14px; }
  .h2h.compact header .card h2 { font-size: 1rem; }
  .h2h.compact .sub { font-size: 0.68rem; }
  .h2h.compact { gap: 12px; }
  dl.voice { margin: 0; font-size: 0.78rem; }
  dl.voice dt { color: var(--text-muted); font-size: 0.7rem; margin-top: 9px; }
  dl.voice dt:first-child { margin-top: 0; }
  dl.voice dd { margin: 1px 0 0; }
  .lead { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
  .blurb { display: block; font-size: 0.72rem; color: var(--text-secondary); margin-top: 1px; }
  ul.also {
    list-style: none; margin: 4px 0 0; padding: 0;
    font-size: 0.7rem; color: var(--text-muted);
  }
  ul.also li { margin-top: 1px; }
  .also-name { color: var(--text-secondary); font-weight: 600; }
  ul.also li::before { content: 'also '; color: var(--text-muted); }
  .scalenote { margin-bottom: 8px; }
  .lead .score { display: inline; margin: 0; }

  .siglabel { margin-top: 10px; }
  .sigs {
    margin: 4px 0 0;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 2px 10px;
    font-size: 0.74rem;
  }
  .sigs dt { color: var(--text-muted); }
  .sigs dd { margin: 0; font-weight: 650; }

  ul.words { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 5px; }
  ul.words li {
    font-size: 0.72rem; padding: 2px 7px;
    border: 1px solid var(--border); border-radius: 999px;
    display: inline-flex; align-items: baseline; gap: 5px;
  }
  ul.words li.signature { border-color: var(--text-muted); font-weight: 650; }
  .badge { font-size: 0.62rem; font-weight: 400; color: var(--text-muted); }
  .sig { margin-top: 9px; }

  @media (max-width: 620px) {
    .two-up { grid-template-columns: 1fr; }
  }
</style>
