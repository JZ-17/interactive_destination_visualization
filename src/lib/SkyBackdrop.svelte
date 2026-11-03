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

<svg class="sky-art" viewBox="0 0 1200 760" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <!-- A blur spreads past the shape's box, and the default filter region clips it. -->
    <filter id="sky-soft" x="-30%" y="-150%" width="160%" height="400%"><feGaussianBlur stdDeviation="30" /></filter>
    <filter id="sky-softer" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1.6" /></filter>
  </defs>
  <g fill="#fff" filter="url(#sky-soft)" opacity="0.45" transform="translate({far} 0)">
    <ellipse cx="120" cy="170" rx="210" ry="44" />
    <ellipse cx="1090" cy="230" rx="230" ry="50" />
    <ellipse cx="640" cy="90" rx="190" ry="30" />
    <ellipse cx="1400" cy="120" rx="220" ry="40" />
  </g>
  {#if plane}
    <!-- An airliner flying straight at you: tail behind, then wings, then nose. -->
    <g filter="url(#sky-softer)" transform="rotate({bank} 600 400) translate(0 {bob})">
      <g fill="#f4f7fd">
        <path d="M590 330 L584 176 Q600 164 616 176 L610 330 Z" />
        <path d="M600 292 L436 272 L432 286 L600 328 L768 286 L764 272 Z" />
      </g>
      <g fill="#fff">
        <path d="M600 414 L104 366 Q84 364 84 376 L600 456 L1116 376 Q1116 364 1096 366 Z" />
        <path d="M86 376 L66 330 L76 328 L104 368 Z" />
        <path d="M1114 376 L1134 330 L1124 328 L1096 368 Z" />
      </g>
      {#each [352, 848] as cx (cx)}
        <circle {cx} cy="456" r="46" fill="#fff" />
        <circle {cx} cy="456" r="35" fill="#9db1dc" />
        <circle {cx} cy="456" r="8" fill="#fff" />
      {/each}
      <ellipse cx="600" cy="408" rx="94" ry="98" fill="#fff" />
      <path d="M528 378 Q600 346 672 378 L660 402 Q600 380 540 402 Z" fill="#7f97cf" />
      <path d="M600 354 V388" stroke="#fff" stroke-width="3" />
      <ellipse cx="600" cy="478" rx="52" ry="20" fill="#e3e9f7" />
    </g>
  {/if}
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
    /* Out here rather than in the artwork: "slice" crops the artwork on a wide
       screen, and the page's next band starts on exactly this last stop. */
    background: linear-gradient(180deg, #e8ebf7 0%, #cfd9f3 45%, #a6c0ef 100%);
  }
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
