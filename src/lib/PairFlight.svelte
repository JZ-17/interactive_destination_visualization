<script>
  /**
   * Two cities: their cards fly in from either side of the sky, face down, and
   * turn over as you scroll. The one big moment of the two-city journey.
   */
  import { onMount } from 'svelte';
  import SkyBackdrop from './SkyBackdrop.svelte';
  import PersonalityCard from './PersonalityCard.svelte';
  import { trackScroll, prefersStill, clamp01 } from './scroll.js';
  import { PLANE } from './ticketArt.js';

  let { a, b, km = 0 } = $props();

  let track = $state();
  let progress = $state(0);
  let still = $state(false);

  onMount(() => {
    still = prefersStill();
    return trackScroll(track, 'pin', (p) => (progress = p));
  });

  const ease = (t) => 1 - (1 - t) ** 3;
  let enter = $derived(still ? 1 : ease(clamp01(progress / 0.38)));
  let turn = $derived(still ? 1 : ease(clamp01((progress - 0.34) / 0.3)));
  let rotation = $derived((1 - turn) * 180);
  let settled = $derived(still || progress > 0.62);
</script>

<section class="pair" class:still bind:this={track}>
  <div class="stage">
    <SkyBackdrop {progress} {still} />

    <p class="line">{a.city} to {b.city}</p>

    <div class="cards">
      <div class="seat" style="transform: translateX({(1 - enter) * -70}vw)">
        {#key a.city}<PersonalityCard city={a} {rotation} tilt={(1 - enter) * -14 - 2.5} canFlip={settled} />{/key}
      </div>
      <div class="between" style="opacity:{enter}" aria-label="{Math.round(km).toLocaleString()} kilometres apart">
        <svg viewBox="188 107 38 37" aria-hidden="true"><path d={PLANE} /></svg>
        <span>{Math.round(km).toLocaleString()} km</span>
      </div>
      <div class="seat" style="transform: translateX({(1 - enter) * 70}vw)">
        {#key b.city}<PersonalityCard city={b} {rotation} tilt={(1 - enter) * 14 + 2.5} canFlip={settled} />{/key}
      </div>
    </div>

    <p class="payoff" class:in={settled}>Two pitches. Click a card to read its fine print.</p>
  </div>
</section>

<style>
  .pair { position: relative; height: 280vh; }
  .pair.still { height: auto; }
  .pair.still .stage { position: relative; height: auto; min-height: 100vh; gap: 28px; }
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
    gap: 14px;
    padding: 34px 12px 92px;
    text-align: center;
    color: #121733;
  }
  .line { position: relative; z-index: 1; font-family: var(--display); font-size: clamp(1.45rem, 3.6vw, 2.6rem); line-height: 1.15; }
  .cards {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(6px, 3vw, 44px);
  }
  /* The tallest a 5:7 card can be and still leave room for the lines around it,
     capped so two cards and the gap always fit across a phone. */
  .seat { width: min(calc((100vh - 256px) * 5 / 7), 37vw); will-change: transform; }
  .between {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    font-family: var(--display);
    font-size: clamp(0.8rem, 1.5vw, 1.1rem);
    white-space: nowrap;
  }
  .between svg { width: clamp(20px, 3vw, 40px); fill: #121733; }
  .payoff {
    font-family: var(--display);
    font-size: clamp(1rem, 2vw, 1.4rem);
    opacity: 0;
    transition: opacity 0.5s ease;
  }
  .payoff.in { opacity: 1; }

  @media (prefers-reduced-motion: reduce) {
    .payoff { transition: none; }
  }
</style>
