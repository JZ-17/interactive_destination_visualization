<script>
  /**
   * The ticket once it has scrolled away: Boston to the destination in the
   * same colour, plus one dot per scene in this journey so a long scroll can be
   * skipped through. The second city joins the strip only once the reader has
   * picked one at the arrival, so it never offers that choice early.
   */
  import CitySelect from './CitySelect.svelte';
  import { PLANE } from './ticketArt.js';

  let {
    /** Where this flight left from: Boston, or the city flown on from. */
    home = 'Boston',
    cities = [],
    dest = '',
    compare = '',
    color = '#7b6a60',
    stops = [],
    active = '',
    ondest = () => {},
    oncompare = () => {},
    onjump = () => {}
  } = $props();
</script>

<div class="bar" style="background:{color}" role="group" aria-label="Your flight">
  <span class="leg">
    <span class="word">From</span>
    <span class="home">{home}</span>
  </span>
  <svg class="jet" viewBox="188 107 38 37" aria-hidden="true"><path d={PLANE} /></svg>
  <span class="leg">
    <span class="word">To</span>
    <CitySelect id="bar-to" value={dest} {cities} label="Flying to" placeholder="Choose" onpick={ondest} />
  </span>
  {#if compare}
    <span class="leg">
      <span class="word">Compared with</span>
      <CitySelect id="bar-compare" value={compare} {cities} taken={dest} clearable label="Compared with" placeholder="Choose" onpick={oncompare} />
    </span>
  {/if}
  <nav class="stops" aria-label="Scenes">
    {#each stops as s (s.id)}
      <button
        class:on={active === s.id}
        aria-current={active === s.id ? 'true' : undefined}
        aria-label="Go to {s.label}"
        title={s.label}
        onclick={() => onjump(s.id)}
      ></button>
    {/each}
  </nav>
</div>

<style>
  .bar {
    position: fixed;
    left: 50%;
    bottom: 14px;
    transform: translateX(-50%);
    z-index: 30;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 6px 12px;
    width: max-content;
    max-width: calc(100% - 24px);
    padding: 8px 14px;
    border-radius: 14px;
    color: #fff;
    font-family: var(--display);
    font-size: 0.95rem;
    box-shadow: 0 8px 26px rgba(25, 30, 59, 0.28);
    transition: background-color 0.4s ease;
  }
  .leg { display: inline-flex; align-items: center; gap: 7px; }
  .word { font-size: 0.8rem; opacity: 0.9; }
  .home { font-weight: 700; }
  .jet { width: 20px; flex: none; fill: #fff; }
  .stops { display: inline-flex; align-items: center; gap: 2px; margin-left: 4px; }
  .stops button {
    position: relative;
    width: 20px;
    height: 24px;
    padding: 0;
    border: none;
    border-radius: 6px;
    background: none;
  }
  .stops button::after {
    content: '';
    position: absolute;
    left: 50%; top: 50%;
    width: 8px; height: 8px;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255, 255, 255, 0.45);
  }
  .stops button:hover::after { background: rgba(255, 255, 255, 0.8); }
  .stops button.on::after { width: 11px; height: 11px; background: #fff; }
  .stops button:focus-visible { outline: 2px solid #fff; }

  @media (prefers-reduced-motion: reduce) {
    .bar { transition: none; }
  }
</style>
