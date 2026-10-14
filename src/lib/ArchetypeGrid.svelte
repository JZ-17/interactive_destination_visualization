<script>
  /**
   * Cities grouped into the label they were assigned — either Archetype (what
   * a city talks about) or Personality (how it sells itself). One dot per city.
   *
   * Position carries the group (10 levels, far too many for hue); colour
   * carries category and nothing else.
   *
   * Clicking a row selects that group. Clicking a dot picks that city.
   * Hovering a dot reports it so other views can highlight (linking).
   */
  import { group } from 'd3-array';
  import { scaleBand } from 'd3-scale';

  let {
    cities = [],
    groupBy = 'archetype',
    selectedGroup = null,
    hoveredCity = null,
    picks = [],
    /** Names to render dimmed because another view filtered them out. */
    dimmed = null,
    onselectgroup = () => {},
    onhovercity = () => {},
    onpickcity = () => {}
  } = $props();

  const DOT = 6;
  const GAP = 15;
  const margin = { top: 10, right: 14, bottom: 10, left: 142 };

  // Biggest groups first, so the shape of the corpus reads top-down.
  let groups = $derived(
    [...group(cities, (c) => c[groupBy])]
      .map(([name, members]) => ({
        name,
        members: [...members].sort((a, b) => a.city.localeCompare(b.city))
      }))
      .sort((a, b) => b.members.length - a.members.length || a.name.localeCompare(b.name))
  );

  let height = $derived(groups.length * 30 + margin.top + margin.bottom);
  let y = $derived(
    scaleBand()
      .domain(groups.map((g) => g.name))
      .range([margin.top, height - margin.bottom])
      .paddingInner(0.25)
  );
  let width = $derived(
    margin.left + margin.right + GAP * Math.max(1, ...groups.map((g) => g.members.length))
  );

  function isDimmed(c) {
    if (dimmed && !dimmed.has(c.city)) return true;
    if (selectedGroup && c[groupBy] !== selectedGroup) return true;
    return false;
  }
</script>

<figure>
  <figcaption>
    <h2>{groupBy === 'archetype' ? 'What each city talks about' : 'How each city sells itself'}</h2>
    <p class="note">
      {#if groupBy === 'archetype'}
        Its <strong>archetype</strong> — the theme it mentions furthest above the
        corpus average, among themes clearing 9 mentions per 1,000 words. Not the
        theme it mentions most: food leads almost everywhere.
      {:else}
        Its <strong>personality</strong> — the rhetorical move it over-uses, from
        the tagged vocabulary rates. <em>The Understated</em> means no move scored
        above 0.5 sd: that city is not leaning on anything.
      {/if}
    </p>
  </figcaption>

  <svg {width} {height} role="img"
       aria-label="{cities.length} cities grouped by {groupBy}">
    {#each groups as g (g.name)}
      {@const rowY = y(g.name) + y.bandwidth() / 2}
      <g
        class="row"
        class:selected={selectedGroup === g.name}
        role="button"
        tabindex="0"
        aria-pressed={selectedGroup === g.name}
        onclick={() => onselectgroup(selectedGroup === g.name ? null : g.name)}
        onkeydown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onselectgroup(selectedGroup === g.name ? null : g.name);
          }
        }}
      >
        <rect
          x="4" y={y(g.name)} width={width - 8} height={y.bandwidth()}
          rx="5" class="rowhit"
        />
        <text class="label" x={margin.left - 12} y={rowY} text-anchor="end" dominant-baseline="middle">
          {g.name}
        </text>
        <text class="count" x={margin.left - 12} y={rowY + 12} text-anchor="end" dominant-baseline="middle">
          {g.members.length} {g.members.length === 1 ? 'city' : 'cities'}
        </text>

        {#each g.members as c, i (c.city)}
          <circle
            cx={margin.left + GAP * i + DOT}
            cy={rowY}
            r={picks.includes(c.city) ? DOT + 1.5 : DOT}
            class="dot"
            class:gem={c.category === 'hidden'}
            class:dim={isDimmed(c)}
            class:picked={picks.includes(c.city)}
            class:hovered={hoveredCity === c.city}
            role="button"
            tabindex="0"
            aria-label="{c.city}, {c.country}"
            onclick={(e) => { e.stopPropagation(); onpickcity(c.city); }}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault(); e.stopPropagation(); onpickcity(c.city);
              }
            }}
            onmouseenter={() => onhovercity(c.city)}
            onmouseleave={() => onhovercity(null)}
            onfocus={() => onhovercity(c.city)}
            onblur={() => onhovercity(null)}
          ><title>{c.city}, {c.country} — {c[groupBy]}</title></circle>
        {/each}
      </g>
    {/each}
  </svg>
</figure>

<style>
  figure { margin: 0; }
  figcaption { margin-bottom: 10px; }
  figcaption .note { margin-top: 4px; max-width: 46ch; }
  svg { max-width: 100%; height: auto; overflow: visible; }

  .rowhit { fill: transparent; }
  .row { cursor: pointer; }
  .row:hover .rowhit { fill: var(--wash); }
  .row.selected .rowhit { fill: var(--wash); }
  .row:focus-visible { outline: none; }
  .row:focus-visible .rowhit { stroke: var(--text-primary); stroke-width: 1.5; }

  .label {
    font-size: 11.5px;
    font-weight: 600;
    fill: var(--text-primary);
  }
  .row.selected .label { fill: var(--text-primary); }
  .count { font-size: 9.5px; fill: var(--text-muted); }

  .dot {
    fill: var(--big);
    cursor: pointer;
    transition: opacity 120ms, r 120ms;
  }
  .dot.gem { fill: var(--gem); }
  .dot.dim { opacity: 0.18; }
  /* Selection and hover are a ring, never a new hue. */
  .dot.picked { stroke: var(--text-primary); stroke-width: 2; }
  .dot.hovered { stroke: var(--text-primary); stroke-width: 2; }
  .dot:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; }
</style>
