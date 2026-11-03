<script>
  /**
   * The boarding pass, with its FROM and TO codes as the page's two dropdowns.
   *
   * A native <select> lies invisibly over each code, so the printed code IS the
   * control and the browser's own menu does the picking. The visible field is
   * only as big as the code; the city and country print quietly beneath it. On
   * a phone the select reaches past the visible field, so it stays easy to hit.
   * Fields are placed in percentages of the ticket's 671x297 artboard, so they
   * stay registered at any width.
   */
  import BoardingPass from './BoardingPass.svelte';
  import { IATA } from './data.js';

  let {
    cities = [],
    from = null,
    to = null,
    /** The city whose personality the ticket is wearing, if any. */
    vibeCity = null,
    time = '',
    date = '',
    onpick = () => {}
  } = $props();

  const FIELDS = [
    { which: 'from', label: 'Flying from', x: 33 },
    { which: 'to', label: 'Flying to', x: 255 }
  ];
  const Y = 99;
  const W = 110;
  const H = 42;

  let held = $derived({ from, to });
  /** The field waiting to be filled gets the stronger outline. */
  let next = $derived(!from ? 'from' : !to ? 'to' : null);
</script>

<div class="wrap">
  <BoardingPass
    code={to ? IATA[to.city] : '———'}
    city={to ? to.city : 'Optional'}
    country={to ? to.country : ''}
    fromCode={from ? IATA[from.city] : '———'}
    fromCity={from ? from.city : 'Choose a city'}
    fromCountry={from ? from.country : ''}
    vibeOf={vibeCity?.city ?? ''}
    vibe={vibeCity?.personality ?? ''}
    {time}
    {date}
  />

  {#each FIELDS as f (f.which)}
    {@const value = held[f.which]?.city ?? ''}
    {@const taken = held[f.which === 'from' ? 'to' : 'from']?.city ?? ''}
    <div
      class="field"
      class:next={next === f.which}
      style="left:{(f.x / 671) * 100}%; top:{(Y / 297) * 100}%; width:{(W / 671) * 100}%; height:{(H / 297) * 100}%"
    >
      <label class="sr-only" for="ticket-{f.which}">{f.label}</label>
      <select
        id="ticket-{f.which}"
        {value}
        disabled={!cities.length}
        onchange={(e) => onpick(f.which, e.currentTarget.value)}
      >
        {#if value}
          <option value="">Clear this city</option>
        {:else}
          <option value="" disabled>Choose a city</option>
        {/if}
        {#each cities as c (c.city)}
          <option value={c.city} disabled={c.city === taken}>{c.city}</option>
        {/each}
      </select>
      <svg class="caret" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.6 6 6.6 11 1.6Z" /></svg>
    </div>
  {/each}
</div>

<style>
  .wrap { position: relative; }

  .field {
    position: absolute;
    border-radius: 7px;
    background: rgba(255, 255, 255, 0.11);
    transition: background-color 0.12s ease;
  }
  .field:hover { background: rgba(255, 255, 255, 0.2); }
  .field.next { box-shadow: inset 0 0 0 1.5px #fff; }
  .field:focus-within { outline: 2px solid #fff; outline-offset: 2px; }

  select {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    appearance: none;
    border: none;
    padding: 0;
    font-size: 16px; /* below this, iOS zooms the page on focus */
    cursor: pointer;
  }

  .caret {
    position: absolute;
    top: 50%;
    right: 7%;
    width: 9%;
    min-width: 6px;
    transform: translateY(-50%);
    fill: #fff;
    pointer-events: none;
  }

  @media (max-width: 560px) {
    select { inset: -12px; width: calc(100% + 24px); height: calc(100% + 24px); }
  }
  @media (prefers-reduced-motion: reduce) {
    .field { transition: none; }
  }
</style>
