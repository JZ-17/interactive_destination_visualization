<script>
  /**
   * Who a city sounds like, four ways, as luggage tags hung from one rail. Four
   * tags on purpose: the definitions rarely agree, and seeing them disagree is
   * the honest answer. With `onpick` a tag is a button that flies on to that
   * city; without it the tags are for reading only, as in the one-city
   * journey, where comparing waits for the arrival.
   */
  import { TWIN_METHODS } from './data.js';

  let { city, current = '', onpick = null } = $props();

  let tags = $derived(
    TWIN_METHODS.map((m) => ({
      ...m,
      partner: city.twins[m.id].partner,
      shared: city.twins[m.id].shared.slice(0, 3)
    }))
  );
  const PLAIN = {
    theme: 'Talks about the same themes in the same proportions',
    personality: 'Uses the same selling moves'
  };
</script>

{#snippet face(t)}
  <span class="how">{t.label}</span>
  <span class="who">{t.partner}</span>
  <span class="why">{t.shared.length ? `Both use: ${t.shared.join(', ')}` : PLAIN[t.id]}</span>
{/snippet}

<div class="rail">
  <ul class:live={!!onpick}>
    {#each tags as t, i (t.id)}
      <li style="--swing:{[-2.5, 1.8, -1.4, 2.6][i]}deg">
        {#if onpick}
          <button class="tag" aria-pressed={current === t.partner} onclick={() => onpick(t.partner)}>{@render face(t)}</button>
        {:else}
          <div class="tag" class:on={current === t.partner}>{@render face(t)}</div>
        {/if}
      </li>
    {/each}
  </ul>
</div>
<p class="caveat">
  Four ways to measure “sounds like”, and they rarely agree. Each names a closest
  match, not a percentage: the strongest pair in the data scores only 0.169 on a
  0 to 1 scale.
</p>

<style>
  /* The dashed rail the four tags hang from. */
  .rail { border-top: 2px dashed var(--ticket); margin-top: 10px; transition: border-color 0.4s ease; }
  ul {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(160px, 100%), 1fr));
    gap: 8px 12px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    position: relative;
    padding-top: 26px;
    transform: rotate(var(--swing));
    transform-origin: 50% 0;
    transition: transform 0.25s ease;
  }
  /* Only a tag that does something straightens up when pointed at. */
  .live li:hover { transform: rotate(0deg); }
  /* The string. */
  li::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 0;
    height: 36px;
    border-left: 1.5px solid var(--ticket);
  }
  .tag {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    width: 100%;
    height: 100%;
    min-height: 150px;
    padding: 30px 12px 14px;
    border: 1px solid rgba(25, 30, 59, 0.16);
    border-radius: 14px 14px 10px 10px;
    clip-path: polygon(16% 0, 84% 0, 100% 13%, 100% 100%, 0 100%, 0 13%);
    background: #fffdfa;
    text-align: center;
  }
  /* The eyelet. */
  .tag::before {
    content: '';
    position: absolute;
    top: 7px;
    width: 11px;
    height: 11px;
    border-radius: 50%;
    border: 2px solid var(--ticket);
    background: #f3f6fb;
  }
  .live .tag:hover { background: #fff; }
  /* The city already being compared with, if it is one of the four. */
  .tag[aria-pressed='true'], .tag.on { background: var(--ticket); color: #fff; border-color: var(--ticket); }
  .tag[aria-pressed='true'] .how, .tag[aria-pressed='true'] .why,
  .tag.on .how, .tag.on .why { color: #fff; }
  .tag:focus-visible { outline: 2px solid var(--text-primary); outline-offset: -4px; }
  .how { font-size: 0.76rem; color: var(--text-muted); }
  .who { font-family: var(--display); font-size: 1.55rem; line-height: 1.1; }
  .why { font-size: 0.76rem; line-height: 1.35; color: var(--text-secondary); }
  .caveat { margin-top: 18px; max-width: 76ch; font-size: 0.8rem; line-height: 1.45; color: var(--text-secondary); }

  @media (prefers-reduced-motion: reduce) {
    li { transition: none; }
  }
</style>
