<script>
  /**
   * The main page: one flight, from dawn at the gate to sunset at the end.
   *
   * The ticket decides the journey:
   *
   *   no city   the gate, and nothing below it
   *   one city  how it compares to the rest: its words in the sky, counted on
   *             two boards, what is left of it alone, who it sounds like
   *   two       how they compare to each other: personality cards, what each
   *             talks about, how each sells, the words they share
   *
   * Both land on Rank the 50 with the reader's cities picked out. The ticket is
   * the only place the two cities live; every other control reports to it.
   */
  import { onMount, tick, untrack } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import {
    loadCities, wordIndex, commonWords, corpusWords, cityWords, mentionIndex,
    descriptionIndex, greatCircleKm, DESCRIBING_POOL, VOICE_TICKET, TICKET_DEFAULT, SCRAPED
  } from '$lib/data.js';
  import { prefersStill } from '$lib/scroll.js';
  import TicketPicker from '$lib/TicketPicker.svelte';
  import TripBar from '$lib/TripBar.svelte';
  import SkyFlight from '$lib/SkyFlight.svelte';
  import PairFlight from '$lib/PairFlight.svelte';
  import Interlude from '$lib/Interlude.svelte';
  import WordBoards from '$lib/WordBoards.svelte';
  import WordCloud from '$lib/WordCloud.svelte';
  import PersonalityCard from '$lib/PersonalityCard.svelte';
  import TwinTags from '$lib/TwinTags.svelte';
  import ThemeDuel from '$lib/ThemeDuel.svelte';
  import VoiceDumbbell from '$lib/VoiceDumbbell.svelte';
  import PairWords from '$lib/PairWords.svelte';
  import RankSection from '$lib/RankSection.svelte';

  let cities = $state([]);
  let error = $state(null);

  // --- shared selection state, one owner each ---------------------------
  let from = $state('');
  let to = $state('');

  let ticketEl = $state();
  let ticketGone = $state(false);
  let activeStop = $state('');

  let sorted = $derived([...cities].sort((a, b) => a.city.localeCompare(b.city)));
  let byName = $derived(new Map(cities.map((c) => [c.city, c])));
  let fromCity = $derived(byName.get(from) ?? null);
  let toCity = $derived(byName.get(to) ?? null);

  let mode = $derived(fromCity && toCity ? 'pair' : fromCity || toCity ? 'solo' : null);
  let solo = $derived(mode === 'solo' ? (fromCity ?? toCity) : null);

  // The ticket wears the destination's colour, or the origin's until there is one.
  let vibeCity = $derived(toCity ?? fromCity);
  let ticketColor = $derived(vibeCity ? VOICE_TICKET[vibeCity.personality] : TICKET_DEFAULT);

  // --- built once over all fifty, not per selection ----------------------
  let index = $derived(cities.length ? wordIndex(cities, DESCRIBING_POOL) : new Map());
  let mentions = $derived(cities.length ? mentionIndex(cities) : { total: new Map(), per: new Map() });
  let corpus = $derived(cities.length ? corpusWords(index, mentions.total) : []);
  let cloudIndex = $derived(cities.length ? descriptionIndex(cities) : null);

  // --- one city ----------------------------------------------------------
  let words = $derived(solo ? commonWords(solo, index, 14) : []);
  let echoes = $derived.by(() => {
    if (!solo) return 0;
    const others = new Set();
    for (const { word } of words) {
      for (const name of index.get(word) ?? []) if (name !== solo.city) others.add(name);
    }
    return others.size;
  });
  let ranked = $derived(solo ? cityWords(solo, corpus, mentions.per.get(solo.city)) : []);

  // --- two cities --------------------------------------------------------
  let km = $derived(mode === 'pair' ? greatCircleKm(fromCity, toCity) : 0);

  /** The scenes in this journey, for the strip's dots. */
  let stops = $derived(
    mode === 'pair'
      ? [
          { id: 'cards', label: 'Personality cards' },
          { id: 'themes', label: 'What they talk about' },
          { id: 'voices', label: 'How they sell it' },
          { id: 'meet', label: 'Where their words meet' },
          { id: 'rank', label: 'Rank the 50' }
        ]
      : [
          { id: 'flight', label: 'Shared words' },
          { id: 'boards', label: 'Most common words' },
          { id: 'left', label: 'What is left' },
          { id: 'twins', label: 'Who it sounds like' },
          { id: 'rank', label: 'Rank the 50' }
        ]
  );

  function goTo(id, instant = false) {
    document.getElementById(`stop-${id}`)?.scrollIntoView({
      behavior: instant || prefersStill() ? 'auto' : 'smooth',
      block: 'start'
    });
  }

  /** Where to stay when a change of mode replaces everything above the rank. */
  let keepRank = false;

  function setCity(which, name) {
    if (which === 'from') from = name;
    else to = name;
  }

  /** A card or a dot in the ranking: take it back if held, else add it. */
  function pickFromRank(name) {
    if (from === name || to === name) {
      keepRank = true;
      setCity(from === name ? 'from' : 'to', '');
      return;
    }
    if (mode === 'pair') {
      setCity('to', name);
      return;
    }
    setCity(from ? 'to' : 'from', name);
  }

  /** A sound-alike's tag: fly on to it, from the top of the two-city journey. */
  function flyTo(name) {
    setCity(from ? 'to' : 'from', name);
    tick().then(() => goTo('cards', true));
  }

  // A change of mode swaps every scene above the rank, so the old scroll
  // position means nothing. Land the reader on purpose instead.
  let lastMode = null;
  $effect(() => {
    const now = mode;
    const was = lastMode;
    if (now === was) return;
    lastMode = now;
    if (!was) return;
    if (!now) {
      window.scrollTo(0, 0);
      return;
    }
    if (!untrack(() => ticketGone)) return;
    const stay = keepRank;
    keepRank = false;
    tick().then(() => goTo(stay ? 'rank' : now === 'pair' ? 'cards' : 'flight', true));
  });

  // A reload lands at the gate, which is one screen tall until a city is picked.
  afterNavigate(() => window.scrollTo(0, 0));

  onMount(async () => {
    try {
      ({ cities } = await loadCities());
    } catch (e) {
      error = e.message;
    }
  });

  // Which scene the strip's dots should mark. Rerun when the journey changes,
  // because a new set of scenes can arrive without any scrolling.
  $effect(() => {
    const scenes = stops;
    const read = () => {
      let current = '';
      for (const s of scenes) {
        const el = document.getElementById(`stop-${s.id}`);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.5) current = s.id;
      }
      activeStop = current;
    };
    tick().then(read);
    window.addEventListener('scroll', read, { passive: true });
    return () => window.removeEventListener('scroll', read);
  });

  // The strip takes over only once the ticket itself has left the screen.
  $effect(() => {
    if (!ticketEl) return;
    const seen = new IntersectionObserver(([e]) => (ticketGone = !e.isIntersecting));
    seen.observe(ticketEl);
    return () => seen.disconnect();
  });

  const now = new Date();
  const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
</script>

<svelte:head>
  <title>How cities sell themselves</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;650;700&family=Manjari:wght@400;700&display=swap"
  />
</svelte:head>

<main class="trip" style="--ticket:{ticketColor}">
  <section class="gate" class:alone={!mode}>
    <h1>Where do you want to go today?</h1>
    <p class="lede">
      Choose one city to see how it stacks up against the other 49, or two to
      compare them.
    </p>

    <div class="ticket" bind:this={ticketEl}>
      <TicketPicker
        cities={sorted}
        from={fromCity}
        to={toCity}
        {vibeCity}
        {time}
        {date}
        onpick={setCity}
      />
    </div>

    {#if error}
      <p class="error">Could not load the cities: {error}</p>
    {:else if mode === 'pair'}
      <button class="board" onclick={() => goTo('cards')}>Compare {fromCity.city} and {toCity.city}</button>
    {:else if mode === 'solo'}
      <button class="board" onclick={() => goTo('flight')}>See how {solo.city} ranks among the 50</button>
    {:else}
      <button class="board" disabled>Choose a city to board</button>
    {/if}
  </section>

  {#if mode === 'solo'}
    <div id="stop-flight"><SkyFlight city={solo} {words} {echoes} /></div>

    <div class="descent">
      <Interlude line="Now let’s count them." route="swoop" />
    </div>

    <div id="stop-boards" class="scene">
      <WordBoards city={solo} {ranked} {corpus} />
    </div>

    <Interlude line="But what lies beyond these words?" route="loop" />

    <div id="stop-left" class="scene">
      <WordCloud city={solo} {cloudIndex} ticket={ticketColor} />
    </div>

    <Interlude line="So who does {solo.city} really sound like?" route="climb" />

    <div id="stop-twins" class="scene twin-scene">
      <div class="own-card">{#key solo.city}<PersonalityCard city={solo} />{/key}</div>
      <div class="twin-side">
        <h2>Pick one to fly there and compare</h2>
        <TwinTags city={solo} onpick={flyTo} />
      </div>
    </div>
  {:else if mode === 'pair'}
    <div id="stop-cards"><PairFlight a={fromCity} b={toCity} {km} /></div>

    <div class="descent">
      <Interlude line="What does each one talk about?" route="swoop" />
    </div>

    <div id="stop-themes" class="scene"><ThemeDuel a={fromCity} b={toCity} /></div>

    <Interlude line="And how do they sell it?" route="loop" />

    <div id="stop-voices" class="scene"><VoiceDumbbell a={fromCity} b={toCity} /></div>

    <Interlude line="Where do their words meet?" route="climb" />

    <div id="stop-meet" class="scene">
      <PairWords a={fromCity} b={toCity} {index} />
      <div class="pair-twins">
        <h2>Who {fromCity.city} sounds like instead</h2>
        <TwinTags city={fromCity} current={to} onpick={flyTo} />
      </div>
    </div>
  {/if}

  {#if mode}
    <Interlude line={mode === 'pair' ? 'Now find them among the fifty.' : `Now find ${solo.city} among the fifty.`} route="swoop" />

    <div id="stop-rank" class="scene">
      <RankSection {cities} {from} {to} onpick={pickFromRank} />
    </div>

    <footer class="sunset">
      <h2>What this data can and can’t tell you</h2>
      <ul>
        <li>Everything comes from the text of each city’s official tourism site, read in {SCRAPED}. A zero means the site never says it, not that the city lacks it.</li>
        <li>Theme numbers are mentions per 1,000 words, because the longest site is about 17 times the length of the shortest. Word counts on the two boards are the exception, and say so.</li>
        <li>“Big destination” and “hidden gem” are our own labels, and 10 of the 50 sit on the wrong side of the median for Wikipedia traffic. Chicago is tagged hidden on 3.6M views a year, so any gap between the two groups partly reflects how we labelled them.</li>
        <li>Each “sounds like” measure only ranks cities against each other. None of them is a percentage of similarity.</li>
      </ul>
    </footer>

    {#if ticketGone}
      <TripBar
        cities={sorted}
        {from}
        {to}
        color={ticketColor}
        {stops}
        active={activeStop}
        onpick={setCity}
        onjump={(id) => goTo(id)}
      />
    {/if}
  {/if}
</main>

<style>
  /* Dawn at the gate, sky through the flight, then one pale page down to the
     sunset footer. Both category colours keep 3:1 on the paper (4.70, 3.12). */
  :global(html:has(main.trip)),
  :global(body:has(main.trip)) { background: #f3f6fb; }

  main.trip {
    --display: 'Manjari', system-ui, sans-serif;
    --font: 'Figtree', system-ui, -apple-system, 'Segoe UI', sans-serif;
    --text-muted: #5d6378;
    font-family: var(--font);
    /* clip, not hidden: hidden would make this a scroller and break every sticky stage. */
    overflow-x: clip;
  }
  main.trip :global(button),
  main.trip :global(select) { font-family: var(--font); }
  main.trip :global(svg text) { font-family: var(--font); }
  main.trip :global(.pass text),
  main.trip :global(.flag),
  main.trip :global(.stamp text) { font-family: var(--display); }

  /* --- the gate ------------------------------------------------------------ */
  .gate {
    min-height: 100svh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 22px;
    padding: 40px 16px 56px;
    text-align: center;
    /* Ends on exactly the sky's first stop, so the seam cannot be found. */
    background: linear-gradient(180deg in oklab, #fff1e6 0%, #fbeef0 45%, #e8ebf7 100%);
  }
  .gate.alone { min-height: calc(100svh - var(--nav-h)); }
  h1 {
    font-family: var(--display);
    font-size: clamp(2.1rem, 5.6vw, 3.6rem);
    font-weight: 400;
    letter-spacing: -0.015em;
    line-height: 1.1;
  }
  .lede { max-width: 46ch; font-size: 1.04rem; line-height: 1.5; color: var(--text-secondary); }
  .ticket { width: min(740px, 100%); }

  .board {
    padding: 14px 28px;
    border: none;
    border-radius: 999px;
    background: #fff;
    color: var(--text-primary);
    font-family: var(--display);
    font-size: 1.1rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08), inset 0 -2px 0 rgba(0, 0, 0, 0.14);
    transition: transform 0.12s ease, box-shadow 0.12s ease;
  }
  main.trip .board { font-family: var(--display); }
  .board:hover:not(:disabled) {
    background: #fff;
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12), inset 0 -2px 0 rgba(0, 0, 0, 0.18);
  }
  .board:disabled { opacity: 0.6; cursor: default; }
  .board:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 3px; }
  .error { color: #8a2f2f; }

  /* --- the scenes ---------------------------------------------------------- */
  /* Starts on exactly the sky's last stop, coming down out of the clouds. */
  .descent { background: linear-gradient(180deg in oklab, #a6c0ef 0%, #dde6f6 55%, #f3f6fb 100%); }
  .scene { scroll-margin-top: 16px; }

  .twin-scene {
    display: grid;
    grid-template-columns: minmax(220px, 340px) minmax(0, 760px);
    justify-content: center;
    align-items: center;
    gap: clamp(28px, 5vw, 64px);
    padding-inline: 16px;
  }
  h2 {
    font-family: var(--display);
    font-size: clamp(1.4rem, 2.8vw, 2rem);
    font-weight: 400;
    line-height: 1.15;
  }
  .pair-twins { width: min(1000px, 100%); margin: 72px auto 0; padding-inline: 16px; }

  .sunset {
    margin-top: 80px;
    padding: 90px max(16px, calc((100% - 760px) / 2)) 130px;
    background: linear-gradient(180deg in oklab, #f3f6fb 0%, #fbeef0 40%, #ffe6d3 100%);
  }
  .sunset ul { margin: 12px 0 0; padding-left: 18px; }
  .sunset li { margin-bottom: 7px; font-size: 0.86rem; line-height: 1.5; color: var(--text-secondary); }

  @media (max-width: 760px) {
    .twin-scene { grid-template-columns: 1fr; justify-items: center; }
    .own-card { width: min(280px, 80vw); }
    .twin-side { width: 100%; }
  }
  @media (prefers-reduced-motion: reduce) {
    .board { transition: none; }
  }
</style>
