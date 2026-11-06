<script>
  /**
   * The breath between two scenes: one sentence, and the ticket's jet drawing a
   * dashed route past it as you scroll. Three route shapes, so no two gaps in
   * the journey look the same.
   */
  import { onMount } from 'svelte';
  import { PLANE } from './ticketArt.js';
  import { trackScroll, clamp01 } from './scroll.js';

  let { line, route = 'swoop' } = $props();

  const ROUTES = {
    swoop: 'M-20 320 C 200 320, 300 60, 520 120 S 860 340, 1020 80',
    loop: 'M-20 260 C 180 260, 340 300, 440 200 C 520 120, 420 40, 350 120 C 290 190, 480 300, 700 240 S 940 120, 1020 140',
    climb: 'M-20 360 C 260 340, 420 340, 560 220 S 800 60, 1020 40'
  };

  // Each interlude's mask needs its own id.
  const uid = `route-${Math.random().toString(36).slice(2, 8)}`;

  let box = $state();
  let pathEl = $state();
  let progress = $state(0);
  let length = $state(1);

  onMount(() => {
    length = pathEl.getTotalLength();
    return trackScroll(box, 'pass', (p) => (progress = clamp01((p - 0.1) / 0.8)));
  });

  let jet = $derived.by(() => {
    if (!pathEl || length <= 1) return null;
    const at = progress * length;
    const a = pathEl.getPointAtLength(at);
    const b = pathEl.getPointAtLength(Math.min(length, at + 2));
    const c = pathEl.getPointAtLength(Math.max(0, at - 2));
    return { x: a.x, y: a.y, deg: (Math.atan2(b.y - c.y, b.x - c.x) * 180) / Math.PI };
  });
</script>

<div class="interlude" bind:this={box}>
  <svg viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <mask id={uid} maskUnits="userSpaceOnUse" x="-40" y="-40" width="1080" height="480">
        <path
          d={ROUTES[route]}
          fill="none"
          stroke="#fff"
          stroke-width="8"
          stroke-dasharray={length}
          stroke-dashoffset={length * (1 - progress)}
        />
      </mask>
    </defs>
    <path bind:this={pathEl} class="route" d={ROUTES[route]} mask="url(#{uid})" />
    {#if jet && progress > 0 && progress < 1}
      <path
        class="jet"
        d={PLANE}
        transform="translate({jet.x} {jet.y}) rotate({jet.deg}) scale(1.15) translate(-207 -125.5)"
      />
    {/if}
  </svg>
  <p>{line}</p>
</div>

<style>
  /* Nothing in here is interactive, and the band paints over the foot of the
     scene above it (the personality card's Flip button hangs there), so it
     lets every click through. */
  .interlude {
    pointer-events: none;
    position: relative;
    min-height: 62vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 16px;
    overflow: hidden;
  }
  svg { position: absolute; inset: 0; width: 100%; height: 100%; }
  .route {
    fill: none;
    stroke: var(--ticket);
    stroke-width: 2.4;
    stroke-linecap: round;
    stroke-dasharray: 2 11;
    transition: stroke 0.4s ease;
  }
  .jet { fill: var(--ticket); transition: fill 0.4s ease; }
  p {
    position: relative;
    max-width: 22ch;
    font-family: var(--display);
    font-size: clamp(1.9rem, 5vw, 3.5rem);
    line-height: 1.12;
    letter-spacing: -0.015em;
    text-align: center;
    color: var(--text-primary);
    /* The route passes behind the sentence; this keeps the dots off the letters. */
    text-shadow: 0 0 14px #f3f6fb, 0 0 14px #f3f6fb, 0 0 28px #f3f6fb;
  }
</style>
