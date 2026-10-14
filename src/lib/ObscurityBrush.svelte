<script>
  /**
   * Filter strip: the 50 cities laid out by how well known they actually are.
   *
   * Obscurity is the external measure (English Wikipedia pageviews, log-scaled
   * on fixed anchors), which is why we filter on it rather than on the
   * hand-assigned popular/hidden label — that label disagrees with the
   * pageviews for about 10 of the 50 cities.
   *
   * d3.brushX owns the brush <g>; the pixel extent is inverted through the
   * scale before the range is reported, so state is stored in data units.
   */
  import { scaleLinear } from 'd3-scale';
  import { brushX } from 'd3-brush';
  import { axisBottom } from 'd3-axis';
  import { select } from 'd3-selection';

  let {
    cities = [],
    /** [lo, hi] in obscurity units, or null for "everything". */
    range = null,
    hoveredCity = null,
    onbrush = () => {},
    onhovercity = () => {}
  } = $props();

  const margin = { top: 16, right: 40, bottom: 26, left: 40 };
  const width = 700;
  const height = 92;
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  let x = $derived(scaleLinear().domain([0, 1]).range([0, innerW]));

  let gAxis = $state(null);
  let gBrush = $state(null);

  $effect(() => {
    if (gAxis) {
      select(gAxis).call(
        axisBottom(x).ticks(5).tickFormat((d) => d.toFixed(1))
      );
    }
  });

  let brush = $state(null);

  // Attach the brush behaviour once, when the <g> exists.
  $effect(() => {
    if (!gBrush) return;
    const b = brushX()
      .extent([[0, 0], [innerW, innerH]])
      .on('end', (event) => {
        // Only react to real gestures. brush.move() below also fires "end",
        // and echoing that back into state would loop.
        if (!event.sourceEvent) return;
        // Invert pixels to data units before the selection leaves this view.
        if (!event.selection) return onbrush(null);
        const [lo, hi] = event.selection.map(x.invert);
        onbrush([lo, hi]);
      });
    select(gBrush).call(b);
    brush = b;
  });

  // Drive d3's visual selection FROM `range`, so state is the single source of
  // truth. Without this, clearing the range leaves d3's own selection behind;
  // the next drag then starts inside that stale rectangle, d3 reads it as a
  // move rather than a new selection, and the brush silently stops filtering.
  $effect(() => {
    if (!gBrush || !brush) return;
    const px = range ? range.map((v) => x(v)) : null;
    select(gBrush).call(brush.move, px);
  });

  // Dodge overlapping dots into rows so all 50 stay countable.
  let laid = $derived.by(() => {
    const rows = [];
    const R = 5;
    return [...cities]
      .sort((a, b) => a.obscurity - b.obscurity)
      .map((c) => {
        const cx = x(c.obscurity);
        let row = 0;
        while (rows[row] !== undefined && cx - rows[row] < R * 2) row++;
        rows[row] = cx;
        return { c, cx, cy: innerH - R - 2 - row * (R * 2 + 1.5) };
      });
  });

  let active = $derived(
    range ? cities.filter((c) => c.obscurity >= range[0] && c.obscurity <= range[1]) : cities
  );
</script>

<figure>
  <figcaption>
    <div>
      <h2>Filter by how known the city actually is</h2>
      <p class="note">
        Drag across the strip to keep only those cities. Obscurity runs
        <strong>0 = famous</strong> to <strong>1 = obscure</strong>: English
        Wikipedia pageviews, log-scaled. An outside measure, not our
        popular/hidden label.
      </p>
    </div>
    <div class="status">
      <strong>{active.length}</strong> of {cities.length}
      {#if range}
        <button onclick={() => onbrush(null)}>Clear</button>
      {/if}
    </div>
  </figcaption>

  <svg viewBox="0 0 {width} {height}" role="img"
       aria-label="Obscurity filter strip, {active.length} of {cities.length} cities selected">
    <g transform="translate({margin.left},{margin.top})">
      {#each laid as d (d.c.city)}
        <circle
          cx={d.cx} cy={d.cy} r="4.5"
          class="dot"
          class:gem={d.c.category === 'hidden'}
          class:dim={range && (d.c.obscurity < range[0] || d.c.obscurity > range[1])}
          class:hovered={hoveredCity === d.c.city}
          onmouseenter={() => onhovercity(d.c.city)}
          onmouseleave={() => onhovercity(null)}
          role="presentation"
        ><title>{d.c.city} — obscurity {d.c.obscurity.toFixed(2)}, {d.c.pageviews.toLocaleString()} views/yr</title></circle>
      {/each}
      <g bind:this={gBrush} class="brush"></g>
      <g bind:this={gAxis} class="axis" transform="translate(0,{innerH})"></g>
    </g>
  </svg>
</figure>

<style>
  figure { margin: 0; }
  figcaption { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
  figcaption .note { margin-top: 4px; max-width: 58ch; }
  .status {
    font-size: 0.78rem; white-space: nowrap;
    display: flex; align-items: center; gap: 8px;
  }
  svg { width: 100%; height: auto; cursor: crosshair; }

  .dot { fill: var(--big); stroke: var(--surface-1); stroke-width: 1.5; }
  .dot.gem { fill: var(--gem); }
  .dot.dim { opacity: 0.18; }
  .dot.hovered { stroke: var(--text-primary); stroke-width: 2; }

  :global(.brush .selection) {
    fill: var(--text-primary);
    fill-opacity: 0.07;
    stroke: var(--text-primary);
    stroke-opacity: 0.4;
  }
  :global(.brush .handle) { fill: var(--text-primary); fill-opacity: 0.25; }
</style>
