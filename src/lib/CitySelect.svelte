<script>
  /**
   * The destination name, made switchable wherever it appears in a sentence
   * or a heading: a native <select> laid invisibly over the name itself, so
   * the written name IS the control. The browser's own menu does the picking,
   * which keeps keyboard and touch behaviour for free.
   *
   * Laying the select over the text is also the only way to size a native
   * select to its current value rather than to its widest option — otherwise
   * every mention of Brno would be as wide as "Luxembourg City".
   *
   * `sky` is the outlined version for the blue frame; `paper` is the white
   * pill for the pink ones.
   */
  let { value = '', cities = [], onpick, variant = 'sky', id = 'city' } = $props();
</script>

<span class="holder {variant}" class:empty={!value}>
  <label class="sr-only" for={id}>Change destination</label>
  <select {id} {value} onchange={(e) => onpick?.(e.currentTarget.value)}>
    {#if !value}
      <option value="" disabled>Select destination</option>
    {/if}
    {#each cities as c (c.city)}
      <option value={c.city}>{c.city}</option>
    {/each}
  </select>
  <span class="name">{value || 'Select destination'}</span>
  <svg class="caret" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.6 6 6.6 11 1.6Z" /></svg>
</span>

<style>
  /*
   * Centred on what you can SEE, on both axes, which is not what either
   * default gives you.
   *
   * Across: the name and the caret are one group in normal flow, centred
   * together. Centring the name alone and parking the caret in the padding
   * is geometrically correct and looks wrong — the eye reads "Seoul ▾" as
   * the content and sees it shunted right.
   *
   * Down: Manjari carries a deep descender slot for Malayalam, so a line box
   * centred in the pill leaves a capitalised city name riding high — "Seoul"
   * measured 6.5px of air above and 19.9px below. The padding is therefore
   * asymmetric by design: it centres the CAP BAND, baseline to cap height,
   * which is the band a Title Case name actually fills. Descenders hang
   * below it, as they do in any well-set button.
   *
   * Both paddings are in ems of the surrounding type, and the line box is
   * pinned to 1.2 rather than inherited, so the pill sits the same way in
   * the 2.1rem sky headline and the 1.3rem deck heading.
   */
  .holder {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.3em;
    padding: 0.415em 0.62em 0;
    line-height: 1.2;
    vertical-align: baseline;
    border: 1px solid #fff;
    border-radius: 0.4em;
    cursor: pointer;
    transition: background 0.12s ease, box-shadow 0.12s ease;
  }

  /* Transparent and on top: the click target is the whole name. */
  .holder select {
    position: absolute;
    inset: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    opacity: 0;
    appearance: none;
    border: none;
    font: inherit;
    cursor: pointer;
  }
  .holder:focus-within {
    outline: 2px solid currentColor;
    outline-offset: 3px;
  }

  .name {
    display: block;
    font-weight: 700;
    white-space: nowrap;
  }
  /* Before a city is picked the placeholder is the longest string the pill
     ever shows; dropping it off bold keeps the empty state from shouting. */
  .holder.empty .name { font-weight: 400; }

  /* In flow, so it is centred as part of the group — but nudged back up by
     the same amount the name was nudged down, since the name's padding
     moves the caret with it and the caret has no cap band of its own. */
  .caret {
    width: 0.4em;
    flex: none;
    margin-top: -0.385em;
    fill: currentColor;
  }

  /* For the flight strip: no pill at all, because the strip is already the
     raised white surface and a pill inside it is a box inside a box. */
  .bare {
    border-color: transparent;
    background: none;
    padding-right: 1.15em;
  }
  .bare:hover { background: rgba(74, 45, 28, 0.07); }
  .bare .caret { width: 0.52em; }

  .sky { background: rgba(255, 255, 255, 0.22); }
  .sky:hover { background: rgba(255, 255, 255, 0.4); }

  .paper {
    background: #fff;
    box-shadow:
      0 1px 6px rgba(0, 0, 0, 0.06),
      inset 0 -1.5px 0 rgba(0, 0, 0, 0.09);
  }
  .paper:hover {
    box-shadow:
      0 3px 11px rgba(0, 0, 0, 0.09),
      inset 0 -1.5px 0 rgba(0, 0, 0, 0.13);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  @media (prefers-reduced-motion: reduce) {
    .holder { transition: none; }
  }
</style>
