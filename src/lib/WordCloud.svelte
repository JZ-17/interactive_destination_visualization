<script>
  /**
   * What is left of a city once the words everyone shares go out.
   *
   * Every word the site writes, in a fixed scatter. The slider only lights and
   * dims them, so a word never moves while you watch it. This one view dims
   * where the rest of the site filters because watching the common words go out
   * is the point, and nothing downstream reads from it.
   */
  import Stamp from './Stamp.svelte';
  import { cloudField, litWords, IATA } from './data.js';
  import { PLANE } from './ticketArt.js';
  import { prefersStill } from './scroll.js';

  let { city, cloudIndex, ticket = '#7b6a60' } = $props();

  let maxOthers = $state(2);
  let hover = $state(null);
  const still = prefersStill();

  let field = $derived(cloudField(city, cloudIndex));
  let lit = $derived(litWords(field, { maxOthers }));
  let top = $derived(Math.max(1, ...field.map((w) => w.count)));
  let score = $derived(cloudIndex.scores.get(city.city));
  // A big site's cloud shrinks, but the floor stays readable.
  let zoom = $derived(Math.min(1, Math.max(0.55, Math.sqrt(170 / Math.max(1, field.length)))));

  const sizeOf = (n) => 13 + Math.sqrt((n - 1) / Math.max(1, top - 1)) * 40 * zoom;
  const drift = (w) => `translateY(${(w.seed - 0.5) * 16}px) rotate(${(((w.seed * 7) % 1) - 0.5) * 5}deg)`;
  const delay = (w) => (still ? 0 : (((w.seed * 10007) % 1) * 0.45).toFixed(3));

  const ord = (n) => {
    const teen = n % 100 >= 11 && n % 100 <= 13;
    return n + (teen ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th');
  };

  const thumb = (color) => `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="188 107 38 37"><path d="${PLANE}" fill="${color}"/></svg>`
  )}")`;
</script>

<div class="cloud-scene">
  <!-- What the cloud is and what the slider does, said once, before either:
       the same heading-and-line opening as every other scene. -->
  <header class="scene-head">
    <h2>Explore {city.city}’s fingerprint</h2>
    <p class="lede">
      Every word on {city.city}’s site, sized by how often it writes it. Drag the slider to
      fade out the words other cities use too. The words that stay dark are the ones
      few or no other cities write.
    </p>
  </header>

  <!-- The slider and the cloud it filters share one box, so the slider stays
       pinned while the cloud scrolls past and lets go before the stamp. -->
  <div class="cloud-area">
  <div class="dial">
    <label for="others">
      <span>
        {#if maxOthers === 0}
          Showing words <strong>no other city</strong> uses
        {:else if maxOthers === 49}
          Showing <strong>every word</strong>, however common
        {:else}
          Showing words that at most <strong>{maxOthers}</strong> other {maxOthers === 1 ? 'city uses' : 'cities use'}
        {/if}
      </span>
      <span class="left" aria-live="polite"><strong>{lit.size}</strong> of {field.length} words left</span>
    </label>
    <input id="others" type="range" min="0" max="49" bind:value={maxOthers} style="--plane:{thumb(ticket)}" />
    <p class="scale" aria-hidden="true"><span>only {city.city}</span><span>every word</span></p>
  </div>

  <ul class="cloud" aria-label="Every word {city.city} writes" onmouseleave={() => (hover = null)}>
    {#each field as w (w.word)}
      <li class:dim={hover && hover !== w.word} style="transform:{still ? 'none' : drift(w)}">
        <button
          class:out={!lit.has(w.word)}
          style="font-size:{sizeOf(w.count)}px; transition-delay:{delay(w)}s"
          onmouseenter={() => (hover = w.word)}
          onfocus={() => (hover = w.word)}
          onclick={() => (hover = hover === w.word ? null : w.word)}
        >
          {w.word}
          <span class="sr-only">, written {w.count} {w.count === 1 ? 'time' : 'times'}, found in {w.others} other {w.others === 1 ? 'city' : 'cities'}</span>
        </button>
        <span class="tip" aria-hidden="true">
          <strong>{w.count}×</strong> here,
          {w.others === 0 ? 'nobody else' : `${w.others} other ${w.others === 1 ? 'city' : 'cities'}`}
        </span>
      </li>
    {/each}
  </ul>

  </div>

  <div class="verdict">
    <div class="stamp-box">
      <Stamp value="{Math.round(score.share * 100)}%" rim="ONLY IN {city.city.toUpperCase()} • ONLY IN {city.city.toUpperCase()} •" code={IATA[city.city]} />
    </div>
    <div>
      <p class="big">
        {score.unique} of the {score.total} different words {city.city} writes, no other city writes at all.
      </p>
      <p class="small">
        Keep in mind that its description runs {city.wordCount.toLocaleString('en-US')} words, {score.lengthRank === 1 ? 'the longest' : score.lengthRank === 50 ? 'the shortest' : `the ${ord(score.lengthRank)} longest`} of the fifty.
        Longer sites have more room for a word nobody else used.
      </p>
    </div>
  </div>
</div>

<style>
  .cloud-scene { width: min(1180px, 100%); margin-inline: auto; padding-inline: 16px; }
  /* The heading keeps the shared scene measure even though the cloud runs wider. */
  .scene-head { width: min(calc(var(--scene-w) - 32px), 100%); margin: 0 auto 8px; }
  h2 { font-family: var(--display); font-size: var(--scene-h2); font-weight: 400; letter-spacing: -0.01em; line-height: 1.1; text-wrap: balance; }
  .lede { margin-top: 8px; max-width: 62ch; line-height: 1.5; color: var(--text-secondary); }

  /* Pinned to the top of the screen while the cloud below it is in view: the
     reader can drag the threshold and watch words drop out without scrolling
     back up. The page colour behind it, fading out at its foot, keeps the
     words passing underneath from showing through its labels. */
  .dial {
    position: sticky;
    top: 0;
    z-index: 4;
    /* The band spans the whole cloud so no word shows beside the slider; the
       slider and its labels keep their own narrower measure inside it. */
    width: 100%;
    padding: 14px 0 22px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    background: linear-gradient(180deg, #f3f6fb 80%, rgba(243, 246, 251, 0));
  }
  /* :is() lifts this above the range input's own `width: 100%`. */
  .dial > :is(label, input, .scale) { width: min(620px, 100%); }
  .dial label { display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 0.95rem; text-align: center; color: var(--text-secondary); }
  .dial .left { font-size: 0.8rem; color: var(--text-muted); font-variant-numeric: tabular-nums; }
  .dial strong { color: var(--text-primary); }
  input[type='range'] {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 32px;
    margin: 0;
    background: none;
    cursor: pointer;
  }
  input[type='range']:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 3px; border-radius: 4px; }
  input[type='range']::-webkit-slider-runnable-track {
    height: 2px;
    background: repeating-linear-gradient(90deg, var(--text-muted) 0 7px, transparent 7px 13px);
  }
  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 36px;
    height: 32px;
    margin-top: -15px;
    border: none;
    background: var(--plane) center / contain no-repeat;
  }
  input[type='range']::-moz-range-track {
    height: 2px;
    background: repeating-linear-gradient(90deg, var(--text-muted) 0 7px, transparent 7px 13px);
  }
  input[type='range']::-moz-range-thumb {
    width: 36px;
    height: 32px;
    border: none;
    background: var(--plane) center / contain no-repeat;
  }
  .scale { display: flex; justify-content: space-between; font-size: 0.74rem; color: var(--text-muted); }

  .cloud {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 6px 15px;
    margin: 34px 0 0;
    padding: 10px 0;
    list-style: none;
  }
  .cloud li { position: relative; }
  .cloud li.dim { opacity: 0.28; }
  .cloud button {
    padding: 0 2px;
    border: none;
    background: none;
    font-family: var(--display);
    line-height: 1.1;
    color: var(--text-primary);
    transition: opacity 0.5s ease;
  }
  .cloud button:hover { background: none; }
  .cloud button.out { opacity: 0.08; }
  .cloud button.out:hover, .cloud button.out:focus-visible { opacity: 0.4; }
  .cloud button:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; border-radius: 4px; }
  .tip {
    position: absolute;
    bottom: calc(100% - 2px);
    left: 50%;
    z-index: 3;
    padding: 3px 9px 4px;
    border-radius: 999px;
    background: var(--text-primary);
    color: #fff;
    font-size: 0.7rem;
    white-space: nowrap;
    /* display, not opacity: a transparent tip at the edge still widens the page. */
    display: none;
    transform: translateX(-50%);
    pointer-events: none;
  }
  .cloud li:hover .tip, .cloud li:focus-within .tip { display: block; }

  /* The verdict gets a screen of its own: once the cloud has scrolled away,
     the stamp and its sentence sit alone, centred, with nothing else in view. */
  .verdict {
    display: grid;
    grid-template-columns: minmax(150px, 230px) minmax(0, 560px);
    justify-content: center;
    align-content: center;
    align-items: center;
    gap: clamp(20px, 4vw, 48px);
    min-height: 100svh;
    padding-block: 48px;
  }
  .big { font-family: var(--display); font-size: clamp(1.5rem, 3.2vw, 2.3rem); line-height: 1.16; letter-spacing: -0.012em; }
  .small { margin-top: 12px; font-size: 0.86rem; line-height: 1.5; color: var(--text-secondary); }

  @media (max-width: 620px) {
    .verdict { grid-template-columns: 1fr; justify-items: center; text-align: center; }
    .stamp-box { width: 190px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .cloud button { transition: none; }
  }
</style>
