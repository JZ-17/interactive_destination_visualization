<script>
  /**
   * The one colour legend the project needs. Colour means category and nothing
   * else, in every view, in both prototypes — so there is exactly one of these.
   */
  let {
    note = true,
    /** Beside a globe, whose markers show category as a white or near-black ring. */
    markers = false
  } = $props();
</script>

<div class="legend">
  <span class="item"><i class="sw big"></i>{#if markers}<i class="mk big"></i>{/if}Big destination</span>
  <span class="item"><i class="sw gem"></i>{#if markers}<i class="mk gem"></i>{/if}Hidden gem</span>
  {#if markers}<span class="key">card border, then globe ring</span>{/if}
  {#if note}
    <span class="caveat">
      Hand-assigned labels — about 10 of the 50 sit on the wrong side of their
      own Wikipedia traffic (Chicago is tagged "hidden" on 3.6M views a year).
    </span>
  {/if}
</div>

<style>
  .legend {
    display: flex; align-items: center; flex-wrap: wrap; gap: 6px 16px;
    font-size: 0.75rem;
    color: var(--text-secondary);
  }
  .item { display: inline-flex; align-items: center; gap: 6px; }
  /* The category colour as cards draw it: a border round a light surface. */
  .sw {
    width: 12px; height: 12px; border-radius: 50%;
    display: inline-block; box-sizing: border-box;
    background: #fffdf8; border: 3px solid;
  }
  .sw.big { border-color: var(--big); }
  .sw.gem { border-color: var(--gem); }
  /* The same marker the globe draws: mid-grey here stands in for the city's
     own hue, the ring and halo are the category. See .dot in Globe.svelte. */
  .mk {
    width: 12px; height: 12px; border-radius: 50%;
    display: inline-block; box-sizing: border-box;
    background: #8d97a8; border: 2.5px solid;
  }
  .mk.big { border-color: #ffffff; box-shadow: 0 0 2px rgba(0, 0, 0, 0.95); }
  .mk.gem { border-color: #0a111c; box-shadow: 0 0 2px rgba(255, 255, 255, 0.95); }
  .key { color: var(--text-muted); font-size: 0.7rem; }
  .caveat { color: var(--text-muted); font-size: 0.7rem; max-width: 52ch; }
</style>
