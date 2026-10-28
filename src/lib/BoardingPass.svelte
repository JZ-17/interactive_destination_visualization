<script>
  /**
   * The boarding pass. Christine's ticket SVG rebuilt with real <text>, so the
   * destination code, city and country update when the picker changes; the
   * world wash, the jet and the ticket silhouette are her paths unchanged.
   *
   * Coordinates are the original 671x297 artboard throughout — the viewBox
   * scales the whole thing, so nothing here needs to know the display size.
   */
  import { PLANE, WORLD } from '$lib/ticketArt.js';

  let {
    code = '————',
    city = 'Choose a city',
    country = '',
    fromCode = 'BOS',
    fromCity = 'BOSTON',
    question = 'WHAT DO CITIES WANT TO BE KNOWN FOR?',
    flight = 'CS1710',
    terminal = 'XCZ | JZ | NZ',
    seat = 'A1',
    time = '',
    date = ''
  } = $props();

  // A long destination needs a smaller name line than "ROME" does. The code
  // itself is always three letters, so only the name below it can overflow.
  let nameSize = $derived(city.length > 14 ? 11 : city.length > 10 ? 12 : 13.5);

  /**
   * Bars for the stub, dealt from the destination code so each ticket carries
   * its own. Decoration, not an encoding: it is a barcode because a boarding
   * pass has one, and nothing in the UI invites reading it.
   */
  let bars = $derived.by(() => {
    let seed = 0;
    for (const ch of `${code}${flight}`) seed = (seed * 31 + ch.charCodeAt(0)) % 100000;
    const out = [];
    let x = 477.7;
    while (x < 607) {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      const w = 1.4 + ((seed >> 7) % 3) * 1.4;
      out.push({ x, w });
      seed = (seed * 1103515245 + 12345) % 2147483648;
      x += w + 1.4 + ((seed >> 9) % 3) * 1.1;
    }
    return out;
  });
</script>

<svg
  class="pass"
  viewBox="0 0 671 297"
  role="img"
  aria-label="Boarding pass from {fromCity} to {city}{country ? `, ${country}` : ''}"
  xmlns="http://www.w3.org/2000/svg"
>
  <defs>
    <!-- The world wash is clipped to the upper half so it stops at the
         perforation, exactly as it does in the source artwork. -->
    <clipPath id="bp-world"><rect x="63" y="73" width="341" height="174" /></clipPath>
    <clipPath id="bp-stub-top"><rect x="16" y="16" width="435" height="180" /></clipPath>
    <filter id="bp-shadow" x="0" y="0" width="671" height="297" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#000" flood-opacity="0.15" />
    </filter>
  </defs>

  <g filter="url(#bp-shadow)">
    <!-- Left: the stub you keep. Two panels split by the perforation line. -->
    <path class="card" d="M16 40C16 26.7452 26.7452 16 40 16H435C443.837 16 451 23.1634 451 32V196H16V40Z" />
    <path class="card" d="M16 196H451V265C451 273.837 443.837 281 435 281H40C26.7452 281 16 270.255 16 257V196Z" />
    <line class="perf" x1="16" y1="196" x2="451" y2="196" />

    <g clip-path="url(#bp-stub-top)">
      <g clip-path="url(#bp-world)" opacity="0.3">
        {#each WORLD as d}
          <path {d} fill="#fff" fill-opacity="0.2" />
        {/each}
      </g>
    </g>

    <text class="head" x="40" y="52">{question}</text>

    <text class="tag" x="40" y="92">FROM</text>
    <text class="code" x="40" y="132">{fromCode}</text>
    <text class="place" x="40" y="164">{fromCity}</text>

    <path class="jet" d={PLANE} />

    <text class="tag" x="262" y="92">TO</text>
    <text class="code" x="262" y="132">{code}</text>
    <text class="place" x="262" y="164" style="font-size:{nameSize}px">
      {city.toUpperCase()}{country ? ` · ${country.toUpperCase()}` : ''}
    </text>

    <text class="tag sm" x="40" y="228">FLIGHT</text>
    <text class="val" x="40" y="248">{flight}</text>
    <text class="tag sm" x="131" y="228">TERMINAL</text>
    <text class="val" x="131" y="248">{terminal}</text>
    <text class="tag sm" x="262" y="228">SEAT</text>
    <text class="val" x="262" y="248">{seat}</text>

    <!-- Right: the part the gate agent takes. -->
    <path
      class="stub"
      d="M451 32C451 23.1634 458.163 16 467 16H631C644.255 16 655 26.7452 655 40V257C655 270.255 644.255 281 631 281H467C458.163 281 451 273.837 451 265V32Z"
    />
    <text class="head dark" x="475" y="52">BOARDING PASS</text>
    <text class="tag sm dark" x="475" y="84">PASSENGER</text>
    <text class="val dark" x="475" y="104">YOU</text>
    <text class="tag sm dark" x="475" y="136">BOARDING TIME</text>
    <text class="val dark" x="475" y="156">{time}</text>
    <text class="tag sm dark" x="475" y="188">DATE</text>
    <text class="val dark" x="475" y="208">{date}</text>
    {#each bars as b}
      <rect x={b.x} y="231.86" width={b.w} height="27.14" fill="#000" />
    {/each}
  </g>
</svg>

<style>
  .pass {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }

  .card { fill: var(--ticket); }
  .stub { fill: #fff; }
  .perf { stroke: #fff; stroke-width: 1; }
  .jet  { fill: #fff; }

  text {
    fill: #fff;
    font-family: var(--display);
    /* Text in an SVG does not inherit the page's antialiasing hints. */
    -webkit-font-smoothing: antialiased;
  }
  .dark { fill: #000; }

  .head  { font-size: 13px; letter-spacing: 0.055em; }
  .tag   { font-size: 11.5px; letter-spacing: 0.03em; }
  .tag.sm{ font-size: 10px; letter-spacing: 0.045em; }
  .code  { font-size: 36px; letter-spacing: 0.01em; }
  .place { font-size: 13.5px; letter-spacing: 0.04em; }
  .val   { font-size: 14px; }
</style>
