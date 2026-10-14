<script>
  /**
   * Josh's sketch 15, with one correction from the methodology: similarity is
   * cosine on descriptive TF-IDF and the corpus maximum is 0.20, so the sketch's
   * "Overall similarity 95%" is not a number this data can produce. We show the
   * four twin definitions instead, and let them disagree in public.
   *
   * Theme comparison is a diverging bar chart: themes down the middle, city A's
   * rate to the left, city B's to the right, on one shared length scale with a
   * zero baseline at the centre.
   */
  import { scaleLinear } from 'd3-scale';
  import {
    THEMES, PERSONALITIES, TWIN_METHODS,
    themeProfileDistance, personalityProfileDistance,
    greatCircleKm, sharedDescriptiveWords
  } from './data.js';

  let {
    a = null,
    b = null,
    cities = [],
    onclear = () => {},
    onhovercity = () => {}
  } = $props();

  // Drawn near its real display size: an SVG much smaller than its container
  // gets upscaled, and the 10px type scales with it.
  const ROW = 27;
  const LABEL_W = 150;
  const ARM = 258;
  const GUTTER = 14;
  const width = LABEL_W + ARM * 2 + GUTTER * 2;
  const LEFT_BASE = ARM + GUTTER;              // zero baseline for city A
  const RIGHT_BASE = ARM + GUTTER + LABEL_W;   // zero baseline for city B
  let height = $derived(THEMES.length * ROW + 36);

  // One fixed length scale across every pairing, so a bar of a given length
  // means the same rate no matter which two cities are on screen.
  let themeMax = $derived(
    Math.max(1, ...cities.flatMap((c) => THEMES.map((t) => c.themes[t])))
  );
  let len = $derived(scaleLinear().domain([0, themeMax]).range([0, ARM]));

  let km = $derived(a && b ? greatCircleKm(a, b) : 0);
  let themeDist = $derived(a && b ? themeProfileDistance(a, b) : 0);
  let voiceDist = $derived(a && b ? personalityProfileDistance(a, b) : 0);
  let shared = $derived(a && b ? sharedDescriptiveWords(a, b) : []);

  /** Where this pair ranks among a's 49 possible partners, 1 = closest. */
  function rankOf(city, other, fn) {
    const all = cities
      .filter((c) => c.city !== city.city)
      .map((c) => fn(city, c))
      .sort((x, y) => x - y);
    return all.indexOf(fn(city, other)) + 1;
  }
  let themeRank = $derived(a && b ? rankOf(a, b, themeProfileDistance) : 0);
  let voiceRank = $derived(a && b ? rankOf(a, b, personalityProfileDistance) : 0);

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
  <div class="h2h">
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

    <!-- Four definitions of "twin", and they disagree. -->
    <section>
      <h3>Does anything call them twins?</h3>
      <table class="twins">
        <thead>
          <tr>
            <th>Definition</th>
            <th>{a.city}'s twin</th>
            <th>{b.city}'s twin</th>
            <th>This pair</th>
          </tr>
        </thead>
        <tbody>
          {#each TWIN_METHODS as m}
            {@const aT = a.twins[m.id]}
            {@const bT = b.twins[m.id]}
            {@const hit = aT.partner === b.city || bT.partner === a.city}
            <tr class:hit>
              <td>
                <strong>{m.label}</strong>
                <span class="q">{m.question}</span>
              </td>
              <td class:match={aT.partner === b.city}>
                {aT.partner}
                <span class="score">{fmt(aT.score, m.lowerIsCloser ? 2 : 3)} {m.unit}</span>
              </td>
              <td class:match={bT.partner === a.city}>
                {bT.partner}
                <span class="score">{fmt(bT.score, m.lowerIsCloser ? 2 : 3)} {m.unit}</span>
              </td>
              <td>
                {#if m.id === 'theme'}
                  {fmt(themeDist)} sd<span class="score">#{themeRank} of 49 closest</span>
                {:else if m.id === 'personality'}
                  {fmt(voiceDist)} sd<span class="score">#{voiceRank} of 49 closest</span>
                {:else if hit}
                  yes
                {:else}
                  <span class="na">—</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      <p class="note caveat">
        Cosine similarity peaks at <strong>0.20</strong> across the whole corpus, so
        read it as a ranking, not a percentage — there is no such thing as two
        cities being "95% alike" here. The two <em>sd apart</em> rows are
        distances: lower is closer. The four methods pick the same twin for at
        most 8 of the 50 cities.
      </p>
    </section>

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

            {#if a.dominantTheme === t}
              <text class="flag" x={LEFT_BASE - len(a.themes[t]) - 6} y={midY}
                    text-anchor="end" dominant-baseline="middle">{fmt(a.themes[t], 1)}</text>
            {/if}
            {#if b.dominantTheme === t}
              <text class="flag" x={RIGHT_BASE + len(b.themes[t]) + 6} y={midY}
                    text-anchor="start" dominant-baseline="middle">{fmt(b.themes[t], 1)}</text>
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

  table.twins { width: 100%; border-collapse: collapse; font-size: 0.75rem; }
  .twins th {
    text-align: left; font-weight: 600; color: var(--text-muted);
    font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.05em;
    padding: 0 8px 5px 0; border-bottom: 1px solid var(--border);
  }
  .twins td {
    padding: 7px 8px 7px 0; vertical-align: top;
    border-bottom: 1px solid var(--border);
  }
  .twins tr.hit td { background: var(--wash); }
  .twins td.match { font-weight: 650; }
  .q { display: block; color: var(--text-muted); font-size: 0.68rem; margin-top: 2px; }
  .score { display: block; color: var(--text-muted); font-size: 0.68rem; margin-top: 2px;
           font-variant-numeric: tabular-nums; }
  .na { color: var(--text-muted); }
  .caveat { margin-top: 8px; }

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

  .two-up { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
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
