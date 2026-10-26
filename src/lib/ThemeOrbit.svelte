<script>
  /**
   * Josh's metro-map sketch, adapted.
   *
   * Ten spokes, one per theme. A city sits on the spoke of the theme it
   * over-indexes on, and its distance from the centre is how hard it pushes
   * that theme — mentions per 1,000 words. So the question "which cities are
   * selling the same thing, and who is loudest about it?" is one glance.
   *
   * The sketch coloured the lines by theme. Ten hues is more than any
   * categorical palette carries safely, and colour here already means city
   * category, so theme moves to the ANGLE and is labelled at the rim. Colour
   * stays the city's own hue, and region becomes the marker's SHAPE — the
   * sketch's third channel, kept.
   */
  import { scaleSqrt } from 'd3-scale';
  import { symbol, symbolCircle, symbolSquare, symbolTriangle, symbolDiamond,
           symbolStar, symbolCross, symbolWye } from 'd3-shape';
  import { THEMES } from './data.js';

  let {
    cities = [],
    hoveredCity = null,
    picks = [],
    onhovercity = () => {},
    onpickcity = () => {}
  } = $props();

  const W = 820;
  const H = 720;
  const CX = W / 2;
  const CY = H / 2 + 6;
  const R_MAX = 268;
  const R_MIN = 34;

  /** One symbol per world region — the sketch's "shape is the continent". */
  const REGION_SHAPE = {
    'Europe': symbolCircle,
    'Asia': symbolSquare,
    'North America': symbolTriangle,
    'South America': symbolDiamond,
    'Africa': symbolStar,
    'Oceania': symbolCross,
    'Middle East': symbolWye
  };
  let regions = $derived(
    [...new Set(cities.map((c) => c.region))].sort((a, b) => a.localeCompare(b))
  );

  /** How hard a city pushes the theme it over-indexes on. */
  const push = (c) => c.themes[c.dominantTheme] ?? 0;

  let maxPush = $derived(Math.max(1, ...cities.map(push)));
  /* Square-root, not linear: one city sits at 111 mentions per 1,000 words
     and most sit under 30, so a linear radius pinned almost everyone to the
     middle. The rings carry the numbers, so the scale stays readable. */
  let r = $derived(scaleSqrt().domain([0, maxPush]).range([R_MIN, R_MAX]).nice());
  let ticks = $derived(r.ticks(4).filter((t) => t > 0));

  let angleOf = $derived(
    new Map(THEMES.map((t, i) => [t, (i / THEMES.length) * Math.PI * 2 - Math.PI / 2]))
  );

  /**
   * Cities grouped onto their theme's spoke. Several cities on one spoke at a
   * similar rate would sit on top of each other, so they fan out slightly by
   * angle — the radius, which carries the number, is left untouched.
   */
  let placed = $derived.by(() => {
    const out = [];
    for (const theme of THEMES) {
      const onSpoke = cities
        .filter((c) => c.dominantTheme === theme)
        .sort((a, b) => push(b) - push(a));
      const base = angleOf.get(theme);
      onSpoke.forEach((c, i) => {
        const spread = Math.min(0.26, 0.075 * (onSpoke.length - 1));
        const a = base + (onSpoke.length > 1 ? (i / (onSpoke.length - 1) - 0.5) * spread * 2 : 0);
        const rad = r(push(c));
        out.push({
          city: c,
          theme,
          value: push(c),
          x: CX + Math.cos(a) * rad,
          y: CY + Math.sin(a) * rad
        });
      });
    }
    return out;
  });

  const shapeFor = (c, size) =>
    symbol(REGION_SHAPE[c.region] ?? symbolCircle, size)();

  let legendShapes = $derived(
    regions.map((rg) => ({ region: rg, d: symbol(REGION_SHAPE[rg] ?? symbolCircle, 70)() }))
  );
</script>

<figure>
  <figcaption>
    <h2>How hard each city pushes its theme</h2>
    <p class="note">
      Every city sits on the spoke of the theme it over-indexes on, and the
      further out it sits, the more it says it. Cities sharing a spoke are
      selling the same thing — the distance tells you who is loudest.
      Shape is the city's world region.
    </p>
  </figcaption>

  <svg viewBox="0 0 {W} {H}" role="img"
       aria-label="Cities arranged by the theme they over-index on and how often they mention it">
    <!-- rate rings -->
    {#each ticks as t}
      <circle cx={CX} cy={CY} r={r(t)} class="rring" />
      <text class="rlabel" x={CX} y={CY - r(t) - 3} text-anchor="middle">{t}</text>
    {/each}

    <!-- theme spokes -->
    {#each THEMES as theme}
      {@const a = angleOf.get(theme)}
      {@const lx = CX + Math.cos(a) * (R_MAX + 16)}
      {@const ly = CY + Math.sin(a) * (R_MAX + 16)}
      <line
        class="spoke"
        x1={CX + Math.cos(a) * R_MIN} y1={CY + Math.sin(a) * R_MIN}
        x2={CX + Math.cos(a) * R_MAX} y2={CY + Math.sin(a) * R_MAX}
      />
      <text
        class="themelabel"
        x={lx} y={ly}
        text-anchor={Math.cos(a) < -0.2 ? 'end' : Math.cos(a) > 0.2 ? 'start' : 'middle'}
        dominant-baseline={Math.sin(a) < -0.5 ? 'auto' : Math.sin(a) > 0.5 ? 'hanging' : 'middle'}
      >{theme}</text>
    {/each}

    <circle cx={CX} cy={CY} r="3" class="hubdot" />

    {#each placed as d (d.city.city)}
      {@const on = picks.includes(d.city.city)}
      {@const hot = hoveredCity === d.city.city}
      <g
        class="mark"
        class:picked={on}
        class:hovered={hot}
        transform="translate({d.x},{d.y})"
        role="button"
        tabindex="0"
        aria-label="{d.city.city}: {d.theme} {d.value.toFixed(1)} mentions per 1,000 words"
        onclick={() => onpickcity(d.city.city)}
        onkeydown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onpickcity(d.city.city); }
        }}
        onmouseenter={() => onhovercity(d.city.city)}
        onmouseleave={() => onhovercity(null)}
        onfocus={() => onhovercity(d.city.city)}
        onblur={() => onhovercity(null)}
      >
        <!-- 9px, not 13: cities bunched on one spoke had overlapping discs,
             so a click landed on a neighbour rather than the mark aimed at. -->
        <circle class="hit" r="9" />
        <path
          class="sym"
          class:gem={d.city.category === 'hidden'}
          d={shapeFor(d.city, on || hot ? 150 : 86)}
          style={d.city.hue !== undefined ? `--dot-city: hsl(${d.city.hue} 62% 52%);` : undefined}
        ><title>{d.city.city}, {d.city.country} — {d.theme} {d.value.toFixed(1)} per 1,000 words</title></path>
        {#if on || hot}
          <text class="marklabel" x="12" y="4">{d.city.city}</text>
        {/if}
      </g>
    {/each}
  </svg>

  <div class="legend">
    <span class="eyebrow">Region</span>
    {#each legendShapes as l}
      <span class="item">
        <svg viewBox="-10 -10 20 20" width="13" height="13" aria-hidden="true">
          <path class="sym legendsym" d={l.d} />
        </svg>
        {l.region}
      </span>
    {/each}
    <span class="note scalehint">Rings are mentions per 1,000 words.</span>
  </div>
</figure>

<style>
  figure { margin: 0; }
  figcaption .note { margin-top: 4px; max-width: 70ch; }
  svg { width: 100%; height: auto; display: block; }

  .rring { fill: none; stroke: var(--gridline); stroke-width: 1; }
  .rlabel { font-size: 9px; fill: var(--text-muted); font-variant-numeric: tabular-nums; }
  .spoke { stroke: var(--gridline); stroke-width: 1; }
  .themelabel { font-size: 10.5px; font-weight: 600; fill: var(--text-secondary); }
  .hubdot { fill: var(--text-muted); }

  .mark { cursor: pointer; }
  .hit { fill: transparent; }
  .sym {
    fill: var(--dot-city, var(--big));
    stroke: var(--surface-1);
    stroke-width: 1.4;
    transition: d 140ms;
  }
  .mark.picked .sym, .mark.hovered .sym { stroke: var(--text-primary); stroke-width: 2; }
  .mark:focus { outline: none; }
  .mark:focus-visible .sym { stroke: var(--text-primary); stroke-width: 2.4; }
  .marklabel {
    font-size: 11px; font-weight: 650; fill: var(--text-primary);
    paint-order: stroke; stroke: var(--surface-1); stroke-width: 3.5;
    pointer-events: none;
  }
  .legendsym { fill: var(--text-secondary); stroke: none; }

  .legend {
    display: flex; align-items: center; flex-wrap: wrap; gap: 6px 14px;
    margin-top: 10px; font-size: 0.72rem; color: var(--text-secondary);
  }
  .item { display: inline-flex; align-items: center; gap: 5px; }
  .scalehint { margin-left: auto; }
</style>
