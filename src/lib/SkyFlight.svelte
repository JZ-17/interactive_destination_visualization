<script>
  /**
   * One city: fly through the words its tourism board shares with the rest.
   *
   * A tall track with a pinned stage. Words start at the fuselage and fan out
   * past the wings as you scroll. Only position and opacity animate, because a
   * word's SIZE means how many of the fifty use it.
   */
  import { onMount } from 'svelte';
  import SkyBackdrop from './SkyBackdrop.svelte';
  import { trackScroll, prefersStill, clamp01 } from './scroll.js';

  let { city, words = [], echoes = 0 } = $props();

  let track = $state();
  let progress = $state(0);
  let still = $state(false);

  onMount(() => {
    still = prefersStill();
    return trackScroll(track, 'pin', (p) => (progress = p));
  });

  const SPAWN_LAST = 0.58; // progress at which the last word launches
  const SPAN = 0.42;       // how much scroll one word takes to cross the frame

  /** 2 cities -> 18px, 30 cities -> 43px. Bigger word = more of the fifty. */
  const sizeOf = (n) => 16 + Math.min(n, 30) * 0.9;

  let flight = $derived.by(() => {
    const n = words.length;
    return words.map((w, i) => {
      const start = n > 1 ? (i / (n - 1)) * SPAWN_LAST : 0;
      const t = clamp01((progress - start) / SPAN);
      const side = i % 2 === 0 ? 1 : -1;
      // Stepped by the golden ratio, so any handful in the air stays spread out.
      const fan = (((i * 0.6180339887) % 1) - 0.5) * 1.6;
      const r = 0.28 + t * t * 1.05;
      return {
        ...w,
        x: side * Math.cos(fan) * r * 50,
        y: Math.sin(fan) * r * 42,
        o: Math.min(1, t / 0.12) * Math.min(1, (1 - t) / 0.22)
      };
    });
  });

  let landed = $derived(still || progress > 0.72);
</script>

<section class="sky" class:still bind:this={track}>
  <div class="stage">
    <SkyBackdrop {progress} {still} plane={true} />

    <p class="line">You might think that <strong>{city.city}</strong> is unique…</p>

    {#if still}
      <ul class="still-words">
        {#each words as w (w.word)}
          <li style="font-size:{sizeOf(w.cities)}px">{w.word}<span class="count">{w.cities}</span></li>
        {/each}
      </ul>
    {:else}
      <div class="field" aria-hidden="true">
        {#each flight as w (w.word)}
          <span
            class="fly"
            style="font-size:{sizeOf(w.cities)}px; opacity:{w.o}; transform: translate(-50%, -50%) translate({w.x}vw, {w.y}vh)"
          >{w.word}<span class="count">{w.cities}</span></span>
        {/each}
      </div>
      <ul class="sr-only">
        {#each words as w (w.word)}
          <li>{w.word}: {w.cities} of the fifty cities</li>
        {/each}
      </ul>
    {/if}

    <div class="foot">
      <p class="line payoff" class:in={landed}>
        But <strong>{echoes}</strong> of the other 49 reach for the same words.
      </p>
      <p class="note-line">Bigger word = more of the fifty cities use it. The small number is how many.</p>
    </div>
  </div>
</section>

<style>
  .sky { position: relative; height: 340vh; }
  .sky.still { height: auto; }
  .sky.still .stage { position: relative; height: auto; min-height: 100vh; gap: 28px; }
  .stage {
    position: sticky;
    top: 0;
    height: 100vh;
    overflow: hidden;
    isolation: isolate;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 56px 16px 104px;
    text-align: center;
    font-family: var(--display);
    color: #121733;
  }
  .line { font-size: clamp(1.45rem, 3.6vw, 2.6rem); line-height: 1.15; }
  .line strong { font-weight: 700; }
  .payoff { opacity: 0; transform: translateY(8px); transition: opacity 0.55s ease, transform 0.55s ease; }
  .payoff.in { opacity: 1; transform: none; }
  .foot { display: flex; flex-direction: column; align-items: center; gap: 10px; }
  .note-line { font-family: var(--font); font-size: 0.8rem; color: #252c4a; }

  .field { position: absolute; inset: 0; pointer-events: none; }
  .fly { position: absolute; left: 50%; top: 50%; white-space: nowrap; will-change: transform, opacity; }
  .count { font-size: 0.5em; vertical-align: super; margin-left: 3px; opacity: 0.7; }

  .still-words {
    display: flex; flex-wrap: wrap; justify-content: center; gap: 6px 18px;
    max-width: 900px; margin: 0; padding: 0; list-style: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .payoff { transition: none; }
  }
</style>
