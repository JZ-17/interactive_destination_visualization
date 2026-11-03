<script>
  /**
   * The ticket once it has scrolled away: the same two dropdowns and the same
   * colour, plus one dot per scene in this journey so a long scroll can be
   * skipped through.
   */
  import CitySelect from './CitySelect.svelte';
  import { PLANE } from './ticketArt.js';

  let {
    cities = [],
    from = '',
    to = '',
    color = '#7b6a60',
    stops = [],
    active = '',
    onpick = () => {},
    onjump = () => {}
  } = $props();
</script>

<div class="bar" style="background:{color}" role="group" aria-label="Your flight">
  <span class="leg">
    <span class="word">From</span>
    <CitySelect id="bar-from" value={from} {cities} taken={to} clearable label="Flying from" placeholder="Choose" onpick={(v) => onpick('from', v)} />
  </span>
  <svg class="jet" viewBox="188 107 38 37" aria-hidden="true"><path d={PLANE} /></svg>
  <span class="leg">
    <span class="word">To</span>
    <CitySelect id="bar-to" value={to} {cities} taken={from} clearable label="Flying to" placeholder="Choose" onpick={(v) => onpick('to', v)} />
  </span>
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
