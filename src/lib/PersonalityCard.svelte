<script>
  /**
   * A city's personality card: tarot on the front, the fine print on the back.
   *
   * The card takes its personality's colour, like the ticket. Type is sized in
   * cqw against each face, so the same card reads at any size. `rotation` lets
   * a scene turn it with scrolling; a click flips it on its own inner axis, so
   * the two never fight.
   */
  import Emblem from './Emblem.svelte';
  import { PERSONALITIES, VOICE_BLURB, VOICE_SHORT, VOICE_TICKET, TICKET_DEFAULT } from './data.js';
  import { PLANE } from './ticketArt.js';

  let { city, rotation = 0, tilt = 0, canFlip = true } = $props();

  let flipped = $state(false);
  let showPattern = $derived(Math.abs(rotation) > 90);
  // Scrolling back turns the card over itself; a flip left on would cancel that out.
  $effect(() => {
    if (!canFlip) flipped = false;
  });

  let color = $derived(VOICE_TICKET[city.personality] ?? TICKET_DEFAULT);
  let also = $derived(
    [...PERSONALITIES]
      .filter((p) => p !== city.personality)
      .sort((x, y) => city.voice[y] - city.voice[x])
      .slice(0, 2)
  );
  const rays = Array.from({ length: 28 }, (_, i) => (i * 360) / 28);
</script>

<div class="scene" style="--c:{color}; transform: rotate({tilt}deg)">
  <div class="turn" style="transform: rotateY({rotation}deg)">
    <div class="flip" class:flipped>
      <!-- FRONT -->
      <div class="face front">
        <div class="frame">
          <header>
            <h3>{city.city}</h3>
            <p class="sub">{city.country}</p>
          </header>
          <div class="crest">
            <svg class="rays" viewBox="0 0 100 100" aria-hidden="true">
              {#each rays as a (a)}
                <line x1="50" y1="6" x2="50" y2={a % 25.7 < 6 ? 15 : 11} transform="rotate({a} 50 50)" />
              {/each}
            </svg>
            <div class="emblem"><Emblem name={city.personality} /></div>
          </div>
          <p class="title">{city.personality}</p>
          <p class="blurb">{VOICE_BLURB[city.personality]}</p>
          <p class="foot">
            <span>{city.category === 'hidden' ? 'Hidden gem' : 'Big destination'}</span>
            <span>{city.archetype}</span>
          </p>
        </div>
      </div>

      <!-- BACK -->
      <div class="face back">
        {#if showPattern}
          <div class="frame pattern" aria-hidden="true">
            <svg viewBox="188 107 38 37"><path d={PLANE} /></svg>
          </div>
        {:else}
          <div class="frame detail">
            <h3 class="small">{city.city}</h3>
            <dl>
              <dt>What it over-indexes on</dt>
              <dd><strong>{city.dominantTheme}</strong>, {city.themeOverIndex.toFixed(1)}× the fifty-city average</dd>
              <dt>Strength of its main move</dt>
              <dd><strong>{city.personalityStrength.toFixed(2)} standard deviations</strong> above the fifty-city average</dd>
              <dt>It also leans on</dt>
              {#each also as p (p)}
                <dd><strong>{p.replace('The ', '')}</strong>: {VOICE_SHORT[p]}</dd>
              {/each}
              <dt>Its signature word</dt>
              <dd><strong>{city.signatureWord || 'none'}</strong></dd>
            </dl>
            {#if city.siteLink}
              <a class="site" href={city.siteLink} target="_blank" rel="noreferrer">Read the tourism site</a>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
  {#if canFlip}
    <button
      class="flipper"
      aria-pressed={flipped}
      aria-label="Flip {city.city}’s card"
      onclick={() => (flipped = !flipped)}
    >{flipped ? 'Flip back' : 'Flip'}</button>
  {/if}
</div>

<style>
  .scene {
    position: relative;
    width: 100%;
    aspect-ratio: 5 / 7;
    perspective: 2400px;
    filter: drop-shadow(0 18px 26px rgba(25, 30, 59, 0.28));
    font-family: var(--font);
  }
  .turn, .flip { position: absolute; inset: 0; transform-style: preserve-3d; }
  .flip { transition: transform 0.65s cubic-bezier(0.3, 0.75, 0.25, 1); }
  .flip.flipped { transform: rotateY(180deg); }
  .face {
    position: absolute;
    inset: 0;
    container-type: inline-size;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    border-radius: 18px;
    background: var(--c);
    color: #fff;
    overflow: hidden;
    transition: background-color 0.4s ease;
  }
  .back { transform: rotateY(180deg); }
  .frame {
    position: absolute;
    inset: 3.2cqw;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 5cqw 5cqw 4cqw;
    border: 1.5px solid rgba(255, 255, 255, 0.75);
    border-radius: 12px;
    text-align: center;
  }
  header { width: 100%; }
  h3 {
    font-family: var(--display);
    font-size: 11.5cqw;
    font-weight: 400;
    line-height: 1.02;
    letter-spacing: -0.01em;
  }
  .sub { margin-top: 0.5cqw; font-size: 3.7cqw; opacity: 0.9; }
  .crest { position: relative; flex: 1; min-height: 0; width: 100%; display: grid; place-items: center; }
  .rays { position: absolute; height: 100%; max-width: 100%; aspect-ratio: 1; }
  .rays line { stroke: #fff; stroke-width: 0.5; stroke-linecap: round; opacity: 0.75; }
  .emblem { width: 34cqw; height: 34cqw; }
  .title { font-family: var(--display); font-size: 8.4cqw; line-height: 1.05; }
  .blurb { margin-top: 1cqw; min-height: 2.6em; font-size: 3.9cqw; line-height: 1.3; opacity: 0.95; }
  .foot {
    display: flex;
    justify-content: space-between;
    gap: 3cqw;
    width: 100%;
    margin-top: 2.5cqw;
    padding-top: 2.2cqw;
    border-top: 1px solid rgba(255, 255, 255, 0.45);
    font-size: 3.4cqw;
  }

  .pattern { justify-content: center; }
  .pattern::before {
    content: '';
    position: absolute;
    inset: 2.5cqw;
    border-radius: 8px;
    background: repeating-linear-gradient(45deg, rgba(255,255,255,.14) 0 1.2cqw, transparent 1.2cqw 3.6cqw);
  }
  .pattern svg { position: relative; width: 40cqw; fill: #fff; }

  .detail { align-items: flex-start; text-align: left; }
  .small { font-size: 10cqw; margin-bottom: 1cqw; }
  dl { margin: 0; width: 100%; flex: 1; }
  dt { margin-top: 5cqw; font-size: 3.8cqw; opacity: 0.85; }
  dd { margin: 1cqw 0 0; font-size: 5cqw; line-height: 1.25; }
  dd strong { font-weight: 650; }
  .site { font-size: 3.7cqw; color: #fff; text-underline-offset: 3px; }
  .site:hover { color: #fff; }
  .site:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

  .scene .flipper {
    position: absolute;
    left: 50%;
    bottom: -14px;
    transform: translateX(-50%);
    padding: 4px 13px;
    border-radius: 999px;
    border: none;
    background: #fff;
    color: #191e3b;
    font-size: 0.74rem;
    font-weight: 650;
    box-shadow: 0 2px 8px rgba(25, 30, 59, 0.25);
    white-space: nowrap;
  }
  .scene .flipper[aria-pressed='true'] { background: #fff; color: #191e3b; }
  .scene .flipper:focus-visible { outline: 2px solid #191e3b; outline-offset: 2px; }

  @media (prefers-reduced-motion: reduce) {
    .flip { transition: none; }
  }
</style>
