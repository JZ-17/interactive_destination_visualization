<script>
  /**
   * The one colour legend the project needs. Colour means category and nothing
   * else, in every view, in both prototypes — so there is exactly one of these.
   */
  let { note = true } = $props();
</script>

<div class="legend">
  <span class="item"><i class="sw big"></i>Big destination</span>
  <span class="item"><i class="sw gem"></i>Hidden gem</span>
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
  /* A ring, not a disc: on the globe the category is the marker's ring, since
     every country underneath is a different colour. */
  .sw {
    width: 12px; height: 12px; border-radius: 50%;
    display: inline-block; box-sizing: border-box;
    background: #fffdf8; border: 3px solid;
  }
  .sw.big { border-color: var(--big); }
  .sw.gem { border-color: var(--gem); }
  .caveat { color: var(--text-muted); font-size: 0.7rem; max-width: 52ch; }
</style>
