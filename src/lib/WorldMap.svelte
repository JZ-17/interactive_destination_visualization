<script>
  /**
   * Nate's sketch 3 crossed with Christine's sketch 4: the 50 cities on a world
   * map, and — when a city is active — an arc to each of its four twins.
   *
   * The arcs are the point of the view. If "cities that sound alike" were just
   * "cities that are near each other", the arcs would be short. They are not.
   *
   * Arcs are drawn as great circles so the geography is honest; they carry no
   * hue of their own, since colour is reserved for category.
   */
  import { geoNaturalEarth1, geoPath, geoInterpolate } from 'd3-geo';
  import { TWIN_METHODS } from './data.js';

  let {
    cities = [],
    land = null,
    /**
     * Names to keep emphasised. This is a LINK, not a filter: the rest stay
     * drawn and stay clickable, just recessive.
     */
    highlightNames = null,
    activeCity = null,
    hoveredCity = null,
    picks = [],
    showArcs = true,
    onhovercity = () => {},
    onpickcity = () => {}
  } = $props();

  const width = 700;
  const height = 350;

  let projection = $derived(
    geoNaturalEarth1().fitExtent([[4, 6], [width - 4, height - 6]], { type: 'Sphere' })
  );
  let path = $derived(geoPath(projection));

  let byName = $derived(new Map(cities.map((c) => [c.city, c])));
  let active = $derived(activeCity ? byName.get(activeCity) : null);

  /** One arc per twin definition, de-duplicated when methods agree. */
  let arcs = $derived.by(() => {
    if (!active || !showArcs) return [];
    const seen = new Map();
    for (const m of TWIN_METHODS) {
      const partner = byName.get(active.twins[m.id].partner);
      if (!partner) continue;
      const key = partner.city;
      if (seen.has(key)) {
        seen.get(key).methods.push(m.label);
      } else {
        seen.set(key, { partner, methods: [m.label] });
      }
    }
    return [...seen.values()].map((d) => {
      const interp = geoInterpolate([active.lon, active.lat], [d.partner.lon, d.partner.lat]);
      const coords = Array.from({ length: 41 }, (_, i) => interp(i / 40));
      return { ...d, d: path({ type: 'LineString', coordinates: coords }) };
    });
  });

  function faded(c) {
    return highlightNames ? !highlightNames.has(c.city) : false;
  }
</script>

<figure>
  <figcaption>
    <h2>Who sounds like whom</h2>
    <p class="note">
      Click a city to draw a line to each of its four twins — one per definition
      of "twin". The lines are usually long: sounding alike has little to do with
      being nearby.
    </p>
  </figcaption>

  <svg viewBox="0 0 {width} {height}" role="img"
       aria-label="World map of 50 tourism-board cities and their closest-sounding counterparts">
    <path class="sphere" d={path({ type: 'Sphere' })} />
    {#if land}
      <path class="land" d={path(land)} />
    {/if}

    {#each arcs as arc (arc.partner.city)}
      <path class="arc" d={arc.d}>
        <title>{active.city} → {arc.partner.city} ({arc.methods.join(', ')})</title>
      </path>
    {/each}

    {#each cities as c (c.city)}
      {@const p = projection([c.lon, c.lat])}
      {#if p}
        <circle
          cx={p[0]} cy={p[1]}
          r={picks.includes(c.city) ? 6.5 : 4.5}
          class="dot"
          class:gem={c.category === 'hidden'}
          class:faded={faded(c)}
          class:picked={picks.includes(c.city)}
          class:hovered={hoveredCity === c.city}
          class:active={activeCity === c.city}
          role="button"
          tabindex="0"
          aria-label="{c.city}, {c.country}"
          onclick={() => onpickcity(c.city)}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onpickcity(c.city); }
          }}
          onmouseenter={() => onhovercity(c.city)}
          onmouseleave={() => onhovercity(null)}
          onfocus={() => onhovercity(c.city)}
          onblur={() => onhovercity(null)}
        ><title>{c.city}, {c.country} — {c.archetype}</title></circle>
      {/if}
    {/each}

    <!-- Label only the active city, its twins, and anything being pointed at. -->
    {#each cities.filter((c) => activeCity === c.city || hoveredCity === c.city || picks.includes(c.city) || arcs.some((a) => a.partner.city === c.city)) as c (c.city)}
      {@const p = projection([c.lon, c.lat])}
      {#if p}
        <text class="maplabel" x={p[0] + 8} y={p[1] + 3.5}>{c.city}</text>
      {/if}
    {/each}
  </svg>

  {#if active && arcs.length}
    <ul class="arclist">
      {#each arcs as arc (arc.partner.city)}
        <li
          onmouseenter={() => onhovercity(arc.partner.city)}
          onmouseleave={() => onhovercity(null)}
          role="presentation"
        >
          <strong>{arc.partner.city}</strong>
          <span>{arc.methods.join(' + ')}</span>
        </li>
      {/each}
    </ul>
  {/if}
</figure>

<style>
  figure { margin: 0; }
  figcaption { margin-bottom: 8px; }
  figcaption .note { margin-top: 4px; max-width: 62ch; }
  svg { width: 100%; height: auto; }

  .sphere { fill: var(--surface-1); stroke: var(--gridline); stroke-width: 1; }
  .land { fill: var(--land); stroke: none; }

  .arc {
    fill: none;
    stroke: var(--text-primary);
    stroke-width: 1.6;
    stroke-opacity: 0.5;
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
  /* Un-highlighted, not removed: still visible, still clickable. */
  .dot.faded { opacity: 0.2; }
  .dot.picked, .dot.hovered, .dot.active {
    stroke: var(--text-primary);
    stroke-width: 2;
  }
  .dot:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; }

  .maplabel {
    font-size: 10.5px;
    font-weight: 600;
    fill: var(--text-primary);
    paint-order: stroke;
    stroke: var(--surface-1);
    stroke-width: 3;
    pointer-events: none;
  }

  .arclist {
    list-style: none; margin: 10px 0 0; padding: 0;
    display: flex; flex-wrap: wrap; gap: 6px;
  }
  .arclist li {
    font-size: 0.72rem;
    padding: 3px 9px;
    border: 1px solid var(--border);
    border-radius: 999px;
  }
  .arclist span { color: var(--text-muted); margin-left: 5px; }
</style>
