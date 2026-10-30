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

<span class="holder {variant}">
  <label class="sr-only" for={id}>Change destination</label>
  <select {id} {value} onchange={(e) => onpick?.(e.currentTarget.value)}>
    {#if !value}
      <option value="" disabled>select destination</option>
    {/if}
    {#each cities as c (c.city)}
      <option value={c.city}>{c.city}</option>
    {/each}
  </select>
  <span class="name">{value || 'select destination'}</span>
  <svg class="caret" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.6 6 6.6 11 1.6Z" /></svg>
</span>

<style>
  .holder {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.34em;
    padding: 0.04em 0.44em 0.08em;
    border: 1px solid #fff;
    border-radius: 0.34em;
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
    font-weight: 700;
    white-space: nowrap;
  }
  .caret {
    width: 0.4em;
    flex: none;
    fill: currentColor;
  }

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
