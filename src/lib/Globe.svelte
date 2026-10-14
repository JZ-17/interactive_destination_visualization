<script>
  /**
   * A large orthographic globe. Drag to spin it, click a city to select it.
   *
   * Orthographic rather than a flat map because the question underneath this
   * prototype is "do cities that sound alike sit anywhere near each other?" —
   * and a globe does not lie about distance the way a rectangular projection
   * does. The cost is that half the cities are always behind the sphere, which
   * is why selecting a city spins the globe to bring it to the front.
   */
  import { geoOrthographic, geoPath, geoDistance, geoInterpolate } from 'd3-geo';

  let {
    cities = [],
    land = null,
    /** Names to keep emphasised; the rest stay drawn and clickable. */
    highlightNames = null,
    hoveredCity = null,
    picks = [],
    /** Draw an arc between the two picked cities. */
    showPickArc = true,
    onhovercity = () => {},
    onpickcity = () => {}
  } = $props();

  const size = 720;
  const R = size / 2 - 22;

  // [yaw, pitch]. Starts over the Atlantic so both hemispheres have cities.
  let rotation = $state([20, -15]);
  let dragging = $state(false);

  let projection = $derived(
    geoOrthographic()
      .scale(R)
      .translate([size / 2, size / 2])
      .rotate([rotation[0], rotation[1], 0])
      .clipAngle(90)
  );
  let path = $derived(geoPath(projection));

  // The point on the sphere currently facing the viewer.
  let centre = $derived([-rotation[0], -rotation[1]]);
  const onFront = (c) => geoDistance([c.lon, c.lat], centre) < Math.PI / 2 - 0.02;

  let byName = $derived(new Map(cities.map((c) => [c.city, c])));

  /** Spin the globe so a city ends up facing the viewer. */
  function faceCity(name) {
    const c = byName.get(name);
    if (!c) return;
    rotation = [-c.lon, -c.lat];
  }

  function pick(name) {
    // Bring it to the front first, so a click on the rim does not feel random.
    faceCity(name);
    onpickcity(name);
  }

  // --- drag to spin ------------------------------------------------------
  let last = null;
  function down(e) {
    dragging = true;
    last = [e.clientX, e.clientY];
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e) {
    if (!dragging || !last) return;
    const [px, py] = last;
    // Degrees per pixel, scaled so the drag tracks the surface at this radius.
    const k = 0.25;
    rotation = [
      rotation[0] + (e.clientX - px) * k,
      // Clamp the pitch so the globe never flips over.
      Math.max(-80, Math.min(80, rotation[1] - (e.clientY - py) * k))
    ];
    last = [e.clientX, e.clientY];
  }
  function up(e) {
    dragging = false;
    last = null;
    if (e.pointerId !== undefined && e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  // An arc between the two selected cities, drawn as a great circle.
  let pickArc = $derived.by(() => {
    if (!showPickArc || picks.length < 2) return null;
    const a = byName.get(picks[0]);
    const b = byName.get(picks[1]);
    if (!a || !b) return null;
    const interp = geoInterpolate([a.lon, a.lat], [b.lon, b.lat]);
    const coords = Array.from({ length: 61 }, (_, i) => interp(i / 60));
    return path({ type: 'LineString', coordinates: coords });
  });

  const graticule = (() => {
    // Simple graticule: meridians every 30°, parallels every 30°.
    const lines = [];
    for (let lon = -180; lon < 180; lon += 30) {
      lines.push({
        type: 'LineString',
        coordinates: Array.from({ length: 37 }, (_, i) => [lon, -90 + i * 5])
      });
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      lines.push({
        type: 'LineString',
        coordinates: Array.from({ length: 73 }, (_, i) => [-180 + i * 5, lat])
      });
    }
    return lines;
  })();

  let visible = $derived(cities.filter(onFront));
  let faded = (c) => (highlightNames ? !highlightNames.has(c.city) : false);
</script>

<figure>
  <div class="stage">
    <svg
      viewBox="0 0 {size} {size}"
      class:dragging
      role="application"
      aria-label="Rotatable globe of 50 tourism-board cities. Click a city to select it for comparison."
      onpointerdown={down}
      onpointermove={move}
      onpointerup={up}
      onpointerleave={up}
    >
      <defs>
        <radialGradient id="globeShade" cx="35%" cy="32%" r="78%">
          <stop offset="0%" stop-color="var(--globe-hi)" />
          <stop offset="100%" stop-color="var(--globe-lo)" />
        </radialGradient>
      </defs>

      <circle cx={size / 2} cy={size / 2} r={R} class="ocean" fill="url(#globeShade)" />

      {#each graticule as g}
        <path class="grat" d={path(g)} />
      {/each}

      {#if land}
        <path class="land" d={path(land)} />
      {/if}

      <circle cx={size / 2} cy={size / 2} r={R} class="rim" />

      {#if pickArc}
        <path class="arc" d={pickArc} />
      {/if}

      {#each visible as c (c.city)}
        {@const p = projection([c.lon, c.lat])}
        {#if p}
          <circle
            cx={p[0]} cy={p[1]}
            r={picks.includes(c.city) ? 7.5 : 5}
            class="dot"
            class:gem={c.category === 'hidden'}
            class:faded={faded(c)}
            class:picked={picks.includes(c.city)}
            class:hovered={hoveredCity === c.city}
            role="button"
            tabindex="0"
            aria-label="{c.city}, {c.country}"
            onclick={(e) => { e.stopPropagation(); pick(c.city); }}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(c.city); }
            }}
            onpointerdown={(e) => e.stopPropagation()}
            onmouseenter={() => onhovercity(c.city)}
            onmouseleave={() => onhovercity(null)}
            onfocus={() => onhovercity(c.city)}
            onblur={() => onhovercity(null)}
          ><title>{c.city}, {c.country} — {c.archetype}</title></circle>
        {/if}
      {/each}

      <!-- Label only what is being acted on. -->
      {#each visible.filter((c) => picks.includes(c.city) || hoveredCity === c.city) as c (c.city)}
        {@const p = projection([c.lon, c.lat])}
        {#if p}
          <text class="label" x={p[0] + 10} y={p[1] + 4}>{c.city}</text>
        {/if}
      {/each}
    </svg>
  </div>

  <figcaption>
    <p class="note">
      <strong>Drag to spin.</strong> Click a city to select it — the globe turns
      to bring it to the front. Pick two to compare them below.
      <span class="count">{visible.length} of {cities.length} cities on this face</span>
    </p>
  </figcaption>
</figure>

<style>
  figure { margin: 0; display: flex; flex-direction: column; gap: 10px; align-items: center; }
  .stage { width: 100%; max-width: 720px; }

  svg {
    width: 100%;
    height: auto;
    cursor: grab;
    touch-action: none;
    /* Shading steps for the sphere, defined per theme. */
    --globe-hi: #ffffff;
    --globe-lo: #eceae3;
  }
  svg.dragging { cursor: grabbing; }

  @media (prefers-color-scheme: dark) {
    :global(:root:not([data-theme='light'])) svg {
      --globe-hi: #262623;
      --globe-lo: #141413;
    }
  }
  :global(:root[data-theme='dark']) svg {
    --globe-hi: #262623;
    --globe-lo: #141413;
  }

  .ocean { stroke: none; }
  .rim { fill: none; stroke: var(--border); stroke-width: 1; }
  .grat { fill: none; stroke: var(--gridline); stroke-width: 0.6; pointer-events: none; }
  .land { fill: var(--land); stroke: var(--gridline); stroke-width: 0.5; pointer-events: none; }

  .arc {
    fill: none;
    stroke: var(--text-primary);
    stroke-width: 2;
    stroke-opacity: 0.6;
    stroke-linecap: round;
    pointer-events: none;
  }

  .dot {
    fill: var(--big);
    stroke: var(--surface-1);
    stroke-width: 1.5;
    cursor: pointer;
  }
  .dot.gem { fill: var(--gem); }
  .dot.faded { opacity: 0.25; }
  .dot.picked, .dot.hovered { stroke: var(--text-primary); stroke-width: 2.5; }
  .dot:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; }

  .label {
    font-size: 12px;
    font-weight: 650;
    fill: var(--text-primary);
    paint-order: stroke;
    stroke: var(--surface-1);
    stroke-width: 3.5;
    pointer-events: none;
  }

  figcaption { max-width: 60ch; text-align: center; }
  .count { display: block; color: var(--text-muted); margin-top: 3px; }
</style>
