<script>
  /**
   * Who a city sounds like, as a grid of who agrees with whom.
   *
   * One row per city some measure names, one column per measure. A filled dot
   * says "this measure picks this city", with the shared words under it where
   * the measure has any. When two measures agree the city fills two dots, so
   * the disagreement between the four definitions (CLAUDE.md: never present
   * one as "the" twin) is the picture itself rather than a caveat about it.
   */
  import { TWIN_METHODS } from './data.js';

  let { city } = $props();

  const COUNT = ['none', 'one', 'two', 'three', 'four'];

  /** "Same distinctive words" -> "Distinctive words". */
  const short = (label) => {
    const s = label.replace(/^Same\s+/i, '');
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  let methods = $derived(
    TWIN_METHODS.map((m) => ({
      id: m.id,
      label: m.label,
      head: short(m.label),
      partner: city.twins[m.id].partner,
      shared: city.twins[m.id].shared.slice(0, 3)
    }))
  );
  let partners = $derived([...new Set(methods.map((m) => m.partner).filter(Boolean))]);
</script>

<table class="agree">
  <caption class="sr-only">Which city each of four measures says {city.city} sounds most like</caption>
  <thead>
    <tr>
      <td></td>
      {#each methods as m (m.id)}<th scope="col">{m.head}</th>{/each}
    </tr>
  </thead>
  <tbody>
    {#each partners as p (p)}
      <tr>
        <th scope="row">{p}</th>
        {#each methods as m (m.id)}
          <td>
            {#if m.partner === p}
              <span class="dot" aria-hidden="true"></span>
              <span class="sr-only">{m.label}{m.shared.length ? `: ${m.shared.join(', ')}` : ''}</span>
              {#if m.shared.length}<span class="w" aria-hidden="true">{m.shared.join(' · ')}</span>{/if}
            {:else}
              <span class="off" aria-hidden="true"></span>
            {/if}
          </td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>
<p class="caveat">
  Four measures, {COUNT[partners.length]} {partners.length === 1 ? 'answer' : 'answers'}.
  Each is a closest match, not a percentage.
</p>

<style>
  .agree { width: 100%; margin-top: 14px; border-collapse: collapse; table-layout: fixed; }
  thead th {
    padding: 0 4px 10px;
    font-size: 0.78rem;
    font-weight: 400;
    line-height: 1.25;
    color: var(--text-muted);
    text-align: center;
    vertical-align: bottom;
  }
  thead td { width: 30%; }
  tbody th {
    padding: 12px 8px 12px 0;
    font-family: var(--display);
    font-size: clamp(1.25rem, 2.4vw, 1.6rem);
    font-weight: 400;
    text-align: left;
    border-top: 1px solid #d6ddea;
  }
  tbody td {
    padding: 12px 4px;
    text-align: center;
    vertical-align: middle;
    border-top: 1px solid #d6ddea;
  }
  .dot {
    display: block;
    width: 20px;
    height: 20px;
    margin: 0 auto;
    border-radius: 50%;
    background: var(--ticket);
    transition: background 0.4s ease;
  }
  .off {
    display: block;
    width: 9px;
    height: 9px;
    margin: 0 auto;
    border-radius: 50%;
    border: 1.5px solid #c9d1e0;
  }
  .w { display: block; margin-top: 5px; font-size: 0.74rem; line-height: 1.3; color: var(--text-secondary); }
  .caveat { margin-top: 14px; font-size: 0.82rem; line-height: 1.45; color: var(--text-secondary); }
  .sr-only {
    position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
  }
</style>
