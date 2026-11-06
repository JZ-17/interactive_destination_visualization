<script>
  /**
   * The main page: one flight, from dawn at the gate to sunset at the end.
   *
   * Every ticket leaves Boston, so the gate asks for one thing, a destination.
   * The journey then unfolds in two legs:
   *
   *   destination  how it compares to the rest: its words in the sky, counted
   *                on two boards, what is left of it alone, who it sounds like,
   *                and where it sits among the fifty
   *   arrival      "you've arrived": only now is the reader offered a second
   *                city, on two stacked passes leaving from here: a round trip
   *                compares the two, a one-way flight starts a new journey
   *                with the next city, leaving from this one
   *   compare      how the two compare to each other: personality cards, what
   *                each talks about, how each sells, the words they share
   *
   * The page owns both cities; every control reports to it.
   */
  import { onMount, tick, untrack } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import {
    loadCities, wordIndex, commonWords, corpusWords, cityWords, mentionIndex,
    descriptionIndex, greatCircleKm, DESCRIBING_POOL, VOICE_TICKET, TICKET_DEFAULT, SCRAPED,
    TWIN_METHODS, IATA
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
  import Stamp from '$lib/Stamp.svelte';

  let cities = $state([]);
  let error = $state(null);

  // --- shared selection state, one owner each ---------------------------
  let dest = $state('');
  let compare = $state('');
  /** Where the current flight left from: '' for Boston, else the city flown on from. */
  let origin = $state('');
  // The arrival's two passes: which is in front, and what each holds before boarding.
  let arriveFare = $state('round');
  let nextCompare = $state('');
  let nextDest = $state('');

  let ticketEl = $state();
  let ticketGone = $state(false);
  let activeStop = $state('');

  let sorted = $derived([...cities].sort((a, b) => a.city.localeCompare(b.city)));
  let byName = $derived(new Map(cities.map((c) => [c.city, c])));
  let solo = $derived(byName.get(dest) ?? null);
  let other = $derived(solo ? (byName.get(compare) ?? null) : null);

  // The whole trip wears the destination's colour, the second leg included.
  let ticketColor = $derived(solo ? VOICE_TICKET[solo.personality] : TICKET_DEFAULT);

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

  /** Its sound-alikes, offered at the arrival for anyone without a city in mind. */
  let suggestions = $derived(
    solo ? [...new Set(TWIN_METHODS.map((m) => solo.twins[m.id].partner))].filter((n) => byName.has(n)) : []
  );

  // --- two cities --------------------------------------------------------
  let km = $derived(other ? greatCircleKm(solo, other) : 0);

  const PAIR_STOPS = [
    { id: 'cards', label: 'Personality cards' },
    { id: 'themes', label: 'What they talk about' },
    { id: 'voices', label: 'How they sell it' },
    { id: 'meet', label: 'Where their words meet' }
  ];

  /** The scenes in this journey, for the strip's dots. */
  let stops = $derived([
    { id: 'flight', label: 'Shared words' },
    { id: 'boards', label: 'Most common words' },
    { id: 'left', label: 'What is left' },
    { id: 'twins', label: 'Who it sounds like' },
    { id: 'rank', label: 'Rank the 50' },
    { id: 'arrive', label: 'Arrival' },
    ...(other ? PAIR_STOPS : [])
  ]);

  function goTo(id, instant = false) {
    document.getElementById(`stop-${id}`)?.scrollIntoView({
      behavior: instant || prefersStill() ? 'auto' : 'smooth',
      block: 'start'
    });
  }

  /** Where to stay when the second city is put back from the ranking. */
  let keepRank = false;

  /** A new destination is a new trip, so any comparison from the last one goes. */
  function setDest(name) {
    dest = name;
    origin = '';
    if (!name || name === compare) compare = '';
  }

  /** A random destination, never the one already on the ticket. */
  function chooseForMe() {
    const pool = cities.filter((c) => c.city !== dest);
    if (pool.length) setDest(pool[Math.floor(Math.random() * pool.length)].city);
  }

  /** Set when a one-way pass from the arrival is boarded, so the page lands on its first scene. */
  let flyingOn = false;

  /** One way from the arrival: a new journey with the next city, leaving from this one. */
  function flyOn(name) {
    flyingOn = true;
    origin = dest;
    compare = '';
    dest = name;
  }

  function boardArrival() {
    if (arriveFare === 'oneway') {
      if (nextDest) flyOn(nextDest);
      return;
    }
    const target = nextCompare || compare;
    if (target === compare) goTo('cards');
    else setCompare(target);
  }

  // Each arrival starts fresh: round trip in front, nothing picked.
  $effect(() => {
    dest;
    untrack(() => {
      arriveFare = 'round';
      nextCompare = '';
      nextDest = '';
    });
  });

  function setCompare(name) {
    compare = name === dest ? '' : name;
  }

  /** A card or a dot in the ranking: compare with it, or put it back if held. */
  function pickFromRank(name) {
    if (name === dest) return;
    if (name === compare) {
      keepRank = true;
      setCompare('');
      return;
    }
    setCompare(name);
  }

  // Picking or dropping a city replaces scenes the reader may be standing in,
  // so land them on purpose instead of wherever the old scroll position falls.
  let lastDest = '';
  let lastCompare = '';
  $effect(() => {
    const d = dest;
    const c = compare;
    const wasD = lastDest;
    const wasC = lastCompare;
    lastDest = d;
    lastCompare = c;
    if (!d) {
      if (wasD) window.scrollTo(0, 0);
      return;
    }
    if (flyingOn) {
      flyingOn = false;
      tick().then(() => goTo('flight', true));
      return;
    }
    if (c === wasC) return;
    const stay = keepRank;
    keepRank = false;
    if (c) {
      // Fly to the cards for a first comparison, or when the pick was made
      // above them; someone already reading the second leg stays put.
      const cards = document.getElementById('stop-cards');
      if (!wasC || !cards || cards.getBoundingClientRect().top > 0) tick().then(() => goTo('cards', true));
    } else if (!stay) {
      tick().then(() => goTo('arrive', true));
    }
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

  const ARRIVE_FARES = [
    { id: 'oneway', label: 'one-way', blurb: 'fly on to a new city and see it on its own' },
    { id: 'round', label: 'round-trip', blurb: 'compare this city with another' }
  ];

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
  <section class="gate" class:alone={!solo}>
    <!-- What this is, before anything is asked of the reader: the corpus and
         the project's question, then the one choice. -->
    <header class="premise">
      <p class="setup">
        We scanned tourist sites for {cities.length || 50} cities
        around the world to answer:
      </p>
      <p class="question">
        How do the ways cities describe themselves reveal how they wish to be perceived?
      </p>
    </header>

    <h1>Where do you want to go today?</h1>

    <div class="ticket" bind:this={ticketEl}>
      <TicketPicker
        cities={sorted}
        to={solo}
        vibeCity={solo}
        {time}
        {date}
        onpick={setDest}
      />
    </div>

    {#if error}
      <p class="error">Could not load the cities: {error}</p>
    {:else}
      <div class="gate-actions">
        <!-- The dice from the board draft: for a reader with no city in mind. -->
        <button class="board with-icon" onclick={chooseForMe} disabled={!cities.length}>
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
        {#if solo}
          <button class="board" onclick={() => goTo('flight')}>Board the flight to {solo.city}</button>
        {:else}
          <button class="board" disabled>Choose a destination to board</button>
        {/if}
      </div>
    {/if}

    <p class="source">Each city’s official tourism website, scanned in {SCRAPED}.</p>
  </section>

  {#if solo}
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
        <h2>Who {solo.city} sounds like</h2>
        <!-- Read-only here: the comparison is offered at the arrival, where
             these same cities come back as one-click suggestions. -->
        <TwinTags city={solo} />
      </div>
    </div>

    <Interlude line="Now find {solo.city} among the fifty." route="swoop" />

    <div id="stop-rank" class="scene">
      <RankSection {cities} {dest} {compare} onpick={pickFromRank} />
    </div>

    <!-- The end of the first leg, and the only place a second city is asked for. -->
    <section id="stop-arrive" class="arrive" class:boarding={other}>
      <div class="arrive-stamp">
        <Stamp value={IATA[solo.city]} rim="ARRIVED • {solo.city.toUpperCase()} • ARRIVED • {solo.city.toUpperCase()} •" code="FROM {origin ? IATA[origin] : 'BOS'}" />
      </div>
      <h2>You’ve arrived in {solo.city}.</h2>
      <p class="arrive-lede">Where to next? Take a round trip to compare it with another city, or fly one way to a new one.</p>

      <!-- Two passes leaving from here, stacked as at a gate. The one behind
           shows its fare along its top edge; clicking it brings it to the
           front. Only the front pass can be used. -->
      <div class="tickets">
        {#each ARRIVE_FARES as fare (fare.id)}
          {@const front = arriveFare === fare.id}
          {@const held = byName.get(fare.id === 'round' ? nextCompare || compare : nextDest) ?? null}
          <div class="slot" class:front class:back={!front} style="--ticket:{VOICE_TICKET[(held ?? solo).personality]}">
            <div inert={!front}>
              <TicketPicker
                cities={sorted}
                home={solo}
                fare={fare.id}
                idPrefix="arrive-{fare.id}"
                to={held}
                vibeCity={held ?? solo}
                {time}
                {date}
                onpick={(name) => {
                  if (fare.id === 'oneway') nextDest = name;
                  else if (!name) { nextCompare = ''; setCompare(''); }
                  else nextCompare = name;
                }}
              />
            </div>
            {#if !front}
              <button class="swap" aria-label="Switch to the {fare.label} ticket: {fare.blurb}" title="Switch to {fare.label}" onclick={() => (arriveFare = fare.id)}></button>
            {/if}
          </div>
        {/each}
      </div>

      {#if arriveFare === 'round'}
        {@const target = byName.get(nextCompare || compare)}
        {#if target && target.city === compare}
          <button class="board" onclick={boardArrival}>Back to {solo.city} and {target.city}</button>
        {:else if target}
          <button class="board" onclick={boardArrival}>Board the round trip: {solo.city} and {target.city}</button>
        {:else}
          <button class="board" disabled>Choose a city to compare</button>
        {/if}
        {#if suggestions.length}
          <p class="arrive-hint">
            Not sure? It sounds most like
            {#each suggestions as name, i (name)}<button class="suggest" aria-pressed={(nextCompare || compare) === name} onclick={() => (nextCompare = name)}>{name}</button>{i < suggestions.length - 2 ? ', ' : i === suggestions.length - 2 ? ' and ' : '.'}{/each}
          </p>
        {/if}
      {:else if nextDest}
        <button class="board" onclick={boardArrival}>Board the flight to {nextDest}</button>
      {:else}
        <button class="board" disabled>Choose your next city</button>
      {/if}
    </section>
  {/if}

  {#if other}
    <div id="stop-cards"><PairFlight a={solo} b={other} {km} /></div>

    <div class="descent">
      <Interlude line="What does each one talk about?" route="swoop" />
    </div>

    <div id="stop-themes" class="scene"><ThemeDuel a={solo} b={other} /></div>

    <Interlude line="And how do they sell it?" route="loop" />

    <div id="stop-voices" class="scene"><VoiceDumbbell a={solo} b={other} /></div>

    <Interlude line="Where do their words meet?" route="climb" />

    <div id="stop-meet" class="scene">
      <PairWords a={solo} b={other} {index} />
      <div class="pair-twins">
        <h2>Who {solo.city} sounds like instead</h2>
        <!-- Read-only, like the first leg's: a new comparison starts from the
             arrival's round-trip pass. The one being compared stays filled. -->
        <TwinTags city={solo} current={compare} />
      </div>
    </div>
  {/if}

  {#if solo}
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
        home={origin || 'Boston'}
        cities={sorted}
        {dest}
        {compare}
        color={ticketColor}
        {stops}
        active={activeStop}
        ondest={setDest}
        oncompare={setCompare}
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
  /* The project's framing, set above the headline: a quiet lead-in line, then
     the question in full ink, held to a readable measure. */
  /* Three steps down in size and weight: a small-caps lead-in, the question,
     then a short rule in the ticket's colour that hands over to the headline.
     `balance` keeps the question from leaving one word on its last line. */
  .premise {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    max-width: 640px;
  }
  .setup {
    font-size: 0.74rem;
    font-weight: 650;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-muted);
    text-wrap: balance;
  }
  .question {
    font-family: var(--display);
    font-size: clamp(1.25rem, 2.4vw, 1.6rem);
    line-height: 1.3;
    color: var(--text-secondary);
    text-wrap: balance;
  }
  .premise::after {
    content: '';
    width: 44px;
    height: 2px;
    margin-top: 8px;
    border-radius: 2px;
    background: var(--ticket);
    transition: background 0.4s ease;
  }
  /* The scrape date qualifies the corpus rather than saying anything about a
     city, so it sits small and set back under the button. */
  .source { font-size: 0.76rem; line-height: 1.45; color: var(--text-muted); }
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
  .gate-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; }
  .with-icon { display: inline-flex; align-items: center; gap: 10px; }
  .dice { width: 19px; height: 19px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.5; }
  .dice circle { fill: currentColor; stroke: none; }
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

  /* --- the arrival ---------------------------------------------------------- */
  /* A second gate. With a comparison picked it fades into the sky's first stop,
     as the first gate does, so the next flight takes off without a seam. */
  .arrive {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    margin-top: 110px;
    padding: 40px 16px 96px;
    text-align: center;
    scroll-margin-top: 16px;
  }
  .arrive.boarding { background: linear-gradient(180deg in oklab, #f3f6fb 0%, #fbeef0 50%, #e8ebf7 100%); }
  .arrive-stamp { width: clamp(130px, 18vw, 180px); margin-bottom: 6px; }
  .arrive h2 { font-size: clamp(2.1rem, 5.6vw, 3.6rem); letter-spacing: -0.015em; line-height: 1.1; }
  .arrive-lede { max-width: 46ch; font-size: 1.04rem; line-height: 1.5; color: var(--text-secondary); }
  /* The arrival's stack. The pass behind is the same size, nudged up and
     right and turned a touch, so its fare along the top edge shows above the
     front one. Its offset is a share of its own height (the pass is 297/671 as
     tall as wide), and the padding on top is that same share of the width, so
     the peek always has room. */
  .tickets {
    position: relative;
    width: min(640px, 100%);
    margin-top: 4px;
    padding-top: 9%;
  }
  .slot { transition: transform 0.5s cubic-bezier(0.2, 0.75, 0.25, 1), filter 0.5s ease; }
  .slot.front { position: relative; z-index: 2; }
  .slot.back {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
    transform: translate(3.5%, -19%) rotate(1.8deg);
    filter: saturate(0.8) brightness(0.97);
  }
  /* Reaching for the pass behind lifts it a little further into view. */
  .slot.back:has(.swap:hover),
  .slot.back:has(.swap:focus-visible) {
    transform: translate(3.5%, -23%) rotate(2.4deg);
    filter: none;
  }
  .swap {
    position: absolute;
    inset: 0;
    z-index: 3;
    padding: 0;
    border: none;
    border-radius: 16px;
    background: transparent;
    cursor: pointer;
  }
  .swap:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 3px; }
  .arrive .board { margin-top: 10px; }
  .arrive-hint { max-width: 60ch; font-size: 0.92rem; line-height: 1.9; color: var(--text-secondary); }
  .suggest {
    margin: 0 2px;
    padding: 3px 11px;
    border: 1px solid rgba(25, 30, 59, 0.16);
    border-radius: 999px;
    background: #fff;
    font-size: 0.88rem;
  }
  .suggest:hover { border-color: var(--ticket); }
  .suggest[aria-pressed='true'] { background: var(--ticket); border-color: var(--ticket); color: #fff; }
  .suggest:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; }

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
    .board, .slot { transition: none; }
  }
</style>
