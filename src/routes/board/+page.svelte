<script>
  /**
   * The front door, in three frames.
   *
   * FRAME 1 — pick a destination; the boarding pass fills in.
   * FRAME 2 — the words that city uses that nearly everyone else uses too.
   * FRAME 3 — landed: that city's ranked words beside all fifty cities',
   *           on one shared scale, so the overlap is countable and not just
   *           asserted.
   *
   * Frames 2 and 3 are the hook for the whole project: the reason "which
   * cities sound alike?" is worth asking is that the answer is "most of them,
   * quite a lot".
   *
   * After the boarding pass, every place the city is named is a dropdown, so
   * a reader can swap destinations from wherever they happen to be reading
   * rather than scrolling back to the gate.
   *
   * These frames have their own palette — the pink page and the brown ticket
   * are the intro's look, not the project's. The two data colours stay
   * reserved for city category and do not appear here, because nothing here
   * encodes it.
   */
  import { onMount } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import {
    loadCities,
    loadCountries,
    wordIndex,
    commonWords,
    corpusWords,
    cityWords,
    mentionIndex,
    descriptionIndex,
    cloudField,
    litWords,
    WORD_TYPES,
    DESCRIBING_POOL,
    IATA,
    SCRAPED
  } from '$lib/data.js';
  import BoardingPass from '$lib/BoardingPass.svelte';
  import PinMap from '$lib/PinMap.svelte';
  import FlightNav from '$lib/FlightNav.svelte';
  import { PLANE } from '$lib/ticketArt.js';

  let cities = $state([]);
  let land = $state(null);       // country polygons for the atlas map
  let error = $state(null);
  let selected = $state('');      // the one piece of shared state on this page
  let atlas;                      // the map frame, now the first thing below the gate
  let sky;                        // frame 2's scroll track
  let arrival;                    // …and the two frames after it, for the strip
  let leftover;

  /** How far through the story the strip's plane has flown, 0..1. */
  let story = $state(0);
  /** Whether the strip is up: once the gate is behind you. */
  let onStrip = $state(false);
  /** The frames the strip can jump to, as fractions of the same track. */
  let stops = $state([]);

  /** The strip's waypoints, in the order you fly through them. */
  const FRAMES = [
    { id: 'atlas', label: 'The fifty' },
    { id: 'sky', label: 'Shared words' },
    { id: 'arrival', label: 'Counted' },
    { id: 'leftover', label: 'What’s left' }
  ];
  let frameEls = $derived({ atlas, sky, arrival, leftover });

  function jump(id) {
    frameEls[id]?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }
  let progress = $state(0);       // 0 entering the track, 1 leaving it
  let reduced = $state(false);    // prefers-reduced-motion

  onMount(async () => {
    try {
      // In parallel: the map is useless without the cities and the cities
      // have nothing to sit on without the map.
      const [loaded, geo] = await Promise.all([loadCities(), loadCountries()]);
      cities = loaded.cities;
      land = geo;
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

      // The strip runs the whole story: the atlas is its origin and the foot
      // of the page is its destination, so the plane answers "how much of
      // this is left" rather than "where am I in this one frame".
      if (!atlas) return;
      const start = atlas.offsetTop;
      const end = document.documentElement.scrollHeight - window.innerHeight;
      const run = end - start;
      story = run > 0 ? Math.min(1, Math.max(0, (window.scrollY - start) / run)) : 0;
      onStrip = window.scrollY > start * 0.55;
      stops = run > 0
        ? FRAMES.filter((f) => frameEls[f.id]).map((f) => ({
            ...f,
            at: Math.min(1, Math.max(0, (frameEls[f.id].offsetTop - start) / run))
          }))
        : [];
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

  /*
   * A reload lands at the gate, with nothing selected.
   *
   * SvelteKit keeps its own scroll positions in sessionStorage and restores
   * them after the page mounts — later than `afterNavigate`, later than any
   * hook this component has. Racing it is a losing game, so the gate does
   * not race it: while no city is picked the frames below are taken out of
   * layout (see `.frame-set.gated` in the styles), the document is one
   * screen tall, and a restored position of 4000px has nowhere to land and
   * clamps to the top on its own. This call is the statement of intent; the
   * layout is what makes it hold.
   */
  afterNavigate(() => window.scrollTo(0, 0));

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
    // The atlas, not the sky: it is what the gate now opens onto, and the
    // flight reads as a flight because you see the fifty on the ground
    // first. The section exists by the time this runs — picking the city
    // un-gated it on an earlier tick.
    atlas?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /** 1 -> "1st", 12 -> "12th". The teens are the exception that needs it. */
  const ord = (n) => {
    const teen = n % 100 >= 11 && n % 100 <= 13;
    return n + (teen ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th');
  };

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

  // --- the arrival -------------------------------------------------------

  /** Mentions per word: `total` across all fifty, `per` inside one city. */
  let mentions = $derived(
    cities.length ? mentionIndex(cities) : { total: new Map(), per: new Map() }
  );
  /** All 406 words more than one city uses, ranked by times used. */
  let corpus = $derived(cities.length ? corpusWords(index, mentions.total) : []);
  /** The same words, filtered to this city's — plus how often IT writes them. */
  let ranked = $derived(
    city ? cityWords(city, corpus, mentions.per.get(city.city)) : []
  );

  /** Which of the corpus's words this city uses: the rows that link across. */
  let own = $derived(new Set(ranked.map((w) => w.word)));

  /**
   * Scales. The two cards do not count the same thing — the left counts one
   * description, the right counts fifty — so each is scaled to its own top
   * word and labelled with what it is counting. Sharing an axis would squash
   * every city bar to a stub and invite reading a city's 3 against the
   * corpus's 69 as if they answered one question.
   */
  let barMax = $derived(corpus.length ? corpus[0].mentions : 1);
  let cityMax = $derived(Math.max(1, ...ranked.map((w) => w.own)));

  /**
   * One word column across BOTH cards, sized to the longest word on either
   * side: every bar then starts at the same x and runs in the same track, so
   * two equal counts are two equal lengths wherever they appear.
   */
  let wcol = $derived(
    `${Math.max(9, ...corpus.map((w) => w.word.length)) + 1}ch`
  );

  /** Hovering or clicking a word lights it in BOTH cards. */
  let lit = $state(null);
  let cityList = $state();    // the scroll container for this city's words
  let corpusList = $state();  // …and for all fifty

  /**
   * Centre a word inside one card. Scrolling the container itself rather
   * than calling scrollIntoView, which would drag the whole page along with
   * it and throw the reader out of the frame.
   */
  function reveal(box, word) {
    const row = box?.querySelector(`[data-word="${CSS.escape(word)}"]`);
    if (!row) return;
    const to = Math.max(
      0,
      Math.min(
        box.scrollHeight - box.clientHeight,
        row.offsetTop - box.clientHeight / 2 + row.offsetHeight / 2
      )
    );
    if (reduced) {
      box.scrollTop = to;
      return;
    }
    // Hand-animated rather than `behavior: 'smooth'`, which some engines
    // decline to run on a nested scroller — and the travel is the point
    // here: it shows the reader how far down the other list the word sits.
    const from = box.scrollTop;
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / 420);
      const e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
      box.scrollTop = from + (to - from) * e;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /**
   * Click a word in either card and the OTHER card scrolls to find it. The
   * card you clicked in stays where it is — moving the row out from under
   * the cursor would lose your place in the list you are reading.
   */
  function pick(word, from) {
    lit = word;
    reveal(from === 'city' ? corpusList : cityList, word);
  }

  // --- what is left ------------------------------------------------------

  /** The whole description pool: counts, document frequencies, tags, scores. */
  let cloudIndex = $derived(
    cities.length
      ? descriptionIndex(cities)
      : { perCity: new Map(), docFreq: new Map(), typesOf: new Map(), scores: new Map() }
  );

  /**
   * Keep words at most this many OTHER cities also write. Two is the opening
   * position because it is the one that answers the heading: strip what the
   * corpus shares and the place itself is what remains.
   */
  let maxOthers = $state(2);
  /** Which word types stay lit. All on, so the first view dims nothing. */
  let keepTypes = $state(new Set(WORD_TYPES.map((t) => t.id)));

  /**
   * The whole description, every word of it, in a fixed scattered order.
   * Depends on the city alone — the filters never touch it, so nothing
   * moves while the slider is being dragged.
   */
  let field = $derived(cloudField(city, cloudIndex));
  /** …and which of those words the filters leave burning. */
  let stillLit = $derived(litWords(field, { maxOthers, types: keepTypes }));

  /** Biggest word in the field, for the size ramp. Also filter-independent. */
  let cloudMax = $derived(Math.max(1, ...field.map((w) => w.count)));
  /** Hovering a word spells out what its size means, in words. */
  let cloudLit = $state(null);

  let score = $derived(city ? cloudIndex.scores.get(city.city) : null);

  function toggleType(id) {
    const next = new Set(keepTypes);
    // Turning everything off is allowed here. Nothing is removed, so the
    // worst it can do is put every word out until a type goes back on.
    if (next.has(id)) next.delete(id);
    else next.add(id);
    keepTypes = next;
  }

  /**
   * The slider's handle is the ticket's own jet, the same path the boarding
   * pass draws between FROM and TO — imported rather than copied, so there
   * is one plane in this project and it cannot drift.
   *
   * It has to go through a data URI because a range input's thumb is a
   * pseudo-element and can only take a background image, not a child SVG.
   * The artboard numbers are the jet's own bounds inside the 671x297
   * ticket; `encodeURIComponent` is what makes the `#` in the colour safe
   * to sit inside a url().
   */
  const planeThumb = `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="188 107 38 37">` +
      `<path d="${PLANE}" fill="#7b6a60"/></svg>`
  )}")`;

  function resetCloud() {
    maxOthers = 2;
    keepTypes = new Set(WORD_TYPES.map((t) => t.id));
  }

  /**
   * Type shrinks as the field grows, or Paris — 618 words against Bangkok's
   * 72 — would run four screens deep and stop being one picture. It still
   * runs taller, which is right: the board really did write more. Only the
   * ramp moves, so a word's size still means the same thing within a cloud.
   */
  let zoom = $derived(Math.min(1, Math.max(0.55, Math.sqrt(170 / Math.max(1, field.length)))));

  /**
   * A word written once sits at 12px and the city's most-written word tops
   * the ramp, on a square root so a word written ten times does not swamp
   * ten words written once. Only the TOP of the ramp shrinks on a big
   * cloud: the floor stays at 12px, because a word too small to read is
   * not in the picture at all, whatever the layout says.
   *
   * Size is the only channel here. Colour is reserved for city category
   * across the project, and nothing in this cloud encodes it.
   */
  const cloudSize = (n) =>
    12 + Math.sqrt((n - 1) / Math.max(1, cloudMax - 1)) * 38 * zoom;

  /**
   * The scatter. Each word takes a small nudge off the baseline and a slight
   * tilt, both deterministic from its own seed, so the block reads as a
   * drift of words rather than justified prose. Kept small on purpose —
   * past about three degrees a word stops being easy to read, and these are
   * meant to be read.
   */
  const drift = (w) =>
    `translateY(${(w.seed - 0.5) * 16}px) rotate(${(((w.seed * 7) % 1) - 0.5) * 5}deg)`;

  /**
   * How long a word waits before it fades. Deliberately NOT the seed the
   * field is sorted by — that would sweep the cloud in reading order, like
   * a wipe. A second, unrelated number off the same word scatters the delay
   * instead, so the lights go out all over the cloud at once.
   */
  const delay = (w) => (reduced ? 0 : (((w.seed * 10007) % 1) * 0.45).toFixed(3));
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

<div class="frame-set" class:gated={!city} class:strip-up={!!city && onStrip}>
  <!-- ================= FRAME 1 — the gate ================= -->
  <section class="gate">
    <h1>Where do you want to go today?</h1>
    <p class="choose-from">
      Choose from {cities.length || 50} destinations.
    </p>

    <div class="controls">
      <div class="pill select-pill" class:chosen={!!city}>
        <label class="sr-only" for="dest">Destination</label>
        <select id="dest" bind:value={selected} disabled={!cities.length}>
          <option value="" disabled>Select destination</option>
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

    <!-- A page that refuses to scroll and does not say so reads as broken,
         so the gate says what it is waiting for. -->
    <p class="gate-hint" aria-live="polite">
      {#if !city}
        Pick a destination to continue
      {/if}
    </p>

    {#if error}
      <p class="error">Could not load the cities: {error}</p>
    {/if}
  </section>

  <!-- ============ FRAME 1.5 — the atlas ============ -->
  <!-- The bridge, in both senses. It introduces the corpus — this is the
       set every later claim is made over — and it carries the page out of
       the gate's warm paper and into the sky's cold blue, so the flight
       starts on the ground rather than cutting to altitude. The whole
       gradient lives on this one section; see `.atlas` in the styles. -->
  <section class="atlas" bind:this={atlas}>
    <h2>
      We scanned tourist sites<span class="mark">*</span> for {cities.length || 50} cities
      around the world to answer:
    </h2>
    <p class="question">
      How do the ways cities describe themselves reveal how they wish to be perceived?
    </p>
    <!-- The way on, above the map rather than after it: the map is the
         thing to linger over, and a button underneath it reads as the end
         of the section instead of an offer. Up here it sits with the words
         that set the question, and the strip at the foot is navigation you
         have to already know about. -->
    <button class="pill onward" onclick={() => jump('sky')}>
      <svg class="jet" viewBox="188 107 38 37" aria-hidden="true"><path d={PLANE} /></svg>
      TAKE OFF
    </button>

    <PinMap {cities} {land} {selected} />

    <!-- When, which every claim downstream rests on: a tourism board can
         rewrite its front page any week, so the corpus is a reading taken
         on a date rather than a standing fact. -->
    <p class="source"><span class="mark">*</span> Scanned in {SCRAPED}.</p>
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
          <!-- Plain text now. The strip at the foot of the page owns the
               one dropdown, so a headline does not have to be a control. -->
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

  <!-- ================= FRAME 3 — landed ================= -->
  <!-- Back on the pink page, out of the sky: the same words, now counted.
       "All fifty" is the baseline rather than "the other 49" because the
       selected city is one of the fifty and pulling it out would change the
       numbers depending on who you picked. -->
  <section class="arrival" bind:this={arrival}>
    <div class="decks">
      <div class="deck">
        <div class="deck-head">
          <h2>{city ? city.city : 'Your city'}</h2>
          <p class="kicker">Most common words</p>
          <p class="unit">times {city ? city.city : 'this city'} writes it</p>
        </div>

        {#if ranked.length}
          <ol
            class="rank"
            style="--wcol:{wcol}"
            bind:this={cityList}
            onmouseleave={() => (lit = null)}
          >
            {#each ranked as w, i (w.word)}
              <li>
                <button
                  class="row"
                  class:lit={lit === w.word}
                  data-word={w.word}
                  onclick={() => pick(w.word, 'city')}
                  onmouseenter={() => (lit = w.word)}
                  onfocus={() => (lit = w.word)}
                >
                  <span class="n">{i + 1}</span>
                  <span class="w">{w.word}</span>
                  <span class="bar"><span class="fill" style="width:{(w.own / cityMax) * 100}%"></span></span>
                  <span class="c">{w.own}</span>
                </button>
              </li>
            {/each}
          </ol>
          {#if cityMax === 1}
            <p class="flat">
              {city.city} writes every one of these exactly once, so the bars
              are all the same length — short sites have no repeats to show.
            </p>
          {/if}
        {:else}
          <p class="empty">Pick a destination and its shared words land here.</p>
        {/if}
      </div>

      <div class="deck">
        <div class="deck-head">
          <h2>All fifty</h2>
          <p class="kicker">Most common words</p>
          <p class="unit">times all fifty write it</p>
        </div>
        <ol
          class="rank"
          style="--wcol:{wcol}"
          bind:this={corpusList}
          onmouseleave={() => (lit = null)}
        >
          {#each corpus as w, i (w.word)}
            <li>
              <button
                class="row"
                class:lit={lit === w.word}
                class:theirs={ranked.length && !own.has(w.word)}
                data-word={w.word}
                onclick={() => pick(w.word, 'corpus')}
                onmouseenter={() => (lit = w.word)}
                onfocus={() => (lit = w.word)}
              >
                <span class="n">{i + 1}</span>
                <span class="w">{w.word}</span>
                <span class="bar"><span class="fill" style="width:{(w.mentions / barMax) * 100}%"></span></span>
                <span class="c">{w.mentions}</span>
              </button>
            </li>
          {/each}
        </ol>
      </div>
    </div>

    <p class="beyond">But what lies beyond these words?</p>
  </section>

  <!-- ================= FRAME 4 — what is left ================= -->
  <!-- The inverse of frame 3. That one ranked the words everybody shares;
       this one throws them away and shows what the city has left. The pool
       is the whole description, not the tagged vocabulary, because the words
       a place actually owns are its landmarks and its geography — and those
       are the ones the pipeline never tagged. -->
  <section class="leftover" bind:this={leftover}>
    <h2 class="left-head">Let’s filter the common ones out. What’s left?</h2>

    <div class="filters">
      <div class="filter">
        <label class="filter-label" for="others">
          Found in at most
          <strong>{maxOthers}</strong>
          other {maxOthers === 1 ? 'city' : 'cities'}
        </label>
        <input
          id="others"
          class="dial"
          type="range"
          min="0"
          max="49"
          style="--plane:{planeThumb}"
          bind:value={maxOthers}
          disabled={!city}
        />
        <p class="scale" aria-hidden="true"><span>only this one</span><span>all 50</span></p>
      </div>

      <div class="filter types">
        <span class="filter-label" id="types-label">Word type</span>
        <div class="chips" role="group" aria-labelledby="types-label">
          {#each WORD_TYPES as t (t.id)}
            <button
              class="chip"
              class:on={keepTypes.has(t.id)}
              aria-pressed={keepTypes.has(t.id)}
              onclick={() => toggleType(t.id)}
              disabled={!city}
            >
              <span class="chip-label">{t.label}</span>
              <span class="chip-eg">{t.eg}</span>
            </button>
          {/each}
        </div>
      </div>

      <button class="reset" onclick={resetCloud} disabled={!city}>Reset</button>
    </div>

    {#if !city}
      <p class="empty cloud-empty">Pick a destination and its whole vocabulary lands here.</p>
    {:else}
      <div
        class="cloud-box"
        role="group"
        aria-label="Every word {city.city} writes"
        onmouseleave={() => (cloudLit = null)}
      >
        <ul class="cloud-words">
          {#each field as w (w.word)}
            <li
              style="transform:{reduced ? 'none' : drift(w)}"
              class:dim={cloudLit && cloudLit !== w.word}
            >
              <button
                style="font-size:{cloudSize(w.count)}px;
                       transition-delay:{delay(w)}s"
                class:out={!stillLit.has(w.word)}
                onmouseenter={() => (cloudLit = w.word)}
                onfocus={() => (cloudLit = w.word)}
                onclick={() => (cloudLit = cloudLit === w.word ? null : w.word)}
              >
                {w.word}
                <span class="sr-only">
                  — written {w.count} {w.count === 1 ? 'time' : 'times'},
                  found in {w.others} other {w.others === 1 ? 'city' : 'cities'};
                  {stillLit.has(w.word) ? 'lit' : 'dimmed by the filters'}
                </span>
              </button>
              <!-- The counts where the eye already is. A screen reader
                   gets the same numbers from the button's own sr-only
                   text, which a hover tooltip could never give it. -->
              <span class="tip" aria-hidden="true">
                <strong>{w.count}×</strong> here ·
                {w.others === 0 ? 'nobody else' : `${w.others} other ${w.others === 1 ? 'city' : 'cities'}`}
              </span>
            </li>
          {/each}
        </ul>
      </div>

      <!-- The one state the cloud cannot explain itself in. Every word is
           still there, only unlit, so without a line here a reader who
           switched off all five types sees a blank field and no reason for
           it. It says where the way back is; Reset is in the bar above. -->
      {#if stillLit.size === 0}
        <p class="cloud-out" aria-live="polite">
          Everything is out. Nudge a filter back and the lights come on.
        </p>
      {/if}

      <p class="uniqueness">
        <strong>{Math.round(score.share * 100)}%</strong> of the distinct words
        {city.city} writes, no other city writes at all —
        {score.unique} of {score.total}.
      </p>
      <!-- Length belongs next to that share, because the share climbs with
           it: a longer site has more room for a word nobody else reached
           for. Read alone, the percentage would flatter the wordiest
           boards. -->
      <p class="uniqueness-note">
        Keep in mind that {city.city}’s description runs {city.wordCount} words,
        which is the {ord(score.lengthRank)} largest in the dataset.
      </p>
    {/if}
  </section>

  <!-- Fixed, outside the frames, so it is the one thing that does not
       scroll away. It waits until the gate is behind you: at the gate the
       big select pill is right there, and two controls for one value, a
       screen apart, is one too many. -->
  {#if city && onStrip}
    <FlightNav
      cities={sorted}
      {selected}
      progress={story}
      {stops}
      onpick={(v) => (selected = v)}
      onjump={jump}
    />
  {/if}
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

  /*
   * The gate is a gate: everything below frame 1 is about one city, and
   * until one is picked there is nothing down there to read — frame 2 flies
   * through an empty sky and frames 3 and 4 say "pick a destination". So
   * until then the page simply IS the gate: the frames below leave layout
   * and the document is one screen tall.
   *
   * This rather than locking `overflow` on the root element, which was the
   * first thing I reached for and is worse twice over. It cannot stop
   * SvelteKit restoring a scroll position on reload — `scrollTo` still
   * moves a root that is `overflow: hidden`, and no scroll event is even
   * dispatched to catch it — so you came back stranded at the bottom of a
   * page you could not scroll out of. And on a window too short for the
   * gate's own contents it locked the dropdown itself out of reach. Taking
   * the frames out of layout fixes both: there is nothing below to scroll
   * to, and the gate can still scroll within itself when it has to.
   */
  .frame-set.gated .atlas,
  .frame-set.gated .sky,
  .frame-set.gated .arrival,
  .frame-set.gated .leftover {
    display: none;
  }

  /* ---------------- frame 1 ---------------- */
  .gate {
    min-height: calc(100vh - var(--nav-h));
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

  /* Sits under BOARD FLIGHT in the section's own gap, so it does not add
     height of its own and the two states swap without the gate shifting. */
  .gate-hint {
    margin: -18px 0 0;
    font-family: var(--display);
    font-size: 0.9rem;
    color: var(--ink);
    opacity: 0.6;
    text-align: center;
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

  /* ---------------- frame 1.5 ---------------- */
  /*
   * The one gradient on the page, and the reason the three frames read as
   * one descent: it starts on EXACTLY the gate's paper and ends on EXACTLY
   * the first stop of the sky's own gradient (`#edeef7` in `#sky-grad`
   * above), so both joins are seams you cannot find. Change either of those
   * colours and this has to move with it.
   *
   * Interpolated in oklab, so the warm end does not go grey through the
   * middle the way straight sRGB mixing takes it.
   */
  .atlas {
    position: relative;
    /* Keeps the dither below blending with this section's own background and
       nothing else — without it the film reaches the gate and the sky. */
    isolation: isolate;
    background: linear-gradient(180deg in oklab, var(--paper) 0%, #edeef7 100%);
    font-family: var(--display);
    color: var(--ink);
    padding: 64px 16px 92px;
    text-align: center;
    /* Everything in this frame that is not the map, plus room for the
       flight strip: the map sizes itself against what is left. Measured,
       not guessed — see the max-width on `.atlas-map`. */
    --atlas-reserve: 434px;
  }

  /*
   * The dither, and the reason the gradient has no hard lines across it.
   *
   * Paper to sky is #fbf1ee -> #edeef7: fourteen steps of red, three of
   * green, nine of blue, spread over the whole section. Eight-bit output
   * has to round that to whole numbers, so it lands as a stack of flat
   * bands with a visible edge at every rounding boundary — and the eye
   * exaggerates those edges rather than forgiving them. More colour stops
   * cannot help; the steps are in the output, not the ramp.
   *
   * A film of fine noise dissolves them: each pixel is nudged a level or so
   * at random, so the boundary is scattered instead of straight. It is the
   * same trick as dithering a low-bit image, and at this opacity you can
   * only see it by the lines that stop being there.
   *
   * It has to be MEAN-PRESERVING, which the obvious version is not. Laying
   * translucent noise straight over the gradient darkens it — the noise
   * averages mid-grey and the background here is near-white — so the
   * section as a whole sinks a few levels below the sky underneath it and
   * grows a hard edge along its own bottom: the exact line this is here to
   * remove, moved. Greyscale noise through `overlay` has no such bias,
   * because overlay against mid-grey is the identity: the film lightens as
   * often as it darkens and the average comes out where it started.
   */
  .atlas::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    mix-blend-mode: overlay;
    opacity: 0.22;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='0' intercept='1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  .atlas > :global(*) {
    width: min(1180px, 100%);
    margin-inline: auto;
    /* Above the dither film. */
    position: relative;
    z-index: 1;
  }

  /* Still an h2, because this is the section's heading and the document
     outline and screen readers both rely on that — but set as body text.
     The three lines are one spoken sentence that happens to break twice,
     and a display-sized first line made it read as a title with a caption
     under it instead.

     `margin: 0 auto`, not 0: this rule outranks the `margin-inline: auto`
     on `.atlas > *`, so a plain `margin: 0` quietly reset it and left the
     1180px box flush against the section's left padding — measured 34px
     off centre at 1280, while the line below it sat dead centre. */
  .atlas h2 {
    width: min(62ch, 100%);
    margin: 0 auto;
    font-size: clamp(0.95rem, 1.6vw, 1.1rem);
    font-weight: 400;
    letter-spacing: 0;
    line-height: 1.4;
    opacity: 0.8;
  }
  /* The project's question, on its own line and held to a readable measure
     — across the full 1180px it ran as one thin band of text and stopped
     looking like a question at all. */
  .atlas .question {
    width: min(58ch, 100%);
    margin: 4px auto 0;
    font-size: clamp(0.95rem, 1.6vw, 1.1rem);
    font-weight: 700;
    line-height: 1.4;
    /* Fuller ink than the line that leads into it: the bold is doing the
       emphasising, and holding it at 0.8 would mostly thicken a grey. */
    opacity: 0.92;
  }
  /* The frame is meant to be taken in at once — the fifty, the question
     and the way on — so the map is sized to whatever height the rest of
     the section leaves rather than to the page width. The plate is 2:1,
     so the width it can afford is twice that leftover height. On a tall
     window the 1180px box still wins and nothing shrinks. */
  .atlas :global(.atlas-map) {
    margin-top: clamp(20px, 3.4vw, 44px);
    max-width: min(1180px, calc((100svh - var(--atlas-reserve)) * 2));
    margin-inline: auto;
  }

  /* The scrape date. Small and set back, because it qualifies the corpus
     rather than saying anything about a city. */
  .atlas .source {
    width: min(62ch, 100%);
    margin: 14px auto 0;
    font-size: 0.76rem;
    line-height: 1.45;
    opacity: 0.55;
  }
  .mark {
    /* Raised a little and kept off the text's weight, so it reads as a
       marker rather than as punctuation inside the sentence. */
    font-size: 0.85em;
    vertical-align: 0.28em;
    opacity: 0.75;
  }

  /* The same pill as BOARD FLIGHT, one step quieter: the gate's button is
     the decision, this one only carries you on. `width: auto` because the
     rule above hands every direct child of the atlas a 1180px box, which
     would stretch a pill across the whole section. */
  .atlas .onward {
    width: auto;
    display: inline-flex;
    align-items: center;
    gap: 11px;
    margin: clamp(28px, 4.5vw, 50px) auto 0;
    padding: 13px 28px;
    font-size: 0.95rem;
    letter-spacing: 0.06em;
  }
  /* Nose up, the way a departures board draws it — and the same jet as the
     ticket and the flight strip, so the three read as one aircraft. */
  .onward .jet {
    width: 19px;
    flex: none;
    fill: var(--ink);
    transform: rotate(-45deg);
    transition: transform 0.16s ease;
  }
  .onward:hover .jet { transform: rotate(-45deg) translateX(3px); }

  /* The strip is fixed over the page, so the two frames whose content runs
     to their own bottom edge have to give it room or it sits on top of
     them: frame 2's closing line and frame 4's last paragraph. */
  .frame-set.strip-up .stage { padding-bottom: 112px; }
  .frame-set.strip-up .leftover { padding-bottom: 180px; }

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

  /* ---------------- frame 3 ---------------- */
  .arrival {
    background: var(--paper);
    font-family: var(--display);
    color: var(--ink);
    padding: 76px 16px 56px;
  }

  .decks {
    width: min(1060px, 100%);
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 44px 56px;
    align-items: start;
  }

  .deck-head {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 9px;
    font-size: clamp(1.15rem, 2.1vw, 1.45rem);
    text-align: center;
  }
  .deck-head h2 {
    margin: 0;
    font-size: 1em;
    font-weight: 400;
  }
  .kicker {
    margin: 0;
    font-size: 0.78rem;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }
  /* What the bars and numbers in this card are counting. The two cards count
     different things — one description, then all fifty — so each says which. */
  .unit {
    margin: -4px 0 0;
    font-size: 0.78rem;
    opacity: 0.6;
  }

  .flat {
    margin: 10px 0 0;
    font-size: 0.78rem;
    line-height: 1.5;
    opacity: 0.65;
  }

  /* position: relative so a row's offsetTop is measured inside the card —
     that is what `reveal` scrolls by. */
  .rank {
    position: relative;
    margin: 16px 0 0;
    padding: 20px 24px;
    list-style: none;
    background: #fff;
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.055);
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 56vh;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  /* The word column is as wide as the longest word on either side, so every
     bar in both cards starts at the same x and runs in the same track. */
  .row {
    width: 100%;
    display: grid;
    grid-template-columns: 2.4em var(--wcol) 1fr 2.6em;
    align-items: center;
    gap: 10px;
    padding: 3px 6px;
    margin: 0 -6px;
    border: none;
    border-radius: 7px;
    background: none;
    font: inherit;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }
  .row.lit { background: rgba(0, 0, 0, 0.055); }
  .row:focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: 1px;
  }
  /* Words all fifty share that this city does not reach for. Still listed —
     the ranking is the corpus's — but not part of the comparison. */
  .row.theirs { opacity: 0.42; }

  .n {
    font-size: 0.82rem;
    text-align: right;
    opacity: 0.75;
  }
  .w {
    font-size: 0.86rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .bar { display: block; }
  .fill {
    display: block;
    height: 6px;
    border-radius: 999px;
    background: #d8d4d1;
    transition: background 0.12s ease;
  }
  .row.lit .fill { background: #8d8279; }
  .c {
    font-size: 0.74rem;
    text-align: right;
    opacity: 0.55;
  }

  .empty {
    margin: 16px 0 0;
    font-size: 0.92rem;
    opacity: 0.65;
  }

  /* The outer block holds the deck's left edge; the span keeps the measure
     readable without pulling the text into the middle of the page. */
  .legend {
    width: min(1060px, 100%);
    margin: 22px auto 0;
    font-size: 0.8rem;
    line-height: 1.55;
    opacity: 0.7;
  }
  .legend span {
    display: block;
    max-width: 74ch;
  }

  /* Centred, and matched to frame 4's heading: the two are a question and
     its answer across a section break, so they sit on the same axis. */
  .beyond {
    width: min(1060px, 100%);
    margin: 104px auto 0;
    font-size: clamp(1.7rem, 4.4vw, 2.7rem);
    font-weight: 400;
    letter-spacing: -0.015em;
    text-align: center;
  }

  /* ---------------- frame 4 ---------------- */
  .leftover {
    background: var(--paper);
    font-family: var(--display);
    color: var(--ink);
    padding: 0 16px 120px;
  }
  .leftover > * {
    width: min(1060px, 100%);
    margin-inline: auto;
  }
  /* A tooltip on a word at the edge of a full-width cloud hangs off the
     page and adds a horizontal scrollbar. `clip` rather than `hidden`: it
     stops that without making a scroll container, so the tips above the
     top row are still free to paint upward. */
  .leftover { overflow-x: clip; }

  /* Body text, not a headline, and still an h2 so the section keeps its
     place in the outline and the flight strip's "What's left" stop has
     something to point at. The display-sized line above it — "But what
     lies beyond these words?" — is this frame's heading to the eye; two
     big lines in a row made the reader ask which one was the title. */
  .left-head {
    width: min(62ch, 100%);
    margin: 0 auto 28px;
    font-size: clamp(0.95rem, 1.6vw, 1.1rem);
    font-weight: 400;
    line-height: 1.4;
    letter-spacing: 0;
    text-align: center;
    opacity: 0.8;
  }

  /* One raised bar holding both filters, the way the gate's pills are raised
     off the page: it reads as the control surface for the cloud below it. */
  .filters {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 26px 34px;
    padding: 18px 26px 20px;
    background: #fff;
    border-radius: 22px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.055);
  }
  .filter { display: flex; flex-direction: column; gap: 7px; }
  .filter:first-child { flex: 1 1 260px; }
  .filter-label {
    font-size: 0.72rem;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    opacity: 0.62;
  }
  .filter-label strong { font-weight: 700; opacity: 1; }
  /* The handle is the ticket's jet, so the native thumb goes and a
     background image takes its place. Dropping `appearance` also drops the
     default track, which is why both halves are drawn here, twice: WebKit
     and Gecko expose them under names neither engine understands from the
     other, and they cannot be combined into one rule. */
  .dial {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 26px;
    background: none;
    cursor: pointer;
  }
  .dial:disabled { cursor: default; opacity: 0.4; }
  .dial:focus-visible { outline: 2px solid var(--ink); outline-offset: 4px; border-radius: 4px; }

  .dial::-webkit-slider-runnable-track {
    height: 3px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.18);
  }
  .dial::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 30px;
    height: 26px;
    /* Half the track minus half the thumb, so the jet rides the line. */
    margin-top: -11.5px;
    border: none;
    background: var(--plane) center / contain no-repeat;
  }

  .dial::-moz-range-track {
    height: 3px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.18);
  }
  .dial::-moz-range-thumb {
    width: 30px;
    height: 26px;
    border: none;
    background: var(--plane) center / contain no-repeat;
  }
  .scale {
    display: flex;
    justify-content: space-between;
    margin: -3px 0 0;
    font-size: 0.7rem;
    opacity: 0.45;
  }

  .chips { display: flex; flex-wrap: wrap; gap: 8px; }
  /* Each chip carries its own examples. "Noun modifier" is a term of art
     nobody outside linguistics uses, and no label short enough to fit will
     teach it — but "tourist attractions, wine region" does, instantly, and
     the same trick saves the other four from having to be guessed at. */
  /*
   * On by default, so the ON state is the one the eye lives with and it is
   * the one that has to be quiet. A grey fill inside a grey outline gave
   * five boxed-in blocks; the fill alone, warmed to the project's brown and
   * with the border gone, reads as one soft row. Off is then the absence of
   * the fill rather than a second treatment: a hairline keeps the shape and
   * the type steps back.
   */
  .chip {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 9px 17px 11px;
    border: 1px solid transparent;
    border-radius: 14px;
    background: rgba(123, 106, 96, 0.13);
    font: inherit;
    color: inherit;
    text-align: left;
    cursor: pointer;
    transition: background 0.12s ease, border-color 0.12s ease, opacity 0.12s ease;
  }
  .chip:not(.on) {
    background: none;
    border-color: rgba(18, 18, 18, 0.13);
    opacity: 0.5;
  }
  .chip.on:hover:not(:disabled) { background: rgba(123, 106, 96, 0.19); }
  .chip:not(.on):hover:not(:disabled) { opacity: 0.72; }
  .chip:disabled { cursor: default; }
  .chip-label { font-size: 0.84rem; line-height: 1.25; }
  .chip-eg { font-size: 0.7rem; line-height: 1.25; opacity: 0.6; }

  .reset {
    margin-left: auto;
    padding: 4px 12px 5px;
    border: none;
    border-radius: 999px;
    background: none;
    font: inherit;
    font-size: 0.82rem;
    color: inherit;
    opacity: 0.5;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .cloud-out,
  .uniqueness-note {
    font-size: 0.8rem;
    line-height: 1.55;
    opacity: 0.7;
  }
  /* Flush with the cloud's left edge rather than centred: a centred line of
     small text under a full-bleed field reads as a stray caption. */
  .leftover .cloud-out { margin: 14px auto 0 0; max-width: 74ch; }
  .cloud-empty { margin-top: 26px; }

  /* No card. The cloud runs the full width of the page and sits straight on
     the paper — a white panel round it made it look like one more chart,
     and this is the one thing here that is not a chart. The negative margin
     cancels the section's own gutter so it reaches the edges. */
  .leftover .cloud-box {
    width: auto;
    max-width: none;
    /* A little more air than the paragraph that used to sit here left: the
       cloud now follows the control bar directly and wants the gap. */
    margin: 28px -16px 0;
    padding: 34px clamp(16px, 4vw, 64px) 40px;
    background: none;
    border-radius: 0;
    box-shadow: none;
  }

  /* Scattered, but not overlapping. Big and small words are interleaved by
     the hash order, and each one is nudged off the baseline and tilted a
     degree or two, so the block drifts. Words that cross each other cannot
     be read, and reading them is the whole point, so the drift stops well
     short of a collision. */
  .cloud-words {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 6px 15px;
    margin: 0;
    padding: 10px 0;
    list-style: none;
  }
  .cloud-words button {
    padding: 0 2px;
    border: none;
    background: none;
    font: inherit;
    font-weight: 400;
    line-height: 1.1;
    color: var(--ink);
    cursor: pointer;
    /* Slow enough to watch. Each word carries its own delay, set inline
       from the same seed as its position, so a filter change sweeps across
       the cloud instead of snapping it all at once. */
    transition: opacity 0.5s ease;
  }
  /* Hover dim sits on the LI, filter dim on the button inside it, so the
     two can have their own timing on the same pixel: the filter's slow
     staggered fade is worth watching, but a hover that takes half a second
     to answer just feels broken. This one is instant, both ways. */
  .cloud-words li.dim { opacity: 0.26; }

  /* Dimmed by a filter rather than removed by one. Everywhere else in the
     project filtering means the thing leaves and the totals recompute; here
     it means the word fades and stays put, because the whole point of this
     frame is WATCHING the common words go out. Nothing downstream reads
     from it, so no aggregate is being quietly misreported. */
  .cloud-words button.out { opacity: 0.085; }
  .cloud-words button.out:hover,
  .cloud-words button.out:focus-visible { opacity: 0.4; }
  .cloud-words button:focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: 2px;
    border-radius: 4px;
  }

  /* The counts, right where the cursor already is. Sits above the word so
     it never covers the one being read, and takes no layout space, so
     showing it cannot reflow the cloud underneath the pointer. */
  .cloud-words li { position: relative; }
  .tip {
    position: absolute;
    bottom: calc(100% - 2px);
    left: 50%;
    z-index: 3;
    padding: 3px 9px 4px;
    border-radius: 999px;
    background: var(--ink);
    color: #fff;
    font-size: 0.7rem;
    line-height: 1.35;
    white-space: nowrap;
    opacity: 0;
    transform: translate(-50%, 3px);
    pointer-events: none;
    transition: opacity 0.1s ease, transform 0.1s ease;
  }
  .tip strong { font-weight: 700; }
  .cloud-words li:hover .tip,
  .cloud-words li:focus-within .tip {
    opacity: 1;
    transform: translate(-50%, 0);
  }


  .uniqueness {
    margin: 44px auto 0;
    max-width: 30ch;
    font-size: clamp(1.4rem, 3.2vw, 2.1rem);
    font-weight: 400;
    line-height: 1.26;
    letter-spacing: -0.012em;
    text-align: center;
  }
  .uniqueness-note { margin: 14px auto 0; max-width: 68ch; text-align: center; }

  .choose-from {
    margin: -16px 0 0;
    font-family: var(--display);
    font-size: 0.95rem;
    color: var(--ink);
    opacity: 0.6;
    text-align: center;
  }

  @media (max-width: 760px) {
    .decks { grid-template-columns: 1fr; }
    .reset { margin-left: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .pill,
    .fill,
    .onward .jet,
    .line.bottom { transition: none; }
  }
</style>
