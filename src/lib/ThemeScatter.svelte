<script>
  /**
   * Nate's sketch 10: pick any two measures, see where the 50 cities fall.
   *
   * x/y = the two chosen measures (linear). Colour = category. Everything is a
   * rate per 1,000 words, so long and short scrapes are comparable.
   *
   * Svelte draws the circles with {#each}; D3 supplies the scales and draws the
   * axes inside their own <g> elements.
   */
  import { scaleLinear } from 'd3-scale';
  import { extent } from 'd3-array';
  import { axisBottom, axisLeft } from 'd3-axis';
  import { select } from 'd3-selection';
  import { AXIS_OPTIONS, axisById } from './data.js';

  let {
    /** The cities that survive the current filter — these get drawn solid. */
    cities = [],
    /** All 50, so the axes never jump when the filter changes. */
    allCities = [],
    xKey = 'theme:History',
    yKey = 'theme:Food',
    hoveredCity = null,
    picks = [],
    /** When true the filtered-out cities stay visible but dimmed (linking). */
    showExcluded = true,
    /**
     * Names to keep emphasised. Unlike the filter, this removes nothing — the
     * rest of the cities stay plotted and stay interactive, just dimmed.
     */
    highlightNames = null,
    onhovercity = () => {},
    onpickcity = () => {},
    onchangeaxis = () => {}
  } = $props();

  const margin = { top: 14, right: 18, bottom: 52, left: 64 };
  const width = 460;
  const height = 380;
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  let xAxis = $derived(axisById(xKey));
  let yAxis = $derived(axisById(yKey));

  // Domains come from all 50 so the frame is stable while filtering.
  let basis = $derived(allCities.length ? allCities : cities);

  function padded(values) {
    const [lo, hi] = extent(values);
    if (lo === undefined) return [0, 1];
    if (lo === hi) return [lo - 1, hi + 1];
    const pad = (hi - lo) * 0.08;
    return [Math.min(0, lo), hi + pad];
  }

  let x = $derived(
    scaleLinear().domain(padded(basis.map(xAxis.get))).range([0, innerW]).nice()
  );
  let y = $derived(
    // SVG y grows downward, so the range is flipped: high values sit at the top.
    scaleLinear().domain(padded(basis.map(yAxis.get))).range([innerH, 0]).nice()
  );

  let visible = $derived(new Set(cities.map((c) => c.city)));
  let drawn = $derived(showExcluded ? basis : cities);

  let gx = $state(null);
  let gy = $state(null);
  $effect(() => { if (gx) select(gx).call(axisBottom(x).ticks(6)); });
  $effect(() => { if (gy) select(gy).call(axisLeft(y).ticks(6)); });

  const groups = [...new Set(AXIS_OPTIONS.map((a) => a.group))];
</script>

<figure>
  <figcaption>
    <h2>Where the cities fall</h2>
    <div class="pickers">
      <label>
        <span class="eyebrow">Horizontal</span>
        <select value={xKey} onchange={(e) => onchangeaxis('x', e.currentTarget.value)}>
          {#each groups as g}
            <optgroup label={g}>
              {#each AXIS_OPTIONS.filter((a) => a.group === g) as a}
                <option value={a.id}>{a.label}</option>
              {/each}
            </optgroup>
          {/each}
        </select>
      </label>
      <label>
        <span class="eyebrow">Vertical</span>
        <select value={yKey} onchange={(e) => onchangeaxis('y', e.currentTarget.value)}>
          {#each groups as g}
            <optgroup label={g}>
              {#each AXIS_OPTIONS.filter((a) => a.group === g) as a}
                <option value={a.id}>{a.label}</option>
              {/each}
            </optgroup>
          {/each}
        </select>
      </label>
    </div>
  </figcaption>

  <svg viewBox="0 0 {width} {height}" role="img"
       aria-label="{cities.length} cities plotted on {xAxis.label} against {yAxis.label}">
    <g transform="translate({margin.left},{margin.top})">
      <!-- Recessive grid behind the marks. -->
      {#each y.ticks(6) as t}
        <line class="grid" x1="0" x2={innerW} y1={y(t)} y2={y(t)} />
      {/each}
      {#each x.ticks(6) as t}
        <line class="grid" y1="0" y2={innerH} x1={x(t)} x2={x(t)} />
      {/each}

      <g bind:this={gx} class="axis" transform="translate(0,{innerH})"></g>
      <g bind:this={gy} class="axis"></g>

      <text class="axis-label" x={innerW / 2} y={innerH + 40} text-anchor="middle">
        {xAxis.label} <tspan class="unit">({xAxis.unit})</tspan>
      </text>
      <text class="axis-label" transform="rotate(-90)" x={-innerH / 2} y={-46} text-anchor="middle">
        {yAxis.label} <tspan class="unit">({yAxis.unit})</tspan>
      </text>

      {#each drawn as c (c.city)}
        {@const filteredOut = !visible.has(c.city)}
        {@const notHighlit = highlightNames ? !highlightNames.has(c.city) : false}
        <circle
          cx={x(xAxis.get(c))}
          cy={y(yAxis.get(c))}
          r={picks.includes(c.city) ? 7 : 5.5}
          class="dot"
          class:gem={c.category === 'hidden'}
          class:dim={filteredOut}
          class:faded={notHighlit && !filteredOut}
          class:picked={picks.includes(c.city)}
          class:hovered={hoveredCity === c.city}
          role="button"
          tabindex="0"
          aria-label="{c.city}: {xAxis.label} {xAxis.get(c).toFixed(2)}, {yAxis.label} {yAxis.get(c).toFixed(2)}"
          onclick={() => onpickcity(c.city)}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onpickcity(c.city); }
          }}
          onmouseenter={() => onhovercity(c.city)}
          onmouseleave={() => onhovercity(null)}
          onfocus={() => onhovercity(c.city)}
          onblur={() => onhovercity(null)}
        ><title>{c.city}, {c.country}
{xAxis.label}: {xAxis.get(c).toFixed(2)}
{yAxis.label}: {yAxis.get(c).toFixed(2)}</title></circle>
      {/each}

      <!-- Direct-label only what the reader is acting on, never every point. -->
      {#each drawn.filter((c) => picks.includes(c.city) || hoveredCity === c.city) as c (c.city)}
        <text class="pointlabel" x={x(xAxis.get(c)) + 10} y={y(yAxis.get(c)) + 4}>{c.city}</text>
      {/each}
    </g>
  </svg>
</figure>

<style>
  figure { margin: 0; }
  figcaption { margin-bottom: 6px; }
  svg { width: 100%; height: auto; }

  .pickers { display: flex; gap: 14px; margin-top: 8px; flex-wrap: wrap; }
  .pickers label { display: flex; flex-direction: column; gap: 3px; }

  .grid { stroke: var(--gridline); stroke-width: 1; }
  .axis-label { font-size: 11px; font-weight: 600; fill: var(--text-secondary); }
  .unit { font-weight: 400; fill: var(--text-muted); }

  .dot {
    fill: var(--big);
    fill-opacity: 0.85;
    /* 2px surface ring so overlapping marks stay countable. */
    stroke: var(--surface-1);
    stroke-width: 2;
    cursor: pointer;
    transition: opacity 120ms;
  }
  .dot.gem { fill: var(--gem); }
  /* Filtered out: gone from the reading, and not clickable. */
  .dot.dim { opacity: 0.15; pointer-events: none; }
  /* Merely un-highlighted: still in the data, still clickable. */
  .dot.faded { opacity: 0.22; }
  .dot.picked, .dot.hovered { stroke: var(--text-primary); stroke-width: 2; }
  .dot:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; }

  .pointlabel {
    font-size: 11px;
    font-weight: 600;
    fill: var(--text-primary);
    paint-order: stroke;
    stroke: var(--surface-1);
    stroke-width: 3.5;
    pointer-events: none;
  }
</style>
