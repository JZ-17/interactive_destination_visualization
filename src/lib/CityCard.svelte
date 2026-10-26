<script>
  /**
   * One city, as a card. The measure currently being sorted on is the card's
   * headline number, with a bar giving it a length the eye can compare down
   * the column; everything else is identity.
   *
   * Colour is category, as everywhere else. Selection is a ring, not a hue.
   */
  let {
    city,
    /** The AXIS_OPTIONS entry we are sorting by. */
    measure,
    /** Largest value across the 50, so bar length means the same on every card. */
    max = 1,
    rank = 0,
    total = 50,
    picked = false,
    hovered = false,
    dimmed = false,
    /** Lead with the city's archetype rather than its measure value. */
    typeFirst = false,
    onhover = () => {},
    onpick = () => {}
  } = $props();

  let value = $derived(measure.get(city));
  let pct = $derived(max > 0 ? Math.min(100, (value / max) * 100) : 0);
  // Obscurity and the share measures read better as 2 dp; rates as 1.
  let decimals = $derived(max <= 1.5 ? 2 : 1);
</script>

<button
  class="card"
  class:gem={city.category === 'hidden'}
  class:picked
  class:hovered
  class:dimmed
  aria-pressed={picked}
  aria-label="{city.city}, {city.country}. {measure.label} {value.toFixed(decimals)}, rank {rank} of {total}."
  onclick={() => onpick(city.city)}
  onmouseenter={() => onhover(city.city)}
  onmouseleave={() => onhover(null)}
  onfocus={() => onhover(city.city)}
  onblur={() => onhover(null)}
>
  {#if typeFirst}
    <p class="type">{city.archetype}</p>
  {/if}

  <header>
    <div class="who">
      <h3>{city.city}</h3>
      <p class="country">{city.country}</p>
    </div>
    <span class="rank">#{rank}</span>
  </header>

  <div class="value">
    <strong>{value.toFixed(decimals)}</strong>
    <span class="unit">{measure.label}</span>
  </div>
  <div class="track"><div class="fill" style="width:{pct}%"></div></div>

  <footer>
    {#if !typeFirst}<span class="chip">{city.archetype}</span>{/if}
    <span class="chip muted">{city.personality}</span>
  </footer>
</button>

<style>
  .card {
    /* Reset the button chrome — this is a card, not a control strip. */
    all: unset;
    box-sizing: border-box;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 7px;
    padding: 11px 12px 10px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    border-left: 3px solid var(--big);
    border-radius: var(--radius);
    position: relative;
    transition: opacity 120ms, transform 140ms ease-out, border-color 120ms,
                box-shadow 140ms ease-out;
  }
  .card.gem { border-left-color: var(--gem); }
  /* Hover grows the card. transform-origin:center keeps it from shoving its
     neighbours around, and the raised z-index stops the grid clipping it. */
  .card:hover, .card.hovered {
    transform: scale(1.045);
    border-color: var(--text-muted);
    box-shadow: 0 6px 18px rgba(25, 30, 59, 0.12);
    z-index: 2;
  }
  .card.picked {
    transform: scale(1.03);
    border-color: var(--text-primary);
    box-shadow: inset 0 0 0 1px var(--text-primary);
    z-index: 2;
  }
  .card.picked:hover, .card.picked.hovered { transform: scale(1.06); }
  .card.dimmed { opacity: 0.3; }
  .card:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; }

  /* Type-led layout: the archetype reads first, the way a personality result
     does. Colour still carries category only, so the type is set in ink. */
  .type {
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
  h3 { font-size: 0.92rem; line-height: 1.2; }
  .country { font-size: 0.7rem; color: var(--text-muted); margin-top: 1px; }
  .rank {
    font-size: 0.68rem;
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .value { display: flex; align-items: baseline; gap: 6px; }
  .value strong { font-size: 1.35rem; font-weight: 650; line-height: 1; font-variant-numeric: tabular-nums; }
  .unit { font-size: 0.66rem; color: var(--text-muted); line-height: 1.2; }

  .track {
    height: 5px;
    border-radius: 3px;
    background: var(--wash);
    overflow: hidden;
  }
  .fill { height: 100%; background: var(--big); border-radius: 3px; }
  .card.gem .fill { background: var(--gem); }

  footer { display: flex; flex-wrap: wrap; gap: 4px; }
  .chip {
    font-size: 0.63rem;
    padding: 2px 6px;
    border: 1px solid var(--border);
    border-radius: 999px;
    color: var(--text-secondary);
    white-space: nowrap;
  }
  .chip.muted { color: var(--text-muted); }
</style>
