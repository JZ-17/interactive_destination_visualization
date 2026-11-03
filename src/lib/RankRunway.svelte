<script>
  /**
   * Every city as one dot along the measure, so the shape of the ranking and
   * where your cities stand in it are visible before reading a single card.
   * Dots stack where values coincide; position is the value, colour the category.
   */
  import { scaleLinear } from 'd3-scale';

  let {
    cities = [],
    measure,
    picks = [],
    hoveredCity = null,
    onhover = () => {},
    onpick = () => {}
  } = $props();

  let width = $state(900);
  const STACK_H = 84;
  const M = { top: 52, right: 14, bottom: 42, left: 14 };
  const height = M.top + STACK_H + M.bottom;
  const BIN = 11;

  let x = $derived(
    scaleLinear()
      .domain([0, Math.max(1e-9, ...cities.map(measure.get))])
      .range([M.left, width - M.right])
      .nice()
  );
  let ticks = $derived(x.ticks(width < 520 ? 4 : 8));

  let dots = $derived.by(() => {
    const bins = new Map();
    for (const c of cities) {
      const key = Math.round(x(measure.get(c)) / BIN);
      if (!bins.has(key)) bins.set(key, []);
      bins.get(key).push(c);
    }
    const tallest = Math.max(1, ...[...bins.values()].map((b) => b.length));
    const step = Math.min(11, STACK_H / tallest);
    const out = [];
    for (const group of bins.values()) {
      group.forEach((c, i) => {
        out.push({ city: c, x: x(measure.get(c)), y: M.top + STACK_H - 5 - i * step });
      });
    }
    return out;
  });

  /** Labels for the held cities; the second steps up if they would collide. */
  let flags = $derived.by(() => {
    const held = dots.filter((d) => picks.includes(d.city.city)).sort((p, q) => p.x - q.x);
    return held.map((d, i) => ({
      ...d,
      lift: i === 1 && Math.abs(held[1].x - held[0].x) < 110 ? 18 : 0,
      anchor: d.x < 60 ? 'start' : d.x > width - 60 ? 'end' : 'middle'
    }));
  });
  let hoverDot = $derived(
    dots.find((d) => d.city.city === hoveredCity && !picks.includes(d.city.city)) ?? null
  );
</script>

<div class="runway" bind:clientWidth={width}>
  <svg {width} {height} role="img" aria-label="All {cities.length} cities along {measure.label}, {measure.unit}">
    <line class="base" x1={M.left} x2={width - M.right} y1={M.top + STACK_H + 3} y2={M.top + STACK_H + 3} />
    {#each ticks as t (t)}
      <line class="tickmark" x1={x(t)} x2={x(t)} y1={M.top + STACK_H + 3} y2={M.top + STACK_H + 8} />
      <text class="tick" x={x(t)} y={M.top + STACK_H + 21} text-anchor="middle">{t}</text>
    {/each}
    <text class="unit" x={M.left} y={height - 4}>{measure.label}, {measure.unit}</text>

    {#each dots as d (d.city.city)}
      {#if !picks.includes(d.city.city)}
        <circle
          class="dot"
          class:gem={d.city.category === 'hidden'}
          class:hovered={hoveredCity === d.city.city}
          cx={d.x}
          cy={d.y}
          r="5"
          role="presentation"
          onmouseenter={() => onhover(d.city.city)}
          onmouseleave={() => onhover(null)}
          onclick={() => onpick(d.city.city)}
        ><title>{d.city.city}: {measure.get(d.city).toFixed(1)}</title></circle>
      {/if}
    {/each}

    {#each flags as f (f.city.city)}
      <line class="flagpole" x1={f.x} x2={f.x} y1={f.y} y2={M.top - 10 - f.lift} />
      <circle
        class="held"
        class:gem={f.city.category === 'hidden'}
        cx={f.x}
        cy={f.y}
        r="7.5"
        role="presentation"
        onclick={() => onpick(f.city.city)}
      ><title>{f.city.city}: {measure.get(f.city).toFixed(1)}</title></circle>
      <text class="flag" x={f.x} y={M.top - 14 - f.lift} text-anchor={f.anchor}>{f.city.city}</text>
    {/each}

    {#if hoverDot}
      <text class="hover-label" x={hoverDot.x} y={hoverDot.y - 10} text-anchor="middle">{hoverDot.city.city}</text>
    {/if}
  </svg>
</div>

<style>
  .runway { width: 100%; }
  svg { display: block; overflow: visible; }
  .base { stroke: var(--axis); }
  .tickmark { stroke: var(--axis); }
  .tick, .unit { font-size: 11px; fill: var(--text-secondary); }
  .dot { fill: var(--big); stroke: #f3f6fb; stroke-width: 1.5; cursor: pointer; }
  .dot.gem { fill: var(--gem); }
  .dot.hovered { stroke: var(--text-primary); stroke-width: 2; }
  .held { fill: var(--big); stroke: var(--text-primary); stroke-width: 3; cursor: pointer; }
  .held.gem { fill: var(--gem); }
  .flagpole { stroke: var(--text-primary); stroke-width: 1.2; }
  /* The halo keeps a neighbour's flagpole off the letters. */
  .flag {
    font-family: var(--display); font-size: 16px; fill: var(--text-primary);
    paint-order: stroke; stroke: #f3f6fb; stroke-width: 5; stroke-linejoin: round;
  }
  .hover-label {
    font-size: 12px; font-weight: 650; fill: var(--text-primary);
    paint-order: stroke; stroke: #f3f6fb; stroke-width: 4; stroke-linejoin: round;
    pointer-events: none;
  }
</style>
