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
    THEMES, PERSONALITIES,
    greatCircleKm, sharedDescriptiveWords
  } from './data.js';

  let {
    a = null,
    b = null,
    cities = [],
    /** Narrow geometry, for the column beside the globe. */
    compact = false,
    onclear = () => {},
    onhovercity = () => {}
  } = $props();

  // Drawn near its real display size: an SVG much smaller than its container
  // gets upscaled, and the 10px type scales with it. The compact geometry
  // exists for the same reason in reverse — at full width the chart would be
  // squeezed into ~370px and every label would shrink with it.
  let ROW = $derived(compact ? 21 : 27);
  let LABEL_W = $derived(compact ? 100 : 150);
  let ARM = $derived(compact ? 108 : 258);
  let GUTTER = $derived(compact ? 10 : 14);
  let width = $derived(LABEL_W + ARM * 2 + GUTTER * 2);
  let LEFT_BASE = $derived(ARM + GUTTER);             // zero baseline for city A
  let RIGHT_BASE = $derived(ARM + GUTTER + LABEL_W);  // zero baseline for city B
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
  function topVoice(c, n = 3) {
    return [...PERSONALITIES]
      .sort((x, y) => c.voice[y] - c.voice[x])
      .slice(0, n)
      .map((p) => ({ name: p, z: c.voice[p] }));
  }

  const fmt = (v, d = 2) => v.toFixed(d);
</script>

{#if !a || !b}
  <div class="empty">
    <p class="note">
      <strong>Pick two cities</strong> to compare them head to head. Click one,
      then another — in any view on this page.
    </p>
    {#if a}
      <p class="note holding">Holding <strong>{a.city}</strong>. Pick a second.</p>
    {/if}
  </div>
{:else}
  <div class="h2h" class:compact>
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
              class="bar" class:gem={a.category === 'hidden'}
              x={LEFT_BASE - len(a.themes[t])}
              y={rowY}
              width={len(a.themes[t])}
              height={ROW - 8}
              rx="2"
            ><title>{a.city} · {t}: {fmt(a.themes[t])} per 1,000 words</title></rect>

            <!-- right arm: city B -->
            <rect
              class="bar" class:gem={b.category === 'hidden'}
              x={RIGHT_BASE}
              y={rowY}
              width={len(b.themes[t])}
              height={ROW - 8}
              rx="2"
            ><title>{b.city} · {t}: {fmt(b.themes[t])} per 1,000 words</title></rect>

            <!-- A near-full-length bar leaves no room outside it for the
                 value, so the label flips inside rather than running off the
                 edge of the chart. -->
            {#if a.dominantTheme === t}
              {@const outside = LEFT_BASE - len(a.themes[t]) - 6}
              <text
                class="flag" class:inside={outside < 26}
                x={outside < 26 ? LEFT_BASE - len(a.themes[t]) + 6 : outside}
                y={midY}
                text-anchor={outside < 26 ? 'start' : 'end'}
                dominant-baseline="middle"
              >{fmt(a.themes[t], 1)}</text>
            {/if}
            {#if b.dominantTheme === t}
              {@const outside = RIGHT_BASE + len(b.themes[t]) + 6}
              <text
                class="flag" class:inside={outside > width - 26}
                x={outside > width - 26 ? RIGHT_BASE + len(b.themes[t]) - 6 : outside}
                y={midY}
                text-anchor={outside > width - 26 ? 'end' : 'start'}
                dominant-baseline="middle"
              >{fmt(b.themes[t], 1)}</text>
            {/if}
          </g>
        {/each}
        <line class="baseline" x1={LEFT_BASE} x2={LEFT_BASE} y1="18" y2={height - 8} />
        <line class="baseline" x1={RIGHT_BASE} x2={RIGHT_BASE} y1="18" y2={height - 8} />
      </svg>
      <p class="note">
        Mentions per 1,000 words. Labelled bars are each city's
        <strong>archetype theme</strong> — the one it over-indexes on, which is not
        always its longest bar.
      </p>
    </section>

    <section class="two-up">
      <div>
        <h3>How they sell it</h3>
        <dl class="voice">
          <dt>{a.city}</dt>
          <dd>
            <strong>{a.personality}</strong>
            <span class="score">{fmt(a.personalityStrength)} sd</span>
            <span class="q">{topVoice(a).map((v) => v.name.replace('The ', '')).join(' · ')}</span>
          </dd>
          <dt>{b.city}</dt>
          <dd>
            <strong>{b.personality}</strong>
            <span class="score">{fmt(b.personalityStrength)} sd</span>
            <span class="q">{topVoice(b).map((v) => v.name.replace('The ', '')).join(' · ')}</span>
          </dd>
        </dl>
      </div>
      <div>
        <h3>Words they share</h3>
        {#if shared.length}
          <ul class="words">
            {#each shared as w}<li>{w}</li>{/each}
          </ul>
        {:else}
          <p class="note">
            No overlap in their top-8 distinctive words — these two pitch
            themselves with different vocabulary entirely.
          </p>
        {/if}
        <p class="note sig">
          Signature word: <strong>{a.signatureWord || '—'}</strong> ({a.city}) ·
          <strong>{b.signatureWord || '—'}</strong> ({b.city})
        </p>
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
  .baseline { stroke: var(--axis); stroke-width: 1; }
  .flag { font-size: 9.5px; font-weight: 650; fill: var(--text-secondary);
          font-variant-numeric: tabular-nums; }
  /* Sitting on the bar, so it needs to read against the category colour. */
  .flag.inside { fill: #fffdf8; }

  .two-up { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  /* In the narrow column there is no room for two; stack them. */
  .h2h.compact .two-up { grid-template-columns: 1fr; gap: 14px; }
  .h2h.compact header .card h2 { font-size: 1rem; }
  .h2h.compact .sub { font-size: 0.68rem; }
  .h2h.compact { gap: 12px; }
  dl.voice { margin: 0; font-size: 0.78rem; }
  dl.voice dt { color: var(--text-muted); font-size: 0.7rem; margin-top: 8px; }
  dl.voice dt:first-child { margin-top: 0; }
  dl.voice dd { margin: 1px 0 0; }

  ul.words { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 5px; }
  ul.words li {
    font-size: 0.72rem; padding: 2px 7px;
    border: 1px solid var(--border); border-radius: 999px;
  }
  .sig { margin-top: 9px; }

  @media (max-width: 620px) {
    .two-up { grid-template-columns: 1fr; }
  }
</style>
