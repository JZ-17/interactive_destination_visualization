<script>
  /**
   * The sky both flights happen in. Clouds drift at two speeds as you scroll,
   * so the stage has depth while it is pinned. `plane` adds the head-on jet.
   */
  let { progress = 0, plane = false, still = false } = $props();

  let bank = $derived(still ? 0 : Math.sin(progress * Math.PI * 3) * 4.5);
  let bob = $derived(still ? 0 : Math.sin(progress * Math.PI * 2) * 14);
  let far = $derived(still ? 0 : progress * -160);
  let near = $derived(still ? 0 : progress * -520);
</script>

<!-- Three stacked layers, far clouds, plane, near clouds, all on one artboard.
     The plane gets an SVG of its own because a browser may rasterise an SVG
     holding a blur filter as one soft bitmap, and the jet would blur with it. -->
<svg class="sky-art sky-back" viewBox="0 0 1200 760" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <!-- A blur spreads past the shape's box, and the default filter region clips it. -->
    <filter id="sky-soft" x="-30%" y="-150%" width="160%" height="400%"><feGaussianBlur stdDeviation="30" /></filter>
  </defs>
  <g fill="#fff" filter="url(#sky-soft)" opacity="0.45" transform="translate({far} 0)">
    <ellipse cx="120" cy="170" rx="210" ry="44" />
    <ellipse cx="1090" cy="230" rx="230" ry="50" />
    <ellipse cx="640" cy="90" rx="190" ry="30" />
    <ellipse cx="1400" cy="120" rx="220" ry="40" />
  </g>
</svg>
{#if plane}
  <svg class="sky-art" viewBox="0 0 1200 760" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <!-- An airliner flying straight at you, drawn the way one actually looks
         head-on: tail behind, then a low wing with a little dihedral, engines
         slung under it on pylons, and the fuselage in front of it all. Each
         part takes one shadow tone along its underside, so the fuselage reads
         as a tube rather than a disc and the wing has an edge where it meets
         it. Cockpit panes, not a single visor, and no nose ellipse: together
         those two read as a face. Unfiltered, so its edges stay crisp; only
         the clouds are soft.

         Drawn at full size, then scaled to 85% about the fuselage, so the
         words that fan out of it have open sky to land in. -->
    <g class="plane" transform="rotate({bank} 600 400) translate(0 {bob})">
      <g transform="translate(600 410) scale(0.85) translate(-600 -410)">
        <!-- Tail: fin and stabilisers, a shade back from the white in front. -->
        <g fill="#eef2fa">
          <path d="M591 336 L595 176 Q600 168 605 176 L609 336 Z" />
          <path d="M600 360 L452 338 Q446 338 447 344 L600 378 L753 344 Q754 338 748 338 Z" />
          <path d="M106 372 L92 330 Q91 324 97 326 L114 369 Z" />
          <path d="M1094 372 L1108 330 Q1109 324 1103 326 L1086 369 Z" />
        </g>
        <!-- Wings: the shade first, then the white upper surface a few units
             thinner, which leaves a lit leading edge over a shaded underside. -->
        <g fill="#d3dcf1">
          <path d="M600 430 L112 368 Q102 367 102 373 L104 378 L600 454 Z" />
          <path d="M600 430 L1088 368 Q1098 367 1098 373 L1096 378 L600 454 Z" />
        </g>
        <g fill="#fff">
          <path d="M600 430 L112 368 Q102 367 102 373 L104 374 L600 446 Z" />
          <path d="M600 430 L1088 368 Q1098 367 1098 373 L1096 374 L600 446 Z" />
        </g>
        {#each [410, 790] as cx (cx)}
          <!-- Pylon, nacelle with its shaded underside, intake lip, fan, spinner.
               The fan blades are one dashed stroke round the spinner. -->
          <rect x={cx - 7} y="420" width="14" height="20" rx="3" fill="#e3e9f6" />
          <circle {cx} cy="476" r="40" fill="#d6dff2" />
          <circle {cx} cy="473" r="38" fill="#fff" />
          <circle {cx} cy="476" r="29" fill="#4f6396" />
          <circle {cx} cy="476" r="25" fill="#7a8fc2" />
          <circle {cx} cy="476" r="16" fill="none" stroke="#6479ad" stroke-width="18" stroke-dasharray="2.2 6" />
          <circle {cx} cy="476" r="7" fill="#f1f4fb" />
        {/each}
        <!-- Fuselage: a shadow ellipse with the white one lifted off it, leaving
             a crescent along the belly. -->
        <ellipse cx="600" cy="405" rx="80" ry="84" fill="#d6dff2" />
        <ellipse cx="600" cy="398" rx="77" ry="79" fill="#fff" />
        <g fill="#34476f">
          <path d="M556 372 Q575 365 597 363 L597 383 Q578 385 560 391 Z" />
          <path d="M644 372 Q625 365 603 363 L603 383 Q622 385 640 391 Z" />
          <path d="M533 386 L551 375 L556 393 L540 401 Z" />
          <path d="M667 386 L649 375 L644 393 L660 401 Z" />
        </g>
      </g>
    </g>
  </svg>
{/if}
<svg class="sky-art" viewBox="0 0 1200 760" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <g fill="#fff" filter="url(#sky-soft)" opacity="0.7" transform="translate({near} 0)">
    <ellipse cx="200" cy="700" rx="280" ry="60" />
    <ellipse cx="1030" cy="740" rx="260" ry="56" />
    <ellipse cx="1600" cy="690" rx="300" ry="60" />
  </g>
</svg>
<div class="sky-floor" aria-hidden="true"></div>

<style>
  .sky-art {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
  }
  .sky-back {
    /* Out here rather than in the artwork: "slice" crops the artwork on a wide
       screen, and the page's next band starts on exactly this last stop. */
    background: linear-gradient(180deg, #e8ebf7 0%, #cfd9f3 45%, #a6c0ef 100%);
  }
  .plane { shape-rendering: geometricPrecision; }
  /* Clouds drift to the stage's edge; this lets them sink into the band below
     instead of being cut off by it. */
  .sky-floor {
    position: absolute;
    inset: auto 0 0;
    height: 22%;
    z-index: -1;
    background: linear-gradient(180deg, rgba(166, 192, 239, 0), #a6c0ef);
  }
</style>
