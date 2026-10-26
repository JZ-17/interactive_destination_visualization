<script>
  /**
   * Christine's sketch 15: a hub-and-spoke graph of shared vocabulary.
   *
   * The fifty cities sit on a ring. Inside it float the words the most cities
   * share, sized by how many use them. Clicking a word draws a line to every
   * city that wrote it, which is the whole point of the view: you can see at a
   * glance that "cultural" reaches thirty of the fifty, and that the boards
   * calling themselves "unique" are, in fact, twenty-six of them.
   *
   * Layout is deterministic rather than a force simulation: a word sits at the
   * circular mean of the cities that use it, so it drifts toward its own
   * cluster, and its distance from the centre falls as more cities share it.
   * The same input always draws the same picture, which matters for a figure
   * that goes in a report.
   */
  import { WORD_POOLS, wordIndex } from './data.js';
  import { cubicOut } from 'svelte/easing';

  /** Grow a node out of the centre of the graph as it appears. */
  function spawn(node, { delay = 0, duration = 320 } = {}) {
    return {
      delay,
      duration,
      easing: cubicOut,
      css: (t) => `opacity:${t}; transform: scale(${0.35 + 0.65 * t}); transform-origin:${CX}px ${CY}px;`
    };
  }

  let {
    cities = [],
    poolId = 'adjectives',
    selectedWord = null,
    hoveredCity = null,
    picks = [],
    /** How many word hubs to draw. */
    topN = 16,
    onselectword = () => {},
    onhovercity = () => {},
    onpickcity = () => {}
  } = $props();

  const W = 860;
  const H = 620;
  const CX = W / 2;
  const CY = H / 2;
  const RING = 248;

  let pool = $derived(WORD_POOLS.find((p) => p.id === poolId) ?? WORD_POOLS[0]);

  // Cities on the ring, alphabetical so the arrangement is stable and findable.
  let ring = $derived.by(() => {
    const sorted = [...cities].sort((a, b) => a.city.localeCompare(b.city));
    return sorted.map((c, i) => {
      const angle = (i / sorted.length) * Math.PI * 2 - Math.PI / 2;
      return {
        city: c,
        angle,
        x: CX + Math.cos(angle) * RING,
        y: CY + Math.sin(angle) * RING
      };
    });
  });

  let angleOf = $derived(new Map(ring.map((n) => [n.city.city, n.angle])));

  let hubs = $derived.by(() => {
    const index = wordIndex(cities, pool);
    const onRing = new Set(cities.map((c) => c.city));

    const ranked = [...index.entries()]
      .map(([word, used]) => ({ word, used: used.filter((n) => onRing.has(n)) }))
      .filter((d) => d.used.length >= 2)
      .sort((a, b) => b.used.length - a.used.length || a.word.localeCompare(b.word))
      .slice(0, topN);
    if (!ranked.length) return [];

    const max = ranked[0].used.length;
    const placed = [];
    for (const d of ranked) {
      // Circular mean of its cities, so the word drifts toward its own cluster.
      let sx = 0, sy = 0;
      for (const name of d.used) {
        const a = angleOf.get(name);
        sx += Math.cos(a);
        sy += Math.sin(a);
      }
      const angle = Math.atan2(sy, sx);
      const share = d.used.length / max;
      const r = Math.max(6, Math.sqrt(d.used.length) * 7.5);
      // The more cities share it, the closer to the middle it sits.
      let dist = RING * (0.68 - 0.42 * share);

      // Nudge outward until it clears the hubs already placed. Deterministic,
      // so the same data always lays out the same way.
      for (let guard = 0; guard < 60; guard++) {
        const x = CX + Math.cos(angle) * dist;
        const y = CY + Math.sin(angle) * dist;
        const clash = placed.find(
          (q) => Math.hypot(q.x - x, q.y - y) < q.r + r + 26
        );
        if (!clash) break;
        dist += 14;
      }
      placed.push({
        word: d.word,
        used: d.used,
        count: d.used.length,
        r,
        x: CX + Math.cos(angle) * dist,
        y: CY + Math.sin(angle) * dist
      });
    }
    return placed;
  });

  let active = $derived(hubs.find((h) => h.word === selectedWord) ?? null);

  let byName = $derived(new Map(cities.map((c) => [c.city, c])));

  /**
   * When a word is chosen, only its cities are drawn — and they are spaced
   * evenly around the whole ring rather than left in their fifty-city slots.
   * With all fifty on screen the names collided badly; a subset given the
   * full circumference never does.
   */
  let spokeCities = $derived.by(() => {
    if (!active) return [];
    const used = active.used
      .map((n) => byName.get(n))
      .filter(Boolean)
      .sort((a, b) => a.city.localeCompare(b.city));
    return used.map((c, i) => {
      const angle = (i / used.length) * Math.PI * 2 - Math.PI / 2;
      return {
        city: c,
        angle,
        x: CX + Math.cos(angle) * RING,
        y: CY + Math.sin(angle) * RING
      };
    });
  });
</script>

<figure>
  <figcaption>
    <h2>The words they share</h2>
    <p class="note">
      Every city on the ring; the words most of them reach for in the middle,
      sized by how many use each one. <strong>Click a word</strong> to see
      exactly which cities wrote it.
    </p>
    <div class="pools" role="group" aria-label="Word pool">
      {#each WORD_POOLS as p}
        <button
          aria-pressed={p.id === poolId}
          onclick={() => onselectword({ pool: p.id, word: null })}
        >{p.label}</button>
      {/each}
    </div>
  </figcaption>

  <svg viewBox="0 0 {W} {H}" role="img"
       aria-label="Shared {pool.label.toLowerCase()} across {cities.length} cities">
    <circle cx={CX} cy={CY} r={RING} class="ring" class:live={!!active} />

    {#if active}
      <!-- Only this word's cities, spaced evenly around the whole ring, each
           one growing out of the middle as it arrives. -->
      {#each spokeCities as n, i (n.city.city)}
        <g in:spawn={{ delay: i * 14 }}>
          <line class="spoke" x1={CX} y1={CY} x2={n.x} y2={n.y} />
        </g>
      {/each}

      {#each spokeCities as n, i (n.city.city)}
        <g
          class="citynode"
          in:spawn={{ delay: 60 + i * 14 }}
          role="button"
          tabindex="0"
          aria-label="{n.city.city}, uses {active.word}"
          onclick={() => onpickcity(n.city.city)}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onpickcity(n.city.city); }
          }}
          onmouseenter={() => onhovercity(n.city.city)}
          onmouseleave={() => onhovercity(null)}
          onfocus={() => onhovercity(n.city.city)}
          onblur={() => onhovercity(null)}
        >
          <!-- A 6px dot is too small to hit; this invisible disc gives the
               city a real target without changing how it looks. -->
          <circle class="hit" cx={n.x} cy={n.y} r="14" />
          <circle
            cx={n.x} cy={n.y}
            r={picks.includes(n.city.city) ? 8 : 6}
            class="citydot"
            class:gem={n.city.category === 'hidden'}
            class:picked={picks.includes(n.city.city)}
            class:hovered={hoveredCity === n.city.city}
            style={n.city.hue !== undefined ? `--dot-city: hsl(${n.city.hue} 62% 52%);` : undefined}
          ><title>{n.city.city}, {n.city.country}</title></circle>
          <text
            class="cityname lit"
            x={n.x + Math.cos(n.angle) * 14}
            y={n.y + Math.sin(n.angle) * 14}
            text-anchor={Math.cos(n.angle) < -0.1 ? 'end' : Math.cos(n.angle) > 0.1 ? 'start' : 'middle'}
            dominant-baseline="middle"
          >{n.city.city}</text>
        </g>
      {/each}
    {/if}

    <!-- word hubs -->
    {#each active ? [active] : hubs as h (h.word)}
      {@const on = selectedWord === h.word}
      {@const hx = on ? CX : h.x}
      {@const hy = on ? CY : h.y}
      {@const hr = on ? Math.max(h.r, 52) : h.r}
      <g
        class="hub"
        class:on
        role="button"
        tabindex="0"
        aria-pressed={on}
        aria-label="{h.word}, used by {h.count} of {cities.length} cities"
        onclick={() => onselectword({ pool: poolId, word: on ? null : h.word })}
        onkeydown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onselectword({ pool: poolId, word: on ? null : h.word });
          }
        }}
      >
        <circle cx={hx} cy={hy} r={hr} class="hubdot" />
        <text class="hubword" x={hx} y={hy} text-anchor="middle" dominant-baseline="middle">
          {h.word}
        </text>
        <text class="hubcount" x={hx} y={hy + hr + 11} text-anchor="middle">
          {h.count} of {cities.length}
        </text>
      </g>
    {/each}
  </svg>

  <p class="note readout" aria-live="polite">
    {#if active}
      <strong>{active.word}</strong> — written by {active.count} of {cities.length}
      cities: {active.used.slice(0, 8).join(', ')}{active.used.length > 8
        ? ` and ${active.used.length - 8} more`
        : ''}.
    {:else}
      Showing the {hubs.length} most widely shared {pool.label.toLowerCase()}.
      The number under each is how many of the {cities.length} cities use it —
      click one to bring those cities in.
    {/if}
  </p>
</figure>

<style>
  figure { margin: 0; }
  figcaption .note { margin-top: 4px; max-width: 66ch; }
  .pools { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
  svg { width: 100%; height: auto; display: block; margin-top: 4px; }

  .ring { fill: none; stroke: var(--gridline); stroke-width: 1; opacity: 0.45; transition: opacity 240ms; }
  .ring.live { opacity: 1; }

  .spoke {
    stroke: var(--text-primary);
    stroke-opacity: 0.3;
    stroke-width: 1.1;
    pointer-events: none;
  }

  .citynode { cursor: pointer; }
  .hit { fill: transparent; }
  .citydot {
    fill: var(--dot-city, var(--big));
    stroke: var(--surface-1);
    stroke-width: 1.5;
    transition: r 120ms;
  }
  .citydot.picked, .citydot.hovered { stroke: var(--text-primary); stroke-width: 2.2; }
  .cityname {
    font-size: 9.5px;
    fill: var(--text-muted);
    /* The name is a natural thing to aim at, so let it take the click too. */
    pointer-events: auto;
  }
  .cityname.lit { fill: var(--text-primary); font-weight: 650; }
  .citynode:hover .cityname { fill: var(--text-primary); }
  /* The default focus box draws a rectangle around a round node; ring the
     node itself instead. */
  .citynode:focus { outline: none; }
  .citynode:focus-visible .citydot { stroke: var(--text-primary); stroke-width: 2.5; }

  .hub { cursor: pointer; }
  .hubdot {
    fill: var(--wash);
    stroke: var(--axis);
    stroke-width: 1.2;
    transition: fill 120ms, stroke 120ms;
  }
  .hub:hover .hubdot { stroke: var(--text-primary); }
  .hub:focus { outline: none; }
  .hub:focus-visible .hubdot { stroke: var(--text-primary); stroke-width: 2.5; }
  .hub.on .hubdot { fill: var(--big-soft); stroke: var(--big); stroke-width: 2.5; }
  .hub .hubdot, .hub .hubword, .hub .hubcount {
    transition: cx 320ms cubic-bezier(.2,.7,.3,1), cy 320ms cubic-bezier(.2,.7,.3,1),
                r 320ms cubic-bezier(.2,.7,.3,1), x 320ms cubic-bezier(.2,.7,.3,1),
                y 320ms cubic-bezier(.2,.7,.3,1), font-size 240ms;
  }
  @media (prefers-reduced-motion: reduce) {
    .hub .hubdot, .hub .hubword, .hub .hubcount { transition: none; }
  }
  .hub.on .hubword { font-size: 15px; }
  .hubword {
    font-size: 11px;
    font-weight: 650;
    fill: var(--text-primary);
    pointer-events: none;
  }
  .hubcount {
    font-size: 9px;
    fill: var(--text-muted);
    pointer-events: none;
    font-variant-numeric: tabular-nums;
  }
  .readout { margin-top: 8px; max-width: 80ch; min-height: 2.4em; }
</style>
