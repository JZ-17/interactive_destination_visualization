<script>
  /**
   * How one city sells itself: its personality, proved from its own text,
   * beside its profile on all nine selling moves.
   *
   * Laid out like the themes scene above it: a heading and one line, then the
   * quotes as white cards with the numbers beside them, then the profile on a
   * full-width card below.
   *
   * The evidence: the personality is a way of talking,
   * so the proof is quotation: the sentences the site wrote, the phrase that
   * counts in bold, then the three numbers behind the label (how many such
   * words, the rate, and that rate against the fifty-city average). A short
   * description can earn a strong label from a single word, so when the count
   * is one or two on a site under 400 words, the scene says so.
   *
   * The profile: every move as a bar from the fifty-city average, left for moves it
   * avoids, right for moves it leans on. The dashed line at 0.5 sd is where a
   * move becomes a personality (data/METHODOLOGY.md). Only the leading move
   * wears the ticket colour; for The Understated that is the move it comes
   * closest on, which stops short of the line. An Understated city gets no
   * quotes or numbers: proving a move it barely makes would overstate it.
   */
  import { scaleLinear } from 'd3-scale';
  import { PERSONALITIES, VOICE_BLURB, voiceQuotes } from './data.js';

  let { city } = $props();

  const THRESHOLD = 0.5;

  let under = $derived(city.personality === 'The Understated');
  let moves = $derived(
    PERSONALITIES.map((p) => ({ p, v: city.voice[p] })).sort((a, b) => b.v - a.v)
  );
  let lead = $derived(under ? moves[0].p : city.personality);
  let leadScore = $derived(city.voice[lead]);
  let quotes = $derived(under ? [] : voiceQuotes(city, lead, 3));

  /** The source column that most sets the city apart on its leading move. */
  let best = $derived(
    under ? null : [...(city.voiceTerms?.[lead] ?? [])]
      .filter((t) => t.count > 0)
      .sort((a, b) => b.rate / (b.avg || 1) - a.rate / (a.avg || 1))[0] ?? null
  );
  let thin = $derived(!!best && best.count <= 2 && city.wordCount < 400);
  const words = (n) => n.toLocaleString('en-US');
  /** "surprise words" -> "surprise word" when there is exactly one. */
  const unit = (label, n) => (n === 1 ? label.replace(/ies$/, 'y').replace(/s$/, '') : label);

  // --- the profile chart (D3 margin convention, marks drawn by Svelte) -----
  // Drawn at the card's real width, so labels keep their size at any width.
  let W = $state(900);
  const ROW = 30;
  const M = { top: 4, right: 44, bottom: 44, left: 112 };
  let H = $derived(M.top + moves.length * ROW + M.bottom);
  let x = $derived(
    scaleLinear()
      .domain([Math.min(-1.5, ...moves.map((m) => m.v)), Math.max(3, ...moves.map((m) => m.v))])
      .range([M.left, W - M.right])
  );
  const name = (p) => p.replace(/^The /, '');
</script>

<section class="persona-scene">
  <header>
    <h2>{city.city} is <span class="persona">{city.personality}</span></h2>
    <p class="lede">
      {#if under}
        No selling move stands out. Its strongest, <strong>{lead}</strong>, sits only
        {leadScore.toFixed(1)} standard deviations above the average site, short of the 0.5
        that would make it a personality.
      {:else}
        It {VOICE_BLURB[lead]}. That puts it {leadScore.toFixed(1)} standard deviations above
        the average site.
      {/if}
    </p>
  </header>

  {#if quotes.length || best}
    <div class="evidence">
      <div class="quotes">
        {#each quotes as parts, i (i)}
          <blockquote>
            {#each parts as part, j (j)}{#if part.hit}<strong>{part.text}</strong>{:else}{part.text}{/if}{/each}
          </blockquote>
        {/each}
      </div>

      <aside class="facts">
        {#if best}
          <dl class="stats">
            <div><dt>{unit(best.label, best.count)} in {words(city.wordCount)} words</dt><dd>{words(best.count)}</dd></div>
            <div><dt>per 1,000 words</dt><dd>{best.rate.toFixed(1)}</dd></div>
            <div><dt>the fifty-city average of {best.avg.toFixed(1)}</dt><dd>{(best.rate / best.avg).toFixed(1)}×</dd></div>
          </dl>
        {/if}
        {#if thin}
          <p class="caveat">
            Keep in mind that {city.city}’s description is {words(city.wordCount)} words long, so
            {best.count === 1 ? 'a single word' : 'two words'} can carry the whole label.
          </p>
        {/if}
      </aside>
    </div>
  {/if}

  <figure class="profile">
    <figcaption>Each bar is one selling move, against the fifty-city average.</figcaption>
    <div class="plot" bind:clientWidth={W}>
      <svg width={W} height={H} role="img" aria-label="{city.city} on the nine selling moves, in standard deviations from the fifty-city average">
        <line class="zero" x1={x(0)} x2={x(0)} y1={M.top} y2={H - M.bottom} />
        <line class="bar-line" x1={x(THRESHOLD)} x2={x(THRESHOLD)} y1={M.top} y2={H - M.bottom} />
        {#each moves as m, i (m.p)}
          {@const y = M.top + i * ROW}
          {@const left = Math.min(x(0), x(m.v))}
          <g class:lead={m.p === lead}>
            <text class="label" x={M.left - 12} y={y + 19} text-anchor="end">{name(m.p)}</text>
            <rect class="bar" x={left} y={y + 7} width={Math.max(1.5, Math.abs(x(m.v) - x(0)))} height="16" rx="3" />
            <text
              class="value"
              x={m.v >= 0 ? x(m.v) + 6 : x(m.v) - 6}
              y={y + 19}
              text-anchor={m.v >= 0 ? 'start' : 'end'}
            >{m.v >= 0 ? '+' : '−'}{Math.abs(m.v).toFixed(1)}</text>
          </g>
        {/each}
        <text class="tick" x={x(0)} y={H - M.bottom + 16} text-anchor="middle">average</text>
        <text class="tick" x={x(THRESHOLD) + 4} y={H - M.bottom + 16} text-anchor="start">0.5: a personality</text>
        <text class="axis" x={M.left} y={H - 6}>standard deviations from the fifty-city average</text>
      </svg>
    </div>
  </figure>
</section>

<style>
  .persona-scene { width: min(var(--scene-w), 100%); margin-inline: auto; padding-inline: 16px; }

  h2 { font-family: var(--display); font-size: var(--scene-h2); font-weight: 400; letter-spacing: -0.01em; line-height: 1.1; text-wrap: balance; }
  .persona { color: var(--ticket); transition: color 0.4s ease; }
  .lede { margin-top: 8px; max-width: 62ch; color: var(--text-secondary); line-height: 1.5; }
  .lede strong { color: var(--text-primary); font-weight: 650; }

  /* Quotes on the left, the numbers that back them in a column on the right. */
  .evidence {
    margin-top: 28px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(200px, 260px);
    gap: clamp(20px, 3.5vw, 44px);
    align-items: start;
  }
  @media (max-width: 760px) { .evidence { grid-template-columns: minmax(0, 1fr); } }

  .quotes { display: grid; gap: 14px; }
  blockquote {
    margin: 0;
    padding: var(--card-pad);
    border-radius: var(--card-radius);
    background: #fff;
    box-shadow: var(--card-shadow);
    font-size: 0.98rem;
    line-height: 1.55;
    color: var(--text-secondary);
  }
  blockquote strong { color: var(--text-primary); font-weight: 650; }

  .facts { display: grid; gap: 20px; }
  .stats { margin: 0; display: grid; gap: 18px; }
  /* dt before dd, as a <dl> requires; shown number-first. */
  .stats div { display: flex; flex-direction: column-reverse; gap: 2px; }
  .stats dd { margin: 0; font-family: var(--display); font-size: 2.2rem; line-height: 1; font-variant-numeric: tabular-nums; }
  .stats dt { font-size: 0.8rem; line-height: 1.35; color: var(--text-muted); }

  .caveat { font-size: 0.86rem; line-height: 1.5; color: var(--text-secondary); }

  .profile {
    margin: 28px 0 0;
    padding: var(--card-pad);
    border-radius: var(--card-radius);
    background: #fff;
    box-shadow: var(--card-shadow);
  }
  figcaption { font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 14px; }
  .plot { width: 100%; }
  svg { display: block; overflow: visible; }
  .zero { stroke: #8b90a3; stroke-width: 1; }
  .bar-line { stroke: #8b90a3; stroke-width: 1; stroke-dasharray: 3 3; }
  .bar { fill: #c3cbdb; }
  .lead .bar { fill: var(--ticket); transition: fill 0.4s ease; }
  .label { font-size: 13px; fill: var(--text-secondary); }
  .lead .label { fill: var(--text-primary); font-weight: 650; }
  /* A white halo, so the threshold line passes behind a value, not through it. */
  .value { font-size: 11px; fill: var(--text-muted); paint-order: stroke; stroke: #fff; stroke-width: 4; stroke-linejoin: round; }
  .tick { font-size: 11px; fill: var(--text-muted); }
  .axis { font-size: 11px; fill: var(--text-secondary); }
</style>
