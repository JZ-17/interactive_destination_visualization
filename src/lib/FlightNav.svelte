<script>
  /**
   * The flight strip: where you are in the story, and the one control that
   * changes where you are going.
   *
   * It exists because the destination used to be changeable only from
   * whichever sentence happened to name it — a dropdown hidden inside a
   * headline, then another inside a card heading, each one a surprise. One
   * control, always in the same place, is both easier to find and easier to
   * ignore; the sentences above can go back to being sentences.
   *
   * The track is the flight. The plane sits at how far through the story you
   * have scrolled, the pin at the end is the destination, and the dots are
   * the frames between here and there — clickable, which is what makes this
   * a navigation bar rather than a progress bar.
   *
   * Art comes from ticketArt.js: the same jet as the boarding pass and the
   * same pin as the atlas map, so there is one of each in this project.
   */
  import CitySelect from './CitySelect.svelte';
  import { PLANE, PIN } from './ticketArt.js';

  let {
    cities = [],
    selected = '',
    /** 0 leaving the atlas, 1 at the foot of the page. */
    progress = 0,
    /** `{ id, label, at }`, `at` being 0..1 along the same track. */
    stops = [],
    onpick,
    onjump
  } = $props();

  let pct = $derived(Math.min(1, Math.max(0, progress)) * 100);
</script>

<nav class="strip" aria-label="Your flight">
  <div class="track">
    <!-- No viewBox on purpose: user units are then CSS pixels, so the dash
         pattern keeps its proportions and its round caps at every width
         instead of being stretched with the bar. -->
    <svg class="rule" height="6" aria-hidden="true">
      <line x1="0" y1="3" x2="100%" y2="3" />
    </svg>

    {#each stops as s (s.id)}
      <button
        class="stop"
        class:done={progress >= s.at - 0.001}
        style="left:{s.at * 100}%"
        title={s.label}
        aria-label="Go to {s.label}"
        onclick={() => onjump?.(s.id)}
      ></button>
    {/each}

    <span class="plane" style="left:{pct}%" aria-hidden="true">
      <svg viewBox="188 107 38 37"><path d={PLANE} /></svg>
    </span>

    <span class="dest" aria-hidden="true">
      <svg viewBox="0 0 46 53"><path d={PIN} /></svg>
      <span class="dot"></span>
    </span>
  </div>

  <CitySelect
    id="dest-strip"
    value={selected}
    {cities}
    variant="bare"
    onpick={(v) => onpick?.(v)}
  />
</nav>

<style>
  .strip {
    position: fixed;
    left: 50%;
    bottom: clamp(12px, 2.2vw, 22px);
    transform: translateX(-50%);
    z-index: 40;
    display: flex;
    align-items: center;
    gap: clamp(12px, 2vw, 26px);
    width: min(1180px, calc(100% - 32px));
    padding: 10px clamp(14px, 2vw, 26px);
    background: #fff;
    border-radius: 22px;
    box-shadow:
      0 12px 34px rgba(74, 45, 28, 0.13),
      0 2px 8px rgba(74, 45, 28, 0.07);
    font-family: var(--display);
  }

  .track {
    position: relative;
    flex: 1;
    height: 42px;
    min-width: 0;
  }

  /* Inset by the cap radius at both ends so the first and last dash sit
     inside the bar rather than being clipped by it. */
  /* An explicit width, because an <svg> carrying no width attribute has no
     intrinsic size: `width: auto` then resolves to the replaced-element
     default of 300px and the dashes stop a third of the way across,
     whatever `left` and `right` say. */
  .rule {
    position: absolute;
    left: 3px;
    top: 50%;
    width: calc(100% - 6px);
    transform: translateY(-50%);
    overflow: visible;
  }
  .rule line {
    stroke: #d8b7b7;
    stroke-width: 3.5;
    stroke-linecap: round;
    stroke-dasharray: 17 12;
  }

  .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #5f3f2c;
  }

  /* The frames between here and the end. Small, because the plane is the
     thing worth looking at; they grow when you reach for one. */
  .stop {
    position: absolute;
    top: 50%;
    width: 22px;
    height: 22px;
    padding: 0;
    transform: translate(-50%, -50%);
    border: none;
    background: none;
    cursor: pointer;
    border-radius: 50%;
  }
  .stop::after {
    content: '';
    display: block;
    width: 8px;
    height: 8px;
    margin: 0 auto;
    border-radius: 50%;
    background: #cfa9a9;
    transition: background 0.15s ease, transform 0.15s ease;
  }
  .stop.done::after {
    background: #8d7263;
  }
  .stop:hover::after,
  .stop:focus-visible::after {
    background: #4a2d1c;
    transform: scale(1.45);
  }
  .stop:focus-visible {
    outline: 2px solid #4a2d1c;
    outline-offset: 1px;
  }

  .plane {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 34px;
    line-height: 0;
    /* It rides the scroll; a transition would make it lag behind the page
       it is reporting on. */
    pointer-events: none;
  }
  .plane svg {
    display: block;
    width: 100%;
    height: auto;
    fill: #5f3f2c;
  }

  /* The pin's tip lands on the line, the dot sits under it, same as the
     map — so the end of the track reads as a place, not a stop button. */
  .dest {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translate(50%, -50%);
    width: 9px;
    height: 9px;
    pointer-events: none;
  }
  .dest svg {
    position: absolute;
    left: 50%;
    bottom: 50%;
    width: 19px;
    height: auto;
    transform: translateX(-50%);
    fill: #4a2d1c;
  }
  .dest .dot {
    position: absolute;
    inset: 0;
  }

  @media (max-width: 620px) {
    .strip {
      gap: 10px;
      padding: 8px 12px;
    }
    .track { height: 34px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .stop::after { transition: none; }
  }
</style>
