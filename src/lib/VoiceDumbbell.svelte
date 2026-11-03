<script>
  /**
   * How two cities sell: nine moves, one row each, a dot per city at its
   * distance from the fifty-city average. A small dot and a wider open ring, so
   * the two differ by shape as well as colour, and when both land on one value
   * the dot shows inside the ring instead of hiding behind it.
   */
  import { scaleLinear } from 'd3-scale';
  import Emblem from './Emblem.svelte';
  import { PERSONALITIES, VOICE_SHORT, VOICE_TICKET } from './data.js';

  let { a, b } = $props();

  let width = $state(760);
  let narrow = $derived(width < 620);
  let labelW = $derived(narrow ? 0 : 240);
  const ROW = 44;
  const M = { top: 26, right: 18, bottom: 40, left: 18 };

  let rows = $derived(
    [...PERSONALITIES].sort(
      (p, q) => Math.max(b.voice[q], a.voice[q]) - Math.max(b.voice[p], a.voice[p])
    )
  );

  let extent = $derived.by(() => {
    const vals = PERSONALITIES.flatMap((p) => [a.voice[p], b.voice[p]]);
    return [Math.min(-1, ...vals), Math.max(1, ...vals)];
  });
  let x = $derived(
    scaleLinear().domain(extent).range([labelW + M.left, width - M.right]).nice()
  );
  let ticks = $derived(x.ticks(5));
  let rowH = $derived(narrow ? ROW + 16 : ROW);
  let height = $derived(M.top + rows.length * rowH + M.bottom);
  const rowY = (i, h) => M.top + i * h + h - 16;

  let colorA = $derived(VOICE_TICKET[a.personality]);
  let colorB = $derived(VOICE_TICKET[b.personality]);
</script>

<div class="voices">
  <p class="intro">
    Each row is one way of selling. Right of the line means the site does it more
    than the average city.
  </p>
  <p class="who">
    <span><i class="dot" style="background:{colorA}"></i>{a.city}</span>
    <span><i class="dot ring" style="border-color:{colorB}"></i>{b.city}</span>
  </p>

  <div class="plot" bind:clientWidth={width} style="height:{height}px">
    <svg {width} {height} role="img" aria-label="{a.city} and {b.city} on nine selling moves, in standard deviations from the fifty-city average">
      {#each ticks as t (t)}
        <line class="grid" class:zero={t === 0} x1={x(t)} x2={x(t)} y1={M.top - 8} y2={height - M.bottom + 4} />
        <text class="tick" x={x(t)} y={height - M.bottom + 18} text-anchor="middle">{t > 0 ? `+${t}` : t}</text>
      {/each}
      <text class="axis" x={x(0)} y={height - 6} text-anchor="middle">standard deviations from the fifty-city average</text>

      {#each rows as p, i (p)}
        {@const y = rowY(i, rowH)}
        <line class="link" x1={x(a.voice[p])} x2={x(b.voice[p])} y1={y} y2={y} />
        <circle cx={x(a.voice[p])} cy={y} r="5.5" fill={colorA}>
          <title>{a.city}, {p}: {a.voice[p].toFixed(2)} sd</title>
        </circle>
        <circle cx={x(b.voice[p])} cy={y} r="9" fill="none" stroke={colorB} stroke-width="2.5">
          <title>{b.city}, {p}: {b.voice[p].toFixed(2)} sd</title>
        </circle>
      {/each}
    </svg>

    {#each rows as p, i (p)}
      {@const y = rowY(i, rowH)}
      <div class="label" class:narrow style="top:{narrow ? y - 37 : y - 17}px">
        <span class="mini"><Emblem name={p} /></span>
        <span class="text">
          <strong class:lead={a.personality === p || b.personality === p}>{p.replace('The ', '')}</strong>
          <small>{VOICE_SHORT[p]}</small>
        </span>
      </div>
    {/each}
  </div>
</div>

<style>
  .voices { width: min(980px, 100%); margin-inline: auto; padding-inline: 16px; }
  .intro { max-width: 60ch; margin: 0 auto; font-size: 0.98rem; line-height: 1.45; text-align: center; color: var(--text-secondary); }
  .who { display: flex; justify-content: center; gap: 24px; margin-top: 14px; font-family: var(--display); font-size: 1.3rem; }
  .who span { display: inline-flex; align-items: center; gap: 8px; }
  .dot { width: 14px; height: 14px; border-radius: 50%; display: inline-block; box-sizing: border-box; }
  .dot.ring { background: none; border: 3px solid; }
  .plot { position: relative; margin-top: 8px; }
  svg { position: absolute; inset: 0; overflow: visible; }
  .grid { stroke: rgba(25, 30, 59, 0.1); }
  .grid.zero { stroke: rgba(25, 30, 59, 0.5); }
  .tick, .axis { font-size: 11px; fill: var(--text-secondary); }
  .link { stroke: rgba(25, 30, 59, 0.3); stroke-width: 2; }
  .label { position: absolute; left: 0; display: flex; align-items: center; gap: 8px; height: 34px; }
  .label.narrow { height: 24px; }
  .mini { flex: none; width: 24px; height: 24px; color: var(--text-secondary); }
  .text { display: flex; flex-direction: column; line-height: 1.15; }
  .narrow .text { flex-direction: row; align-items: baseline; gap: 6px; padding-right: 6px; background: #f3f6fb; }
  strong { font-size: 0.86rem; font-weight: 500; }
  strong.lead { font-weight: 700; }
  small { font-size: 0.72rem; color: var(--text-secondary); }
</style>
