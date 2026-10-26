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
    /**
     * How far the connecting arc bows away from the surface, as a fraction of
     * the globe's radius. 0 hugs the sphere (a plain great circle); higher
     * values lift it into a flight-path curve.
     */
    arcLift = 0.16,
    /** The hero layout floats its own caption, so it turns this one off. */
    showCaption = true,
    onhovercity = () => {},
    onpickcity = () => {},
    /** Reports how many cities are on the near hemisphere right now. */
    onvisiblecount = () => {}
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

  /**
   * The arc between the two selected cities, bowed away from the straight line.
   *
   * The obvious trick — push each point radially outward from the globe's
   * centre — does nothing here, because selecting a city rotates it to the
   * centre of the disc, so the arc is already radial and scaling along that
   * same radius leaves it straight. Instead we offset each point
   * *perpendicular to the chord* by sin(pi * t): zero at both ends, widest in
   * the middle, and curved no matter how the globe happens to be turned.
   *
   * Points on the far hemisphere are dropped rather than projected, since the
   * orthographic projection would fold them back over the near side.
   */
  let pickArc = $derived.by(() => {
    if (!showPickArc || picks.length < 2) return null;
    const a = byName.get(picks[0]);
    const b = byName.get(picks[1]);
    if (!a || !b) return null;

    const interp = geoInterpolate([a.lon, a.lat], [b.lon, b.lat]);
    const cx = size / 2;
    const cy = size / 2;
    const STEPS = 96;

    // Walk the great circle, keeping only what faces the viewer.
    const pts = [];
    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS;
      const geo = interp(t);
      if (geoDistance(geo, centre) >= Math.PI / 2) {
        pts.push(null);
        continue;
      }
      const xy = projection(geo);
      pts.push(xy ? { t, x: xy[0], y: xy[1] } : null);
    }

    const seen = pts.filter(Boolean);
    if (seen.length < 2) return null;

    // Chord between the visible endpoints sets the bow direction and scale.
    const p0 = seen[0];
    const p1 = seen[seen.length - 1];
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const chord = Math.hypot(dx, dy);
    if (chord < 1) return null;

    let nx = -dy / chord;
    let ny = dx / chord;
    // Bow away from the globe's centre, so the arc lifts off the sphere.
    const mid = seen[Math.floor(seen.length / 2)];
    if ((mid.x - cx) * nx + (mid.y - cy) * ny < 0) {
      nx = -nx;
      ny = -ny;
    }
    const amp = arcLift * chord;
    const span = p1.t - p0.t || 1;

    const runs = [];
    let run = [];
    for (const q of pts) {
      if (!q) {
        if (run.length > 1) runs.push(run);
        run = [];
        continue;
      }
      const u = (q.t - p0.t) / span;             // 0 at one end, 1 at the other
      const k = amp * Math.sin(Math.PI * u);
      run.push([q.x + nx * k, q.y + ny * k]);
    }
    if (run.length > 1) runs.push(run);
    if (!runs.length) return null;

    return runs
      .map((r) => r.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(2)},${q[1].toFixed(2)}`).join(''))
      .join(' ');
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
  // The far hemisphere is genuinely hidden, so this count is the only cue that
  // the missing cities exist at all. Report it so the caller can surface it.
  $effect(() => onvisiblecount(visible.length));
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
          <stop offset="0%" stop-color="var(--ocean-hi)" />
          <stop offset="100%" stop-color="var(--ocean-lo)" />
        </radialGradient>
      </defs>

      <circle cx={size / 2} cy={size / 2} r={R + 3} class="glow" />
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

  {#if showCaption}
    <figcaption>
      <p class="note">
        <strong>Drag to spin.</strong> Click a city to select it — the globe turns
        to bring it to the front. Pick two to compare them below.
        <span class="count">{visible.length} of {cities.length} cities on this face</span>
      </p>
    </figcaption>
  {/if}
</figure>

<style>
  /* width:100% matters — in a centred flex column the figure would otherwise
     shrink to fit its content and the globe would never reach its max size.
     min-height:0 lets .stage shrink inside a height-constrained parent, which
     is what the full-screen hero needs. */
  figure {
    margin: 0; width: 100%; min-height: 0;
    display: flex; flex-direction: column; gap: 10px; align-items: center;
  }
  /* Square by construction, so it fits whichever of width/height runs out. */
  .stage {
    flex: 1 1 auto;
    min-height: 0;
    /* Square, with the height the flex row gives it driving the width, so the
       sphere grows until whichever of height or width runs out. */
    aspect-ratio: 1;
    width: auto;
    max-width: min(100%, var(--globe-max, 720px));
    margin-inline: auto;
  }

  svg {
    width: 100%;
    height: 100%;
    display: block;
    cursor: grab;
    touch-action: none;
    /* Scenery colours — deliberately low-chroma so the category hues on the
       city markers stay the most saturated thing on screen. */
    --ocean-hi: #2f5f9e;
    --ocean-lo: #101937;
    --globe-land: #7b8296;
    --globe-coast: #9aa0b2;
  }
  svg.dragging { cursor: grabbing; }

  @media (prefers-color-scheme: dark) {
    :global(:root:not([data-theme='light'])) svg {
      --ocean-hi: #27507f;
      --ocean-lo: #0a1128;
      --globe-land: #5b6278;
      --globe-coast: #767d92;
    }
  }
  :global(:root[data-theme='dark']) svg {
    --ocean-hi: #27507f;
    --ocean-lo: #0a1128;
    --globe-land: #5b6278;
    --globe-coast: #767d92;
  }

  .ocean { stroke: none; }
  .glow { fill: none; stroke: #8fc7f0; stroke-opacity: 0.35; stroke-width: 6; }
  .rim { fill: none; stroke: rgba(255, 255, 255, 0.22); stroke-width: 1; }
  .grat { fill: none; stroke: #ffffff; stroke-opacity: 0.13; stroke-width: 0.6; pointer-events: none; }
  .land { fill: var(--globe-land); stroke: var(--globe-coast); stroke-width: 0.5; pointer-events: none; }

  .arc {
    fill: none;
    stroke: #ffffff;
    stroke-width: 2.5;
    stroke-opacity: 0.85;
    stroke-linecap: round;
    pointer-events: none;
  }

  .dot {
    fill: var(--big);
    /* A light ring keeps the category hue separable from the terrain under it. */
    stroke: #f4f6f8;
    stroke-width: 1.5;
    cursor: pointer;
  }
  .dot.gem { fill: var(--gem); }
  .dot.faded { opacity: 0.25; }
  .dot.picked, .dot.hovered { stroke: #ffffff; stroke-width: 3; }
  .dot:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; }

  .label {
    font-size: 13px;
    font-weight: 650;
    fill: #ffffff;
    paint-order: stroke;
    stroke: rgba(10, 20, 30, 0.85);
    stroke-width: 3.5;
    pointer-events: none;
  }

  figcaption { max-width: 60ch; text-align: center; }
  .count { display: block; color: var(--text-muted); margin-top: 3px; }
</style>
