<script>
  /**
   * What each of two cities talks about: themes down the middle, one bar out to
   * each side on one length scale, every value printed. Scaled to this pair, so
   * the bars fill the space; the printed numbers carry across pairs.
   */
  import { THEMES, VOICE_TICKET } from './data.js';

  let { a, b } = $props();

  let top = $derived(Math.max(1, ...THEMES.flatMap((t) => [a.themes[t], b.themes[t]])));
  let gap = $derived(
    [...THEMES].sort(
      (x, y) => Math.abs(a.themes[y] - b.themes[y]) - Math.abs(a.themes[x] - b.themes[x])
    )[0]
  );
  let ahead = $derived(a.themes[gap] >= b.themes[gap] ? a : b);
  let behind = $derived(ahead === a ? b : a);
</script>

<div class="duel">
  <p class="headline">
    The widest gap is <strong>{gap}</strong>: {ahead.city} at {ahead.themes[gap].toFixed(1)},
    {behind.city} at {behind.themes[gap].toFixed(1)}.
  </p>

  <div class="names">
    <span>{a.city}</span><span class="unit">mentions per 1,000 words</span><span>{b.city}</span>
  </div>

  <ul>
    {#each THEMES as t (t)}
      <li>
        <span class="v" class:arch={a.dominantTheme === t}>{a.themes[t].toFixed(1)}</span>
        <span class="track left">
          <span class="fill" style="width:{(a.themes[t] / top) * 100}%; background:{VOICE_TICKET[a.personality]}"></span>
        </span>
        <span class="theme">{t}</span>
        <span class="track">
          <span class="fill" style="width:{(b.themes[t] / top) * 100}%; background:{VOICE_TICKET[b.personality]}"></span>
        </span>
        <span class="v right" class:arch={b.dominantTheme === t}>{b.themes[t].toFixed(1)}</span>
      </li>
    {/each}
  </ul>

  <p class="key">Bold is the theme that city over-indexes on, which isn’t always its longest bar.</p>
</div>

<style>
  .duel { width: min(980px, 100%); margin-inline: auto; padding-inline: 16px; }
  .headline {
    max-width: 30ch;
    margin: 0 auto 30px;
    font-family: var(--display);
    font-size: clamp(1.4rem, 3vw, 2.1rem);
    line-height: 1.16;
    text-align: center;
  }
  .headline strong { font-weight: 700; }
  .names {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 10px;
    font-family: var(--display);
    font-size: 1.35rem;
  }
  .names span:last-child { text-align: right; }
  .unit { font-family: var(--font); font-size: 0.74rem; color: var(--text-muted); }
  ul { margin: 0; padding: 0; list-style: none; }
  li {
    display: grid;
    grid-template-columns: 3em 1fr clamp(92px, 16vw, 150px) 1fr 3em;
    align-items: center;
    gap: 8px;
    padding: 5px 0;
    border-radius: 6px;
  }
  li:hover { background: rgba(25, 30, 59, 0.05); }
  .v { font-size: 0.84rem; font-variant-numeric: tabular-nums; color: var(--text-secondary); }
  .v.right { text-align: right; }
  .v.arch { font-weight: 700; color: var(--text-primary); }
  .theme { font-size: 0.86rem; text-align: center; line-height: 1.15; }
  .track { display: flex; height: 18px; }
  .track.left { justify-content: flex-end; }
  .fill { display: block; height: 100%; border-radius: 0 4px 4px 0; transition: width 0.45s ease; }
  .left .fill { border-radius: 4px 0 0 4px; }
  .key { margin-top: 12px; font-size: 0.78rem; color: var(--text-secondary); text-align: center; }

  @media (prefers-reduced-motion: reduce) {
    .fill { transition: none; }
  }
</style>
