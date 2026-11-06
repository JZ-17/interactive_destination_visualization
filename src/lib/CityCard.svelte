<script>
  import { hsl } from 'd3-color';
  import { VOICE_BLURB, VOICE_SHORT, IATA } from './data.js';

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
    /** Compact horizontal row, for a single-column list. */
    dense = false,
    /** Portrait, playing-card proportions. */
    portrait = false,
    /** Allow the card to be dragged into a comparison slot. */
    draggable = false,
    /** Tint the card with the city's own hue; category moves to the border. */
    cityColor = false,
    /** A short label hung off the card's top edge, like a luggage tag. */
    tag = null,
    /** A solid colour for this card: the reader's own cities wear their ticket. */
    spot = null,
    /** Portrait only: print the selling style in words, not just on hover. */
    showVoice = false,
    /** A small boarding pass: coloured top with the code, perforation, white stub. */
    ticket = false,
    onhover = () => {},
    onpick = () => {}
  } = $props();

  let value = $derived(measure.get(city));
  let pct = $derived(max > 0 ? Math.min(100, (value / max) * 100) : 0);
  // Obscurity and the share measures read better as 2 dp; rates as 1.
  let decimals = $derived(max <= 1.5 ? 2 : 1);

  /**
   * The ticket's top in the city's own hue, darkened only as far as white type
   * needs for 5:1. Low saturation, so the deck sits in the same muted range as
   * the boarding pass without borrowing its colours, which stay the reader's.
   */
  const lum = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  function panelFor(h) {
    for (let l = 0.46; l > 0.2; l -= 0.01) {
      const c = hsl(h, 0.34, l).rgb();
      const L = 0.2126 * lum(c.r) + 0.7152 * lum(c.g) + 0.0722 * lum(c.b);
      if (1.05 / (L + 0.05) >= 5) return c.formatHex();
    }
    return '#3d4466';
  }
  let panel = $derived(ticket ? (spot ?? panelFor(city.hue)) : null);
</script>

<!-- A div rather than a <button>: Chrome will not start a native drag from a
     form control, so draggable="true" on a button fires no dragstart at all.
     role/tabindex/keydown restore the button behaviour. -->
<div
  {draggable}
  ondragstart={(e) => {
    e.dataTransfer.setData('text/plain', city.city);
    e.dataTransfer.effectAllowed = 'move';
  }}
  style="{cityColor ? `--city-h: ${city.hue};` : ''}{spot ? `--spot: ${spot};` : ''}"
  class="card"
  class:city-color={cityColor}
  class:dense
  class:portrait
  class:draggable
  class:gem={city.category === 'hidden'}
  class:picked
  class:spot={!!spot && !ticket}
  class:ticket
  class:hovered
  class:dimmed
  role="button"
  tabindex="0"
  aria-pressed={picked}
  aria-label="{city.city}, {city.country}. {measure.label} {value.toFixed(decimals)}, rank {rank} of {total}."
  onclick={() => onpick(city.city)}
  onkeydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onpick(city.city); }
  }}
  onmouseenter={() => onhover(city.city)}
  onmouseleave={() => onhover(null)}
  onfocus={() => onhover(city.city)}
  onblur={() => onhover(null)}
>
{#if tag}<span class="tag">{tag}</span>{/if}
{#if ticket}
  <div class="tk-top" style="background:{panel}">
    <div class="tk-head">
      <span class="tk-type">{city.archetype}</span>
      <span class="tk-rank">#{rank}</span>
    </div>
    <strong class="tk-code">{IATA[city.city] ?? ''}</strong>
    <span class="tk-city">{city.city}</span>
    <span class="tk-country">{city.country}</span>
  </div>
  <div class="tk-perf" aria-hidden="true"></div>
  <div class="tk-stub">
    <div class="value">
      <strong>{value.toFixed(decimals)}</strong>
      <span class="unit">{measure.label}</span>
    </div>
    <div class="track"><div class="fill" style="width:{pct}%{spot ? `; background:${spot}` : ''}"></div></div>
    <span class="chip muted" title="{city.personality} — {VOICE_BLURB[city.personality] ?? ''}">{city.personality}</span>
    {#if showVoice}<p class="voice">{VOICE_SHORT[city.personality] ?? ''}</p>{/if}
  </div>
{:else if portrait}
  <p class="type">{city.archetype}</p>
  <div class="face">
    <h3>{city.city}</h3>
    <p class="country">{city.country}</p>
  </div>
  <div class="value">
    <strong>{value.toFixed(decimals)}</strong>
    <span class="unit">{measure.label}</span>
  </div>
  <div class="track"><div class="fill" style="width:{pct}%"></div></div>
  <footer class="pfoot">
    <span class="chip muted" title="{city.personality} — {VOICE_BLURB[city.personality] ?? ''}">{city.personality}</span>
    <span class="rank">#{rank}</span>
  </footer>
  {#if showVoice}<p class="voice">{VOICE_SHORT[city.personality] ?? ''}</p>{/if}
{:else if dense}
  <div class="row">
    <div class="ident">
      <p class="type" title="{city.archetype} — over-indexes on {city.dominantTheme}">{city.archetype}</p>
      <h3>{city.city}<span class="country">{city.country}</span></h3>
    </div>
    <div class="metric">
      <strong>{value.toFixed(decimals)}</strong>
      <span class="rank">#{rank}</span>
    </div>
  </div>
  <div class="track"><div class="fill" style="width:{pct}%"></div></div>
{:else}
  {#if typeFirst}
    <p class="type" title="{city.archetype} — over-indexes on {city.dominantTheme}">{city.archetype}</p>
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
    {#if !typeFirst}
      <span class="chip" title="{city.archetype} — over-indexes on {city.dominantTheme}">{city.archetype}</span>
    {/if}
    <span class="chip muted" title="{city.personality} — {VOICE_BLURB[city.personality] ?? ''}">{city.personality}</span>
  </footer>
{/if}
</div>

<style>
  .card {
    box-sizing: border-box;
    text-align: left;
    /* So the card can size its own type against its own width. */
    container-type: inline-size;
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

  /* Identity tint: every city gets its own hue for its wash and its bar, and
     the category moves to a translucent border all the way round. The hue says
     "a different city", nothing more — there is no legend for it. */
  .card.city-color {
    /* Saturation and lightness come from the theme, so a dark skin can
       re-light the same hue instead of carrying a second palette. */
    --city: hsl(var(--city-h) var(--city-s, 58%) var(--city-l, 47%));
    --city-wash: hsl(var(--city-h) var(--city-ws, 62%) var(--city-wl, 97%));
    border: 2px solid var(--cat-border, rgba(22, 104, 227, 0.45));
    background: var(--city-wash);
  }
  .card.city-color.gem { border-color: var(--cat-border-gem, rgba(199, 122, 0, 0.5)); }
  /* .gem .fill sets the category colour at equal specificity and earlier in
     the file, so the gem selector is repeated here to win on specificity
     rather than order. Without it all 25 gems shared one bar colour. */
  .card.city-color .fill,
  .card.city-color.gem .fill { background: var(--city); }
  .card.city-color .track { background: var(--track-bg, rgba(0, 0, 0, 0.06)); }
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

  /* Narrow default cards: drop to the essentials rather than wrapping into a
     mess. The archetype stays; the personality is the first thing cut. */
  @container (max-width: 150px) {
    .card:not(.portrait):not(.dense) { padding: 9px 9px 8px; gap: 6px; }
    .card:not(.portrait):not(.dense) h3 { font-size: 0.78rem; line-height: 1.15; }
    .card:not(.portrait):not(.dense) .country { font-size: 0.58rem; }
    .card:not(.portrait):not(.dense) .rank { font-size: 0.58rem; }
    .card:not(.portrait):not(.dense) .value strong { font-size: 1.02rem; }
    .card:not(.portrait):not(.dense) .unit { font-size: 0.53rem; }
    .card:not(.portrait):not(.dense) .chip { font-size: 0.52rem; padding: 1px 5px; }
    .card:not(.portrait):not(.dense) .chip.muted { display: none; }
  }

  /* The card's own colours all read from these, so re-pointing them turns the
     whole card over to white on the ticket's colour. */
  .card.spot {
    --text-primary: #fff;
    --text-secondary: rgba(255, 255, 255, 0.92);
    --text-muted: rgba(255, 255, 255, 0.88);
    --border: rgba(255, 255, 255, 0.5);
    --city: #fff;
    --track-bg: rgba(255, 255, 255, 0.28);
    background: var(--spot);
    color: #fff;
    box-shadow: 0 10px 24px rgba(25, 30, 59, 0.3);
  }
  .card.spot.picked { box-shadow: 0 10px 24px rgba(25, 30, 59, 0.3); border-color: #191e3b; }
  .card.spot .tag { background: #191e3b; color: #fff; }
  .tag {
    position: absolute;
    top: -9px;
    right: 10px;
    padding: 1px 8px 2px;
    border-radius: 999px;
    background: var(--text-primary);
    color: var(--surface-1);
    font-size: 0.64rem;
    font-weight: 650;
    white-space: nowrap;
  }
  .voice {
    margin-top: 5px;
    min-height: 2.6em; /* room for two lines, so every card's rule stays level */
    font-size: 0.68rem;
    line-height: 1.3;
    color: var(--text-secondary);
  }

  /* Portrait: playing-card proportions, read top to bottom. The card sizes
     its own type against its width, so the same component works as a small
     deck card and as a larger one sitting in a drop slot. */
  .card.portrait {
    aspect-ratio: 5 / 7;
    gap: 0;
    padding: 10px 11px 9px;
    justify-content: space-between;
    container-type: inline-size;
  }

  @container (max-width: 140px) {
    .card.portrait { padding: 7px 8px 6px; }
    .card.portrait .type { font-size: 0.5rem; letter-spacing: 0.05em; }
    .card.portrait h3 { font-size: 0.78rem; }
    .card.portrait .country { font-size: 0.58rem; }
    .card.portrait .value strong { font-size: 1.02rem; }
    .card.portrait .unit { font-size: 0.54rem; }
    .card.portrait .rank { font-size: 0.58rem; }
    /* No room for the personality at this size; the archetype is the headline. */
    .card.portrait .chip { display: none; }
    .pfoot { justify-content: flex-end; margin-top: 5px; }
  }
  .card.portrait .type {
    font-size: 0.57rem;
    line-height: 1.25;
    letter-spacing: 0.08em;
  }
  .card.portrait .face { margin-top: 2px; }
  .card.portrait h3 {
    font-size: 0.95rem; line-height: 1.15;
    overflow-wrap: anywhere;
  }
  .card.portrait .country { font-size: 0.65rem; margin-top: 2px; }
  .card.portrait .value { margin-top: auto; align-items: baseline; }
  .card.portrait .value strong { font-size: 1.3rem; }
  .card.portrait .unit { font-size: 0.6rem; }
  .card.portrait .track { margin-top: 5px; }
  .pfoot {
    display: flex; align-items: center; justify-content: space-between;
    gap: 6px; margin-top: 7px;
  }
  .card.portrait .chip {
    font-size: 0.58rem; padding: 2px 5px;
    max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  /* Ticket: the boarding pass in miniature, lying the same way as the big one.
     Coloured panel on the left in the city's hue (or the reader's ticket
     colour) with the code the way the pass prints it, a perforation with a
     notch top and bottom, then a white stub on the right with the number.
     Category stays where the dot strip puts it, in the outline. */
  .card.ticket {
    flex-direction: row;
    aspect-ratio: auto;
    gap: 0;
    padding: 0;
    min-height: 100%;
    background: #fff;
    border: 2px solid rgba(22, 104, 227, 0.55);
    border-radius: 12px;
    box-shadow: 0 6px 16px rgba(25, 30, 59, 0.07);
    font-family: var(--display);
  }
  .card.ticket.gem { border-color: rgba(199, 122, 0, 0.6); }
  /* The tag hangs over the coloured panel, clear of the top notch, and above
     it: on the right it ran across the perforation and the notch bit into
     its first letters. */
  .card.ticket .tag { left: 12px; right: auto; z-index: 3; }
  .card.ticket.picked { border-color: var(--text-primary); box-shadow: 0 0 0 1px var(--text-primary), 0 10px 22px rgba(25, 30, 59, 0.16); }
  .card.ticket:hover, .card.ticket.hovered { border-color: var(--text-muted); }
  .card.ticket.picked:hover, .card.ticket.picked.hovered { border-color: var(--text-primary); }
  .tk-top {
    flex: 1 1 56%;
    min-width: 0;
    display: flex;
    flex-direction: column;
    padding: 10px 12px 11px;
    border-radius: 10px 0 0 10px;
    color: #fff;
    -webkit-font-smoothing: antialiased;
  }
  .tk-head { display: flex; justify-content: space-between; align-items: baseline; gap: 6px; margin-bottom: auto; padding-bottom: 10px; }
  .tk-type { font-size: 0.58rem; letter-spacing: 0.07em; text-transform: uppercase; opacity: 0.92; }
  .tk-rank { font-size: 0.72rem; font-variant-numeric: tabular-nums; }
  .tk-code { font-size: 1.85rem; font-weight: 400; line-height: 1; letter-spacing: 0.01em; }
  .tk-city { margin-top: 5px; font-size: 0.72rem; letter-spacing: 0.04em; text-transform: uppercase; overflow-wrap: anywhere; }
  .tk-country { font-size: 0.56rem; letter-spacing: 0.05em; text-transform: uppercase; opacity: 0.85; }
  /* The tear line, upright, with a half-circle bitten out of the top and
     bottom edges. Each notch is a page-coloured circle in the outline's
     colour, centred on the outline and clipped to its inner half (plus the
     outline's width, so the straight outline does not run across the bite).
     The perforation is inset 9px, and the outline's middle sits 1px further
     out: 8px radius + 10px = 18px. */
  .tk-perf { position: relative; flex: none; width: 0; border-left: 1.5px dashed rgba(25, 30, 59, 0.2); margin: 9px 0; }
  .tk-perf::before, .tk-perf::after {
    content: '';
    position: absolute;
    left: -9px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #f3f6fb;
    border: 2px solid rgba(22, 104, 227, 0.55);
    box-sizing: border-box;
  }
  .card.ticket.gem .tk-perf::before, .card.ticket.gem .tk-perf::after { border-color: rgba(199, 122, 0, 0.6); }
  .card.ticket.picked .tk-perf::before, .card.ticket.picked .tk-perf::after { border-color: var(--text-primary); }
  .tk-perf::before { top: -18px; clip-path: inset(calc(50% - 1.5px) 0 0 0); }
  .tk-perf::after { bottom: -18px; clip-path: inset(0 0 calc(50% - 1.5px) 0); }
  .tk-stub {
    flex: 1 1 44%;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 6px;
    padding: 10px 12px;
    font-family: var(--font);
  }
  .tk-stub .value { margin-top: 0; }
  .tk-stub .value strong { font-size: 1.3rem; }
  .tk-stub .unit { font-size: 0.6rem; }
  .tk-stub .chip { align-self: flex-start; font-size: 0.58rem; padding: 2px 6px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
  .tk-stub .voice { margin-top: 0; min-height: 0; }

  /* Dense: one line of identity, one number, one bar. Built to stack. */
  .card.draggable { cursor: grab; }
  .card.draggable:active { cursor: grabbing; }
  .card.dense { gap: 5px; padding: 8px 10px 7px; }
  .card.dense:hover, .card.dense.hovered { transform: scale(1.02); }
  .card.dense.picked:hover, .card.dense.picked.hovered { transform: scale(1.03); }
  .row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .ident { min-width: 0; }
  .card.dense h3 {
    font-size: 0.86rem; display: flex; align-items: baseline; gap: 6px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .card.dense .country { margin-top: 0; font-size: 0.66rem; }
  .metric { display: flex; align-items: baseline; gap: 7px; white-space: nowrap; }
  .metric strong {
    font-size: 1.02rem; font-weight: 650; font-variant-numeric: tabular-nums;
  }
  .card.dense .track { height: 4px; }

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
