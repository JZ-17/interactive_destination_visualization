<script>
  /**
   * The front door, in two frames.
   *
   * FRAME 1 — pick a destination; the boarding pass fills in.
   * FRAME 2 — the words that city uses that nearly everyone else uses too.
   *
   * Frame 2 is the hook for the whole project: the reason "which cities sound
   * alike?" is worth asking is that the answer is "most of them, quite a lot".
   *
   * This frame has its own palette — the pink page and the brown ticket are
   * the intro's look, not the project's. The two data colours stay reserved
   * for city category and do not appear here, because nothing here encodes it.
   */
  import { onMount } from 'svelte';
  import {
    loadCities,
    wordIndex,
    commonWords,
    DESCRIBING_POOL,
    IATA
  } from '$lib/data.js';
  import BoardingPass from '$lib/BoardingPass.svelte';

  let cities = $state([]);
  let error = $state(null);
  let selected = $state('');      // the one piece of shared state on this page
  let sky;                        // frame 2's scroll track
  let progress = $state(0);       // 0 entering the track, 1 leaving it
  let reduced = $state(false);    // prefers-reduced-motion

  onMount(async () => {
    try {
      ({ cities } = await loadCities());
    } catch (e) {
      error = e.message;
    }
  });

  // Separate from the loader above: an async onMount cannot return a cleanup.
  onMount(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const readMotion = () => (reduced = motion.matches);
    readMotion();

    // Frame 2 is a tall track with a pinned stage inside it, so "how far down
    // the track are we" is the only input the flight needs.
    const read = () => {
      if (!sky) return;
      const { top, height } = sky.getBoundingClientRect();
      const span = height - window.innerHeight;
      progress = span > 0 ? Math.min(1, Math.max(0, -top / span)) : 0;
    };
    read();

    motion.addEventListener('change', readMotion);
    window.addEventListener('scroll', read, { passive: true });
    window.addEventListener('resize', read);
    return () => {
      motion.removeEventListener('change', readMotion);
      window.removeEventListener('scroll', read);
      window.removeEventListener('resize', read);
    };
  });

  // Alphabetical, so the dropdown is scannable. The CSV order is not.
  let sorted = $derived([...cities].sort((a, b) => a.city.localeCompare(b.city)));
  let city = $derived(cities.find((c) => c.city === selected) ?? null);

  // Built once over all fifty, not per selection: the whole point of the
  // count beside each word is that it is corpus-wide.
  let index = $derived(cities.length ? wordIndex(cities, DESCRIBING_POOL) : new Map());
  let words = $derived(city ? commonWords(city, index, 14) : []);

  // How many of the other 49 reach for at least one of those same words.
  let echoes = $derived.by(() => {
    if (!city) return 0;
    const others = new Set();
    for (const { word } of words) {
      for (const name of index.get(word) ?? []) {
        if (name !== city.city) others.add(name);
      }
    }
    return others.size;
  });

  // Alternating sides, biggest first, so the two clouds stay balanced.
  let leftWords = $derived(words.filter((_, i) => i % 2 === 0));
  let rightWords = $derived(words.filter((_, i) => i % 2 === 1));

  const now = new Date();
  const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

  function surprise() {
    if (!cities.length) return;
    const pool = cities.filter((c) => c.city !== selected);
    selected = pool[Math.floor(Math.random() * pool.length)].city;
  }

  function board() {
    if (!city) return;
    // The section is rendered above, so it exists by the time this runs.
    sky?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /** 13 -> 22px, 2 -> 13px. Bigger word = more of the fifty use it. */
  const sizeOf = (n) => 12 + Math.min(n, 30) * 0.42;

  // --- the fly-through ---------------------------------------------------

  /** The plane banks left, then right, then left again across the track. */
  let bank = $derived(reduced ? 0 : Math.sin(progress * Math.PI * 3) * 4.5);
  /** …and rides a little up and down with it, in viewBox units. */
  let bob = $derived(reduced ? 0 : Math.sin(progress * Math.PI * 2) * 14);

  /** The closing line waits until the plane is through the words. */
  let landed = $derived(reduced || progress > 0.72);

  const SPAWN_LAST = 0.58; // progress at which the last word launches
  const SPAN = 0.42;       // how much scroll one word takes to cross the frame

  /**
   * Where each word is as the plane flies through it.
   *
   * Words start on the fuselage and accelerate outward past the wings, one
   * after another, so there is always something in the air between the first
   * line and the last. Only position and opacity animate: a word's SIZE still
   * means "this many of the fifty use it", so depth is deliberately not
   * encoded in scale as well, where it would corrupt that reading.
   */
  let flight = $derived.by(() => {
    const n = words.length;
    return words.map((w, i) => {
      const start = n > 1 ? (i / (n - 1)) * SPAWN_LAST : 0;
      const t = Math.min(1, Math.max(0, (progress - start) / SPAN));
      // Even index goes right of the plane, odd goes left; within each side
      // the words fan away from the vertical, clear of the two text lines.
      const side = i % 2 === 0 ? 1 : -1;
      // Stepping the fan by the golden ratio rather than sweeping it in
      // order: words launch a few at a time, and this keeps ANY handful of
      // them spread across the frame instead of all riding high early on.
      // Same device as the per-city hues in data.js.
      const fan = (((i * 0.6180339887) % 1) - 0.5) * 1.6;
      const r = 0.28 + t * t * 1.05;
      return {
        ...w,
        x: side * Math.cos(fan) * r * 50, // vw
        y: Math.sin(fan) * r * 42,        // vh
        o: Math.min(1, t / 0.12) * Math.min(1, (1 - t) / 0.22)
      };
    });
  });
</script>

<svelte:head>
  <title>Where do you want to go today?</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Manjari:wght@100;400;700&display=swap"
  />
</svelte:head>

<div class="frame-set">
  <!-- ================= FRAME 1 — the gate ================= -->
  <section class="gate">
    <h1>Where do you want to go today?</h1>

    <div class="controls">
      <div class="pill select-pill" class:chosen={!!city}>
        <label class="sr-only" for="dest">Destination</label>
        <select id="dest" bind:value={selected} disabled={!cities.length}>
          <option value="" disabled>select destination</option>
          {#each sorted as c (c.city)}
            <option value={c.city}>{c.city}</option>
          {/each}
        </select>
        <svg class="caret" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.6 6 6.6 11 1.6Z" /></svg>
      </div>

      <button class="pill with-icon" onclick={surprise} disabled={!cities.length}>
        <svg class="dice" viewBox="0 0 20 20" aria-hidden="true">
          <rect x="1.4" y="1.4" width="17.2" height="17.2" rx="4.6" />
          <circle cx="6.5" cy="6.5" r="1.75" />
          <circle cx="13.5" cy="6.5" r="1.75" />
          <circle cx="10" cy="10" r="1.75" />
          <circle cx="6.5" cy="13.5" r="1.75" />
          <circle cx="13.5" cy="13.5" r="1.75" />
        </svg>
        Choose for me
      </button>
    </div>

    <div class="ticket">
      <BoardingPass
        code={city ? IATA[city.city] : '————'}
        city={city ? city.city : 'Choose a city'}
        country={city ? city.country : ''}
        {time}
        {date}
      />
    </div>

    <button class="pill board" onclick={board} disabled={!city}>BOARD FLIGHT</button>

    {#if error}
      <p class="error">Could not load the cities: {error}</p>
    {/if}
  </section>

  <!-- ================= FRAME 2 — the sky ================= -->
  <!-- A tall track with a pinned stage inside it: the words need room to be
       flown through, and a one-screen section slides them away instantly. -->
  <section class="sky" class:still={reduced} bind:this={sky}>
    <div class="stage">
      <svg class="clouds" viewBox="0 0 1200 760" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#edeef7" />
            <stop offset="0.45" stop-color="#cfd9f3" />
            <stop offset="1" stop-color="#a6c0ef" />
          </linearGradient>
          <filter id="soft"><feGaussianBlur stdDeviation="30" /></filter>
          <filter id="softer"><feGaussianBlur stdDeviation="5" /></filter>
        </defs>
        <rect width="1200" height="760" fill="url(#sky-grad)" />
        <g fill="#fff" filter="url(#soft)" opacity="0.4">
          <ellipse cx="120" cy="170" rx="210" ry="44" />
          <ellipse cx="1090" cy="230" rx="230" ry="50" />
          <ellipse cx="200" cy="690" rx="250" ry="52" />
          <ellipse cx="1030" cy="730" rx="220" ry="44" />
        </g>
        <!-- The plane, head-on: a round fuselage and two long tapered wings.
             Only lightly blurred — it is the one hard shape in the frame, and
             the clouds read as cloud by contrast with it. It banks with the
             scroll, about the fuselage centre. -->
        <g fill="#fff" filter="url(#softer)" transform="rotate({bank} 600 400) translate(0 {bob})">
          <ellipse cx="600" cy="412" rx="545" ry="21" />
          <ellipse cx="600" cy="400" rx="108" ry="84" />
        </g>
      </svg>

      <div class="sky-text">
        <p class="line top">
          You might think that <strong>{city ? city.city : 'your city'}</strong> is unique…
        </p>

        {#if reduced}
          <!-- No motion: the same words, laid out either side of the plane. -->
          <div class="cloud-row">
            <ul class="cloud left">
              {#each leftWords as w (w.word)}
                <li style="font-size:{sizeOf(w.cities)}px">
                  {w.word}<span class="count">{w.cities}</span>
                </li>
              {/each}
            </ul>
            <div class="gap" aria-hidden="true"></div>
            <ul class="cloud right">
              {#each rightWords as w (w.word)}
                <li style="font-size:{sizeOf(w.cities)}px">
                  {w.word}<span class="count">{w.cities}</span>
                </li>
              {/each}
            </ul>
          </div>
        {:else}
          <!-- Positions here are motion, which means nothing to a screen
               reader, so the field is hidden from it and the plain list
               below carries the same words and counts. -->
          <div class="field" aria-hidden="true">
            {#each flight as w (w.word)}
              <span
                class="fly"
                style="font-size:{sizeOf(w.cities)}px; opacity:{w.o};
                       transform: translate(-50%, -50%) translate({w.x}vw, {w.y}vh)"
              >
                {w.word}<span class="count">{w.cities}</span>
              </span>
            {/each}
          </div>
          <ul class="sr-only">
            {#each words as w (w.word)}
              <li>{w.word} — {w.cities} of the fifty cities</li>
            {/each}
          </ul>
        {/if}

        <div class="foot">
          <p class="line bottom" class:in={landed}>
            {#if city}
              But <strong>{echoes}</strong> of the other 49 reach for the same words.
            {:else}
              But almost every city reaches for the same words.
            {/if}
          </p>
          <p class="note">
            {city ? `Words ${city.city}’s tourism board wrote that other boards wrote too.` : 'Pick a destination above.'}
            Bigger word = more of the fifty cities use it; the small number is how many.
          </p>
        </div>
      </div>
    </div>
  </section>
</div>

<style>
  /* This frame's own palette. Deliberately not the project tokens — see the
     comment at the top of the file. */
  .frame-set {
    --paper: #fbf1ee;
    --ticket: #7b6a60;
    --ink: #121212;
    --display: 'Manjari', system-ui, sans-serif;
  }

  /* ---------------- frame 1 ---------------- */
  .gate {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 56px 16px;
    background: var(--paper);
    gap: 30px;
  }

  h1 {
    font-family: var(--display);
    font-size: clamp(2rem, 5.4vw, 3.4rem);
    font-weight: 400;
    letter-spacing: -0.015em;
    color: var(--ink);
    text-align: center;
    margin: 0;
  }

  .controls {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    justify-content: center;
  }

  /* The pills carry a soft drop shadow plus a darker hairline under the
     bottom edge, which is what gives them the lifted, rounded look. */
  .pill {
    position: relative;
    font-family: var(--display);
    font-size: 1.05rem;
    color: var(--ink);
    background: #fff;
    border: none;
    border-radius: 999px;
    padding: 14px 26px;
    box-shadow:
      0 2px 10px rgba(0, 0, 0, 0.07),
      inset 0 -2px 0 rgba(0, 0, 0, 0.14);
    cursor: pointer;
    transition: transform 0.12s ease, box-shadow 0.12s ease;
  }
  .pill:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow:
      0 5px 16px rgba(0, 0, 0, 0.1),
      inset 0 -2px 0 rgba(0, 0, 0, 0.18);
  }
  .pill:active:not(:disabled) { transform: translateY(1px); }
  .pill:disabled { opacity: 0.45; cursor: default; }
  .pill:focus-visible,
  .select-pill:focus-within {
    outline: 2px solid var(--ink);
    outline-offset: 3px;
  }

  /* The caret sits over the select's right padding, so the whole pill stays
     one click target rather than the caret punching a hole in it. */
  .select-pill {
    padding: 0;
    display: flex;
    align-items: center;
  }
  .select-pill select {
    appearance: none;
    font: inherit;
    color: inherit;
    background: transparent;
    border: none;
    border-radius: 999px;
    padding: 14px 44px 14px 26px;
    cursor: pointer;
    outline: none;
  }
  .select-pill:not(.chosen) select { color: #4b4b4b; }

  .caret {
    position: absolute;
    right: 20px;
    width: 11px;
    fill: var(--ink);
    pointer-events: none;
  }

  .with-icon {
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }
  .dice {
    width: 19px;
    height: 19px;
    flex: none;
    fill: none;
    stroke: var(--ink);
    stroke-width: 1.5;
  }
  .dice circle { fill: var(--ink); stroke: none; }

  .board { letter-spacing: 0.06em; font-size: 0.95rem; padding: 15px 30px; }

  .ticket { width: min(680px, 100%); }

  .error {
    font-family: var(--display);
    color: #8a2f2f;
  }

  /* ---------------- frame 2 ---------------- */
  /* The track is the scroll budget for the flight; the stage is the one
     screen that stays put while that budget is spent. */
  .sky {
    position: relative;
    height: 340vh;
  }
  /* No flight to scroll through, so the track collapses to the one screen
     the static layout needs. Driven by the same flag that picks the static
     layout, so the two can never disagree. */
  .sky.still { height: auto; }
  .sky.still .stage { position: static; }
  .stage {
    position: sticky;
    top: 0;
    height: 100vh;
    overflow: hidden;
    isolation: isolate;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 56px 16px;
  }
  .clouds {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
  }

  /* The flight field. Words are placed from the centre of the stage, so the
     plane they fly past is always their origin whatever the window size. */
  .field {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .fly {
    position: absolute;
    left: 50%;
    top: 50%;
    white-space: nowrap;
    will-change: transform, opacity;
  }

  .sky-text {
    font-family: var(--display);
    color: var(--ink);
    width: min(1100px, 100%);
    display: flex;
    flex: 1;
    /* The field and the screen-reader list are both out of flow, so this has
       to work with two in-flow children (line, foot) or three (line, static
       word columns, foot). space-between does both. */
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    text-align: center;
  }

  .line {
    font-size: clamp(1.3rem, 3vw, 2.1rem);
    font-weight: 400;
  }
  .line strong { font-weight: 700; }

  /* The closing line is the payoff, so it holds until the plane is through
     the words rather than giving the answer away on arrival. */
  .line.bottom {
    opacity: 0;
    transform: translateY(8px);
    transition: opacity 0.55s ease, transform 0.55s ease;
  }
  .line.bottom.in {
    opacity: 1;
    transform: none;
  }

  .foot {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .cloud-row {
    align-self: center;
    display: flex;
    align-items: center;
    width: 100%;
    gap: 12px;
  }
  .gap { flex: 0 0 clamp(120px, 20vw, 260px); }

  .cloud {
    list-style: none;
    margin: 0;
    padding: 0;
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
    line-height: 1.5;
  }
  .cloud.left  { justify-content: flex-end;   text-align: right; }
  .cloud.right { justify-content: flex-start; text-align: left; }

  .cloud li { white-space: nowrap; }
  .count {
    font-size: 0.6em;
    vertical-align: super;
    margin-left: 3px;
    opacity: 0.6;
  }

  .note {
    font-size: 0.82rem;
    color: #2b3246;
    max-width: 62ch;
  }

  .sr-only {
    position: absolute;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  @media (prefers-reduced-motion: reduce) {
    .pill,
    .line.bottom { transition: none; }
  }
</style>
