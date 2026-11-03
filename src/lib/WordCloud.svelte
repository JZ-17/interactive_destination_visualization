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
  <div class="dial">
    <label for="others">
      Keep words found in at most <strong>{maxOthers}</strong> other {maxOthers === 1 ? 'city' : 'cities'}
    </label>
    <input id="others" type="range" min="0" max="49" bind:value={maxOthers} style="--plane:{thumb(ticket)}" />
    <p class="scale" aria-hidden="true"><span>only {city.city}</span><span>all 50</span></p>
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

  <div class="verdict">
    <div class="stamp-box">
      <Stamp value="{Math.round(score.share * 100)}%" rim="ONLY IN {city.city.toUpperCase()} • ONLY IN {city.city.toUpperCase()} •" code={IATA[city.city]} />
    </div>
    <div>
      <p class="big">
        {score.unique} of the {score.total} different words {city.city} writes, no other city writes at all.
      </p>
      <p class="small">
        Its description runs {city.wordCount} words, {score.lengthRank === 1 ? 'the longest' : score.lengthRank === 50 ? 'the shortest' : `the ${ord(score.lengthRank)} longest`} of the fifty.
        Longer sites have more room for a word nobody else used.
      </p>
    </div>
  </div>
</div>

<style>
  .cloud-scene { width: min(1180px, 100%); margin-inline: auto; padding-inline: 16px; }

  .dial { width: min(620px, 100%); margin-inline: auto; display: flex; flex-direction: column; gap: 6px; }
  .dial label { font-size: 0.95rem; text-align: center; color: var(--text-secondary); }
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

  .verdict {
    display: grid;
    grid-template-columns: minmax(150px, 230px) minmax(0, 560px);
    justify-content: center;
    align-items: center;
    gap: clamp(20px, 4vw, 48px);
    margin-top: 56px;
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
