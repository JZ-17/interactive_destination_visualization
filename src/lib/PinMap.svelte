<script>
  /**
   * The fifty, where they actually are.
   *
   * The introduction to the whole project: before any claim about which
   * cities sound alike, here is the set the claim is made over — fifty
   * tourism sites, scattered far enough apart that "they all say the same
   * thing" is a finding rather than a sampling accident.
   *
   * Pins are one colour, deliberately. Colour across this project encodes
   * city category and nothing else, and nothing here encodes category — so
   * the pins take the intro palette's brown, the same ink as the boarding
   * pass, and carry identity only. Same reasoning as the country tints on
   * the globe.
   *
   * Each pin is a real <button> in an HTML layer over the map rather than a
   * shape inside the SVG: it gets keyboard focus, a hover state and a card
   * for free, and the card can then hold a working hyperlink out to the
   * site the description was scraped from. The card is a child of its own
   * pin, so tabbing runs pin, its link, next pin.
   */
  import { geoNaturalEarth1, geoPath } from 'd3-geo';
  import { PIN } from './ticketArt.js';

  let { cities = [], land = null, selected = '' } = $props();

  // The projection's own box. Everything positions in percentages of it, so
  // the map and the pin layer stay registered at any width.
  const W = 1000;
  const H = 500;

  // Natural Earth, as the project's other map uses: the poles are not worth
  // the area Mercator would hand them when every city here is a city.
  const projection = geoNaturalEarth1().fitExtent([[6, 6], [W - 6, H - 6]], { type: 'Sphere' });
  const path = geoPath(projection);

  let shapes = $derived(land ? land.features.map((f) => path(f)).filter(Boolean) : []);

  /**
   * Projected, then sorted north to south.
   *
   * Fifty pins on one world map means Europe is a pile — twenty of the fifty
   * are inside a few hundred miles of each other. Painting southern pins
   * last is the usual map answer: the overlap then reads as depth, the way a
   * crowd does, instead of as an arbitrary stacking order. Hovering lifts
   * whichever one you are pointing at clear of the rest.
   */
  let pins = $derived(
    cities
      .filter((c) => Number.isFinite(c.lon) && Number.isFinite(c.lat))
      .map((c) => {
        const [x, y] = projection([c.lon, c.lat]);
        return {
          city: c.city,
          country: c.country,
          link: c.siteLink,
          x: (x / W) * 100,
          y: (y / H) * 100
        };
      })
      .sort((a, b) => a.y - b.y)
  );

  /**
   * `hovered` follows the pointer; `held` is a pin clicked open. Held exists
   * for two reasons: a card you have to keep hovering is a card you cannot
   * click the link in on a touch screen, and on the European pile it is the
   * only way to keep one card still long enough to read it.
   */
  let hovered = $state(null);
  let held = $state(null);
  let shown = $derived(held ?? hovered);

  let plate = $state(null);

  /**
   * Hover resolves to the NEAREST pin, not the one whose art happens to be
   * on top.
   *
   * Measured on the real map, hit-testing the pin shapes left ten of the
   * fifty with under a quarter of themselves exposed — The Hague showed 6%,
   * Prague 7%, which is a sliver a pointer cannot land on. Twenty of these
   * cities are inside a few hundred miles of each other and the art is
   * wider than the gaps between them, so no amount of shrinking fixes it
   * and moving the pins apart would be a lie about where the cities are.
   *
   * Nearest-centre gives every pin a contiguous patch of map that belongs
   * to it, however buried its art is, and it makes the whole map easier to
   * use besides: you aim near a city rather than at a 15px target.
   */
  const REACH = 38; // px; past this the pointer is over open sea, not a city

  function aim(e) {
    if (held) return;                        // a card clicked open stays put
    if (e.target.closest?.('.card')) return; // reading one, not picking another
    const r = plate.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    let best = null;
    let bestD = Infinity;
    for (const p of pins) {
      const dx = (p.x / 100) * r.width - mx;
      const dy = (p.y / 100) * r.height - my;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    hovered = best && bestD <= REACH * REACH ? best.city : null;
  }

  /**
   * Which way a card opens. Near an edge it would otherwise hang off the
   * map — and the map is as wide as the page, so "off the map" is off the
   * screen. Cards on the top row drop below their pin instead of above it.
   */
  const sideOf = (p) => (p.x < 15 ? 'start' : p.x > 85 ? 'end' : 'mid');
  const placeOf = (p) => (p.y < 26 ? 'below' : 'above');

  /** visitlondon.com, not https://www.visitlondon.com/. */
  function host(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }

  function toggle(name) {
    held = held === name ? null : name;
    hovered = name;
  }
</script>

<!-- Pointer-driven, with a keyboard path through the pins themselves; the
     wrapper's handlers only clear, so they need no role of their own. -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<figure
  class="atlas-map"
  onmouseleave={() => (hovered = null)}
  onkeydown={(e) => {
    if (e.key === 'Escape') {
      held = null;
      hovered = null;
    }
  }}
>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="plate"
    style="aspect-ratio: {W} / {H}"
    bind:this={plate}
    onmousemove={aim}
  >
    <svg class="land" viewBox="0 0 {W} {H}" role="img" aria-label="World map">
      {#each shapes as d, i (i)}
        <!-- A hairline stroke in the fill colour closes the antialiased gaps
             between neighbouring countries, so the land reads as one shape
             rather than a political map. -->
        <path {d} />
      {/each}
    </svg>

    <div class="pins" class:picked={!!selected}>
      {#each pins as p (p.city)}
        <div
          class="pin-at"
          class:open={shown === p.city}
          class:chosen={p.city === selected}
          style="left:{p.x}%; top:{p.y}%"
        >
          {#if p.city === selected}
            <!-- The ring and halo that say "this is the one you picked".
                 Not a colour: see the note on `.halo` in the styles. -->
            <span class="halo" aria-hidden="true"></span>
          {/if}

          <button
            class="pin"
            class:lit={shown === p.city}
            aria-label="{p.city}, {p.country}"
            aria-expanded={shown === p.city}
            onfocus={() => (hovered = p.city)}
            onclick={() => toggle(p.city)}
          >
            <svg viewBox="0 0 46 53" aria-hidden="true"><path d={PIN} /></svg>
          </button>

          <!-- The destination carries its name without being asked — but
               only at rest. The moment any card is open the tag steps aside,
               its own included: two name boxes on one map read as two
               answers to the same question, and the one you are pointing at
               should be the one that speaks. The filled ring keeps the
               destination marked while the tag is away. -->
          {#if p.city === selected && !shown}
            <span class="tag {sideOf(p)} {placeOf(p)}">
              <span class="tag-kicker">Your destination</span>
              <span class="tag-city">{p.city}</span>
            </span>
          {/if}

          {#if shown === p.city}
            <div class="card {sideOf(p)} {placeOf(p)}">
              <p class="city">{p.city}</p>
              <p class="country">{p.country}</p>
              {#if p.link}
                <a href={p.link} target="_blank" rel="noopener noreferrer">
                  {host(p.link)}
                  <svg class="out" viewBox="0 0 12 12" aria-hidden="true">
                    <path d="M4 2h6v6M10 2 2.6 9.4" />
                  </svg>
                </a>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>

</figure>

<style>
  .atlas-map {
    margin: 0;
    width: 100%;
  }

  .plate {
    position: relative;
    width: 100%;
  }

  .land {
    display: block;
    width: 100%;
    height: 100%;
  }
  /* Flat, one colour, no borders: the countries are a backdrop for the pins,
     not a subject. The stroke matches the fill and only closes the seams. */
  .land path {
    fill: #e0c5c5;
    stroke: #e0c5c5;
    stroke-width: 0.6;
  }

  .pins {
    position: absolute;
    inset: 0;
  }

  /* A zero-size point at the city. The pin, the halo, the name tag and the
     card all hang off it, and all of them size off `--pw`, so the chosen
     pin can grow without anything coming unstuck from it. */
  .pin-at {
    position: absolute;
    width: 0;
    height: 0;
    --pw: clamp(17px, 2.1vw, 24px);
  }
  .pin-at.chosen {
    --pw: clamp(23px, 2.8vw, 32px);
    z-index: 2;
  }
  .pin-at.open {
    z-index: 3;
  }

  .pin {
    position: absolute;
    left: 0;
    top: 0;
    /* The art's tip, not its box, sits on the city. */
    transform: translate(-50%, -84.15%);
    transform-origin: 50% 84.15%;
    width: var(--pw);
    padding: 0;
    border: none;
    background: none;
    line-height: 0;
    cursor: pointer;
    transition: transform 0.14s ease;
  }
  .pin svg {
    display: block;
    width: 100%;
    height: auto;
    fill: var(--ink-pin, #5f3f2c);
    /* The drop shadow from the design, as a CSS filter so it scales with the
       pin instead of being baked at one size. */
    filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.22));
    transition: fill 0.14s ease, opacity 0.14s ease;
  }

  /*
   * Once a destination is picked the other forty-nine step back — by
   * COLOUR, not by opacity.
   *
   * Opacity was the obvious move and it looked grubby: it fades the drop
   * shadow along with the art, so forty-nine pins turned into forty-nine
   * grey smudges and the map read as dirty rather than as quiet. Moving
   * the fill up the same brown instead keeps every pin a clean, solid
   * shape at full strength — only lighter — so the chosen one stands out
   * by being the darkest thing on the map rather than the only sharp one.
   *
   * Still a tint of one hue, not a second colour. Across this project
   * colour means city category and nothing else, and nothing here encodes
   * category; a genuinely different hue for "yours" would be the one
   * coloured thing on a map where colour carries no meaning. A cool grey
   * for the forty-nine was the better-looking option and was rejected for
   * exactly that reason — it would have made the chosen pin the only warm
   * mark on the map, which reads as a kind, not as a selection.
   *
   * How far up the brown is a contrast question, not a taste one. The
   * land is #e0c5c5, so the old #9b8071 sat at 2.27:1 against it — under
   * the 3:1 floor a graphical object needs to hold an edge, which is why
   * it looked washed out rather than quiet. This clears it at 3.42:1 on
   * land and 4.80:1 on ocean, and still reads as plainly stepped back
   * from the chosen pin's 7.70:1.
   */
  .pins.picked .pin-at:not(.chosen) {
    --ink-pin: #7d6355;
  }
  .pin-at.chosen {
    --ink-pin: #4a2d1c;
  }
  /* …and whichever one you point at comes straight back to full ink. Keyed
     off the open card rather than `:hover`, since hover here resolves by
     nearest centre and the pointer is often not over the art at all. */
  .pins.picked .pin-at.open {
    --ink-pin: #2f1b0f;
  }
  .pin:hover,
  .pin.lit {
    transform: translate(-50%, -84.15%) scale(1.34);
  }
  .pin.lit svg {
    fill: #2f1b0f;
  }
  .pin:focus-visible {
    outline: none;
  }
  .pin:focus-visible svg {
    fill: #40281a;
    filter: drop-shadow(0 0 0 2px #40281a) drop-shadow(0 0 4px rgba(0, 0, 0, 0.3));
  }

  /*
   * The chosen destination, marked the way this project marks a selection
   * everywhere else: a thicker ring and an ink halo, never a new hue. The
   * pins carry no encoding, so inventing a colour for "yours" would be the
   * one coloured thing on a map where colour means nothing — and it would
   * read as a category. Size, a ring and its own name do the work instead.
   *
   * Centred on the pin's HEAD, not on the city: the head sits at (23, 23)
   * in the art and the tip at (23, 44.6), so the circle rides 21.6 of 53
   * box-heights above the anchor — the 0.47 below.
   */
  .halo {
    position: absolute;
    left: 0;
    top: 0;
    width: calc(var(--pw) * 2.05);
    aspect-ratio: 1;
    transform: translate(-50%, -50%) translateY(calc(var(--pw) * -0.47));
    border-radius: 50%;
    border: 2px solid rgba(74, 45, 28, 0.42);
    /* Part-filled, not solid: it has to lift the pin off both the pink land
       and the pale ocean without becoming a white dot of its own, and the
       land's detail should still read through it. It also carries the mark
       on its own while the name tag is away — hovering the destination
       swaps that tag for the city's card. */
    background: rgba(255, 255, 255, 0.5);
    box-shadow:
      0 0 0 5px rgba(95, 63, 44, 0.07),
      0 6px 18px rgba(95, 63, 44, 0.14);
    pointer-events: none;
  }

  /* Its name, always on. The reader picked this city three frames ago and
     should not have to hunt the pile for it. */
  .tag {
    position: absolute;
    display: block;
    width: max-content;
    max-width: 190px;
    padding: 5px 12px 7px;
    background: #fff;
    border-radius: 12px;
    box-shadow:
      0 5px 16px rgba(0, 0, 0, 0.13),
      inset 0 -1.5px 0 rgba(0, 0, 0, 0.07);
    font-family: var(--display);
    text-align: center;
    white-space: nowrap;
    pointer-events: none;
  }
  /* Says what the marker IS, so the halo needs no legend. */
  .tag-kicker {
    display: block;
    font-size: 0.6rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #121212;
    opacity: 0.45;
  }
  .tag-city {
    display: block;
    margin-top: 1px;
    font-size: 0.86rem;
    font-weight: 700;
    color: #4a2d1c;
  }
  .tag.above { bottom: calc(var(--pw) * 1.3); }
  .tag.below { top: calc(var(--pw) * 0.42); }
  .tag.mid   { left: 50%; transform: translateX(-50%); }
  .tag.start { left: -10px; }
  .tag.end   { right: -10px; }

  /* The project's raised-white surface, the same one the gate's pills and
     the cloud's filter bar sit on. */
  .card {
    position: absolute;
    width: max-content;
    max-width: 230px;
    padding: 9px 13px 10px;
    background: #fff;
    border-radius: 13px;
    box-shadow:
      0 10px 26px rgba(0, 0, 0, 0.12),
      inset 0 -1.5px 0 rgba(0, 0, 0, 0.08);
    text-align: left;
    pointer-events: auto;
  }
  /* Clear of the art rather than a flat offset from the city point: the pin
     stands about one `--pw` above its own tip, so a fixed 0.4em put every
     card on top of the pin it was describing. */
  .card.above { bottom: calc(var(--pw) * 1.12); }
  .card.below { top: calc(var(--pw) * 0.34); }
  .card.mid   { left: 50%; transform: translateX(-50%); }
  .card.start { left: -8px; }
  .card.end   { right: -8px; }

  .card p {
    margin: 0;
    line-height: 1.25;
  }
  .city {
    font-family: var(--display);
    font-size: 1.02rem;
    font-weight: 700;
    color: #121212;
  }
  .country {
    font-size: 0.78rem;
    color: #121212;
    opacity: 0.6;
  }
  .card a {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: 5px;
    font-size: 0.76rem;
    color: #5f3f2c;
    text-decoration-color: rgba(95, 63, 44, 0.4);
    text-underline-offset: 2px;
  }
  .card a:hover {
    text-decoration-color: currentColor;
  }
  .out {
    width: 8px;
    height: 8px;
    flex: none;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  @media (prefers-reduced-motion: reduce) {
    .pin,
    .pin svg {
      transition: none;
    }
  }
</style>
