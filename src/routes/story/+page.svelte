<script>
  /**
   * SITE STRUCTURE — the rough layout of the final project, in story order.
   *
   * This is the scaffold, not the finished site. Every section is in its
   * narrative position with its real text and its real numbers; the views
   * themselves are in one of two states:
   *
   *   BUILT   — the live component, loading the same CSV as the prototypes
   *   DRAFT   — a wireframe and an encoding spec for a view we have designed
   *             but not implemented
   *
   * Reading order follows STORYBOARD: hook → three beats → the globe payoff →
   * hand the tool over.
   */
  import { onMount } from 'svelte';
  import { loadCities, loadCountries, THEMES, axisById, greatCircleKm } from '$lib/data.js';
  import CardGrid from '$lib/CardGrid.svelte';
  import Globe from '$lib/Globe.svelte';
  import Legend from '$lib/Legend.svelte';

  let cities = $state([]);
  let countries = $state(null);
  let error = $state(null);

  // --- shared selection state, one owner each ---------------------------
  let beatTheme = $state('Nature');   // SORT, drives the built card deck
  let hoveredCity = $state(null);     // LINK, across the deck and the globe
  let picks = $state([]);             // SELECT, the globe pair

  let measure = $derived(axisById(`theme:${beatTheme}`));
  let byName = $derived(new Map(cities.map((c) => [c.city, c])));
  let allNames = $derived(new Set(cities.map((c) => c.city)));

  let pair = $derived(picks.map((n) => byName.get(n)).filter(Boolean));
  let km = $derived(pair.length === 2 ? greatCircleKm(pair[0], pair[1]) : null);

  // Silent cities per theme — the number the Silence Grid is designed around.
  let silence = $derived(
    THEMES.map((t) => ({
      theme: t,
      silent: cities.filter((c) => c.themes[t] === 0).length
    })).sort((a, b) => b.silent - a.silent)
  );
  let silentCells = $derived(silence.reduce((s, d) => s + d.silent, 0));

  let crossRegion = $derived(cities.filter((c) => c.crossRegionTwin).length);

  function pick(name) {
    if (picks.includes(name)) picks = picks.filter((n) => n !== name);
    else if (picks.length < 2) picks = [...picks, name];
    else picks = [picks[1], name];
  }

  const sections = [
    { id: 'hook', label: 'Hook' },
    { id: 'beat-1', label: 'What they say' },
    { id: 'beat-2', label: 'How they say it' },
    { id: 'beat-3', label: 'What they leave out' },
    { id: 'message', label: 'The message' },
    { id: 'browse', label: 'Browse' }
  ];

  onMount(async () => {
    try {
      const [loaded, geo] = await Promise.all([loadCities(), loadCountries()]);
      cities = loaded.cities;
      countries = geo;
    } catch (e) {
      error = e.message;
    }
  });
</script>

<svelte:head><title>How cities sell themselves — site structure</title></svelte:head>

<nav class="rail" aria-label="Sections">
  <a class="home" href="../">← Prototypes</a>
  <ul>
    {#each sections as s}
      <li><a href="#{s.id}">{s.label}</a></li>
    {/each}
  </ul>
</nav>

<main class="story">
  <header class="cover">
    <p class="eyebrow">CS 171 · final project — site structure</p>
    <h1>Every city says it&rsquo;s one of a kind.<br />They nearly all say it with the same dozen words.</h1>
    <p class="lede">
      Fifty official tourism homepages, 25 famous and 25 you have probably not
      heard of. The more visitors a city gets, the more its own description
      sounds like everybody else&rsquo;s &mdash; so the places that still sound
      like themselves are usually the ones nobody has told you about yet.
    </p>
    <div class="howto note">
      <span class="chip built">Built</span> the live view, loading
      <code>city_master.csv</code> in the browser.
      <span class="chip draft">Draft</span> designed, wireframed and specified
      here, not implemented yet.
    </div>
  </header>

  {#if error}
    <p class="panel error">Could not load the data: {error}</p>
  {:else if !cities.length}
    <p class="panel note">Loading 50 cities…</p>
  {:else}

    <!-- ===================== ACT 1 — THE HOOK ======================= -->
    <section id="hook" class="act">
      <p class="eyebrow">Act 1 · the hook</p>
      <h2>You have read this page before</h2>
      <p class="body">
        The site opens on one paragraph of tourism copy with the city&rsquo;s
        name removed, and asks the reader to guess. It could be any of six. Then
        the paragraph dissolves into the shelf every city is writing from:
        thirteen adjectives that appear in fifteen or more of the fifty, and
        <strong>49 of 50 cities use at least one of them</strong>. Twenty-six
        cities call themselves <em>unique</em> — with the same word.
      </p>

      <div class="stats">
        <div class="stat"><strong>13</strong><span>adjectives shared by 15+ of the 50 cities</span></div>
        <div class="stat"><strong>30</strong><span>cities call themselves <em>cultural</em></span></div>
        <div class="stat"><strong>26</strong><span>call themselves <em>unique</em></span></div>
        <div class="stat"><strong>3</strong><span>words carry two thirds of all superlatives: best, largest, oldest</span></div>
      </div>

      <!-- DRAFT 1 -->
      <article class="slot draft">
        <header>
          <span class="chip draft">Draft</span>
          <h3>The Shared Shelf</h3>
          <p class="q">Do cities rely on the same adjectives to attract visitors?</p>
        </header>
        <div class="wire">
          <svg viewBox="0 0 520 200" role="img" aria-label="Wireframe: an anonymised paragraph above a shelf of shared adjectives, each with a 50-dot strip showing which cities use it">
            <rect class="frame" x="8" y="8" width="504" height="184" rx="6" />
            <text class="wlab" x="20" y="28">&ldquo;A ___ city, rich in ___ heritage…&rdquo;</text>
            {#each [0, 1, 2] as r}
              <rect class="bar" x="20" y={38 + r * 12} width={360 - r * 40} height="5" rx="2.5" />
            {/each}
            {#each [0, 1, 2, 3] as i}
              <rect class="hl" x={60 + i * 86} y={36 + (i % 3) * 12} width="46" height="9" rx="2" />
            {/each}
            <line class="rule" x1="20" y1="86" x2="500" y2="86" />
            <text class="wlab" x="20" y="104">the shelf · one row per word, one dot per city</text>
            {#each ['cultural 30', 'unique 26', 'historic 25', 'vibrant 22'] as w, r}
              <text class="wtiny" x="20" y={124 + r * 18}>{w}</text>
              {#each Array(25) as _, d}
                <circle class="dot" class:on={d < [15, 13, 12, 11][r]} cx={126 + d * 14.6} cy={120 + r * 18} r="3.4" />
              {/each}
            {/each}
          </svg>
        </div>
        <dl class="spec">
          <div><dt>Mark</dt><dd>one row per shared word; 50 dots, one per city, filled if that city uses it</dd></div>
          <div><dt>Position</dt><dd>rows ordered by how many cities share the word — the shelf tapers</dd></div>
          <div><dt>Colour</dt><dd>category on the filled dots only (big destination / hidden gem), nothing else</dd></div>
          <div><dt>Interaction</dt><dd>click a word → the paragraph above re-renders with only that word lit, and the deck in Act 2 filters to the cities that use it</dd></div>
          <div><dt>Why here</dt><dd>it has to come first: the whole argument depends on the reader believing the sameness before we measure it</dd></div>
        </dl>
      </article>
    </section>

    <!-- ================= ACT 2 — BEAT 1: THEMES ===================== -->
    <section id="beat-1" class="act">
      <p class="eyebrow">Act 2 · beat 1</p>
      <h2>What cities talk about</h2>
      <p class="body">
        Ten themes, measured as mentions per 1,000 words so a 200-word homepage
        and a 2,000-word one can be compared. Food leads the corpus; the
        extremes carry the story. Tasmania mentions nature 111 times per 1,000
        words. Pick a theme and read down the column.
      </p>

      <!-- BUILT 1 -->
      <article class="slot built">
        <header>
          <span class="chip built">Built</span>
          <h3>The sorted deck</h3>
          <p class="q">Who pushes this theme hardest, and who never mentions it?</p>
          <a class="jump" href="../prototype-a/">Open the full view →</a>
        </header>

        <div class="theme-pills" role="group" aria-label="Theme">
          {#each THEMES as t}
            <button aria-pressed={beatTheme === t} onclick={() => (beatTheme = t)}>{t}</button>
          {/each}
        </div>

        <CardGrid
          {cities}
          visibleNames={allNames}
          {measure}
          direction="desc"
          {hoveredCity}
          {picks}
          cityColor={true}
          columns={10}
          onhovercity={(c) => (hoveredCity = c)}
          onpickcity={pick}
        />
        <p class="note cap">
          {measure.label} · {measure.unit}. Rank is over all fifty cities.
          Clicking two cards picks the pair the globe below opens on.
        </p>
      </article>
    </section>

    <!-- ============== ACT 2 — BEAT 2: PERSONALITY =================== -->
    <section id="beat-2" class="act">
      <p class="eyebrow">Act 2 · beat 2</p>
      <h2>How cities talk</h2>
      <p class="body">
        The same text, read for rhetoric instead of subject: who addresses you,
        who rushes you, who cites credentials. Berlin says <em>you</em> 48 times
        per 1,000 words; six cities never say it once. Famous cities reach for
        clichés and urgency; obscure ones talk to you and name their proof.
      </p>

      <article class="slot partial">
        <header>
          <span class="chip partial">Built, not yet standalone</span>
          <h3>The personality read-out</h3>
          <p class="q">How does this city sell, as opposed to what does it sell?</p>
          <a class="jump" href="../prototype-b/">See it inside the comparison →</a>
        </header>
        <div class="ph">
          <p class="note">
            The nine rhetorical dimensions already render inside the
            head-to-head panel. What is missing is the corpus-wide version of
            it: all fifty cities on the famous ↔ obscure axis, grouped by
            personality, so the reader sees the split rather than one pair of
            it. Placeholder — final layout to be designed in the next pass.
          </p>
        </div>
      </article>
    </section>

    <!-- ================ ACT 2 — BEAT 3: SILENCE ===================== -->
    <section id="beat-3" class="act">
      <p class="eyebrow">Act 2 · beat 3 · <strong>our novel view</strong></p>
      <h2>What cities leave out</h2>
      <p class="body">
        Every theme chart in this genre draws what is there. The number that
        actually surprised us is what is missing:
        <strong>{silentCells} of the 500 city-theme cells are zero</strong>.
        {silence[0].silent} of 50 sites never mention {silence[0].theme.toLowerCase()};
        {silence[1].silent} never mention {silence[1].theme.toLowerCase()}. London
        — famous for food, parks and architecture — mentions none of the three.
        So we invert the usual encoding: the absences are the ink.
      </p>

      <div class="silence-strip">
        {#each silence as s}
          <div class="sil">
            <span class="num">{s.silent}</span>
            <span class="lab">{s.theme}</span>
            <span class="bar" style:--f="{(s.silent / 50) * 100}%"></span>
          </div>
        {/each}
      </div>
      <p class="note cap">Cities whose homepage never mentions the theme at all, out of 50.</p>

      <!-- DRAFT 2 — the novel view -->
      <article class="slot draft novel">
        <header>
          <span class="chip novel">Draft · novel view</span>
          <h3>The Silence Grid</h3>
          <p class="q">What is a city not telling you — and is the gap the same one everywhere?</p>
        </header>
        <div class="wire">
          <svg viewBox="0 0 520 244" role="img" aria-label="Wireframe: a 50-row by 10-column matrix in which cells for themes a city never mentions are drawn as solid blocks and everything else is left faint">
            <rect class="frame" x="8" y="8" width="504" height="228" rx="6" />
            {#each THEMES as t, c}
              <text class="wtiny rot" x={108 + c * 38} y="30" transform="rotate(-38 {108 + c * 38} 30)">{t.slice(0, 9)}</text>
            {/each}
            {#each Array(9) as _, r}
              <text class="wtiny" x="20" y={54 + r * 19}>city {r + 1}</text>
              {#each Array(10) as __, c}
                {@const off = (r * 7 + c * 3) % 10 < 3}
                <rect
                  class="cell"
                  class:silent={off}
                  x={96 + c * 38}
                  y={46 + r * 19}
                  width="32"
                  height="13"
                  rx="2"
                />
              {/each}
            {/each}
            <text class="wlab" x="20" y="228">rows sort by how many silences · solid = never mentioned</text>
          </svg>
        </div>
        <dl class="spec">
          <div><dt>Mark</dt><dd>50 × 10 matrix. A cell is drawn <strong>only when the rate is zero</strong>; everything above zero fades to the page</dd></div>
          <div><dt>Position</dt><dd>rows sorted by silence count — the most selective city at the top; columns sorted by how often the theme is skipped</dd></div>
          <div><dt>Colour</dt><dd>category on the solid cells, so the reader can see whether silence is a hidden-gem habit (it is not — both halves do it)</dd></div>
          <div><dt>Interaction</dt><dd>hover a row → that city lights up on the globe below; click a column → the deck in beat 1 filters to the cities that skip that theme</dd></div>
          <div><dt>Why it is novel</dt><dd>absence has no natural mark, so it is almost never drawn. Inverting figure and ground turns the hole in a tourism pitch into the thing you read first — and it is directly actionable for a traveller deciding where to go</dd></div>
          <div><dt>Risk</dt><dd>a zero rate can mean &ldquo;not on the homepage&rdquo; rather than &ldquo;not in the city&rdquo;. The view has to say so on its face, next to the title, not in a footnote</dd></div>
        </dl>
      </article>
    </section>

    <!-- =============== ACT 3 — THE MAIN MESSAGE ===================== -->
    <section id="message" class="act">
      <p class="eyebrow">Act 3 · the payoff</p>
      <h2>Where a city sits tells you nothing about how it sells itself</h2>
      <p class="body">
        <strong>{crossRegion} of 50 cities</strong> sound most like a city in a
        different world region. Spin the globe and pick two: the arc is the
        claim. Proximity leaves no fingerprint on the language; character does.
      </p>

      <!-- BUILT 2 -->
      <article class="slot built">
        <header>
          <span class="chip built">Built</span>
          <h3>The globe</h3>
          <p class="q">Do two cities on opposite sides of the planet sound alike?</p>
          <a class="jump" href="../prototype-b/">Open the full view →</a>
        </header>
        <div class="globe-wrap">
          <Globe
            {cities}
            {countries}
            {hoveredCity}
            {picks}
            focusCities={picks}
            showCaption={false}
            onhovercity={(c) => (hoveredCity = c)}
            onpickcity={pick}
          />
          <div class="globe-side">
            <Legend note={false} />
            {#if pair.length === 2}
              <p class="pairline">
                <strong>{pair[0].city}</strong> &amp; <strong>{pair[1].city}</strong>
                — {Math.round(km).toLocaleString()} km apart.
              </p>
            {:else}
              <p class="note">Click two cities to draw the arc.</p>
            {/if}
            {#if picks.length}
              <button onclick={() => (picks = [])}>Clear selection</button>
            {/if}
          </div>
        </div>
      </article>

      <!-- DRAFT 3 -->
      <article class="slot draft">
        <header>
          <span class="chip draft">Draft</span>
          <h3>All the arcs at once, and the control group</h3>
          <p class="q">Is the cross-region result real, or did we pick the flattering pairs?</p>
        </header>
        <div class="wire">
          <svg viewBox="0 0 520 210" role="img" aria-label="Wireframe: a globe with every twin arc drawn at once, beside a control panel listing the seven same-country pairs, each marked as not a twin">
            <circle class="frame" cx="130" cy="105" r="92" />
            {#each [[60, 70, 200, 60], [70, 150, 190, 120], [95, 45, 175, 165], [55, 110, 205, 95]] as a}
              <path class="arc" d="M{a[0]},{a[1]} Q130,{(a[1] + a[3]) / 2 - 60} {a[2]},{a[3]}" />
            {/each}
            {#each [[60, 70], [200, 60], [70, 150], [190, 120], [95, 45], [175, 165], [55, 110], [205, 95]] as p}
              <circle class="node" cx={p[0]} cy={p[1]} r="4" />
            {/each}
            <line class="rule" x1="248" y1="22" x2="248" y2="190" />
            <text class="wlab" x="266" y="34">control · 7 same-country pairs</text>
            {#each ['Paris / Marseille', 'Berlin / Hamburg', 'Rome / Bologna', 'LA / New York', 'LA / Chicago', 'NYC / Chicago', 'Sydney / Tasmania'] as p, r}
              <text class="wtiny" x="266" y={54 + r * 19}>{p}</text>
              <text class="wtiny x" x="492" y={54 + r * 19}>not twins</text>
            {/each}
          </svg>
        </div>
        <dl class="spec">
          <div><dt>Mark</dt><dd>one great-circle arc per city to its closest-sounding twin, all 50 drawn at once over the globe</dd></div>
          <div><dt>Colour</dt><dd>same-region versus cross-region arcs — the one place in the project where colour is not category, so it needs its own legend and will be tested against the CVD check first</dd></div>
          <div><dt>Interaction</dt><dd>the control panel is a turn, not a filter: clicking a same-country pair spins the globe to it and shows that neither city is the other&rsquo;s twin</dd></div>
          <div><dt>Honesty</dt><dd>four defensible twin definitions agree on almost nobody, and the strongest pairing in the corpus scores 0.169 on a 0–1 cosine. The view shows rank and the shared words — never a percentage</dd></div>
        </dl>
      </article>
    </section>

    <!-- ============== ACT 4 — HAND THE TOOL OVER ==================== -->
    <section id="browse" class="act">
      <p class="eyebrow">Act 4 · hand it over</p>
      <h2>Stop browsing by map. Browse by character.</h2>
      <p class="body">
        The closing move is the tool itself: pick a city you already love, read
        its theme profile and its rhetorical tell, and get the unfamiliar city
        that shares them, with the words that explain why.
      </p>

      <div class="two-up">
        <article class="slot built compact">
          <header>
            <span class="chip built">Built</span>
            <h3>Browse everything</h3>
            <p class="q">Sort fifty cities by any theme, by obscurity, by cliché rate.</p>
            <a class="jump" href="../prototype-a/">Open →</a>
          </header>
        </article>

        <article class="slot draft compact">
          <header>
            <span class="chip draft">Draft · stretch</span>
            <h3>Guess the city</h3>
            <p class="q">Can you identify a city from six of its own words?</p>
          </header>
          <p class="note">
            Six rare words, four city buttons, score kept across rounds. 49 of
            50 cities keep more than 5% of their vocabulary to themselves —
            Marrakech 30.9%, Ohrid 30.6%, Brno 29.2%. London, at 3.6%, is the
            one nobody can get. That is the last beat of the argument, delivered
            as a game rather than a chart.
          </p>
        </article>
      </div>
    </section>

    <footer class="foot">
      <Legend />
      <p class="note">
        50 cities × 139 columns, from the official tourism homepage of each.
        Theme measures are mentions per 1,000 words, never raw counts — the
        descriptions differ in length by roughly tenfold. Similarity is cosine
        on descriptive TF-IDF and tops out at 0.20 across the whole corpus, so
        it is reported as a ranking and never as a percentage.
      </p>
    </footer>
  {/if}
</main>

<style>
  .rail {
    position: sticky;
    top: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 9px 20px;
    background: rgba(247, 241, 232, 0.86);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border);
    font-size: 0.74rem;
  }
  .rail .home { text-decoration: none; color: var(--text-muted); font-weight: 600; }
  .rail ul { display: flex; gap: 16px; margin: 0; padding: 0; list-style: none; flex-wrap: wrap; }
  .rail a { text-decoration: none; color: var(--text-secondary); }
  .rail a:hover { color: var(--accent); }

  .story { max-width: 1180px; margin: 0 auto; padding: 36px 20px 80px; }

  .cover { max-width: 72ch; margin-bottom: 44px; }
  .cover h1 { font-size: 2.1rem; line-height: 1.18; margin-top: 8px; }
  .lede {
    margin-top: 14px;
    color: var(--text-secondary);
    line-height: 1.6;
    font-size: 0.95rem;
  }
  .howto { margin-top: 18px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  code { font-size: 0.72rem; background: var(--wash); padding: 1px 5px; border-radius: 4px; }

  .act { margin: 0 0 64px; scroll-margin-top: 56px; }
  .act h2 { font-size: 1.5rem; margin: 6px 0 12px; max-width: 24ch; }
  .body { max-width: 68ch; color: var(--text-secondary); line-height: 1.62; font-size: 0.9rem; }

  .stats { display: flex; flex-wrap: wrap; gap: 10px; margin: 20px 0 4px; }
  .stat {
    flex: 1 1 180px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 12px 14px;
  }
  .stat strong { display: block; font-size: 1.6rem; line-height: 1; }
  .stat span { display: block; margin-top: 6px; font-size: 0.72rem; color: var(--text-secondary); line-height: 1.4; }

  /* A slot is one view's place in the page: built, part-built or drafted. */
  .slot {
    margin-top: 22px;
    border-radius: var(--radius);
    padding: 16px;
    background: var(--surface-1);
    border: 1px solid var(--border);
  }
  .slot.draft {
    background: transparent;
    border: 1.5px dashed var(--axis);
  }
  .slot.partial { border-style: solid; background: var(--wash); }
  .slot header { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
  .slot h3 { font-size: 1rem; }
  .slot .q { font-size: 0.78rem; color: var(--text-muted); flex: 1 1 260px; }
  .jump { font-size: 0.74rem; text-decoration: none; color: var(--accent); white-space: nowrap; }
  .slot.compact { min-height: 0; }

  .chip {
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 3px 7px;
    border-radius: 999px;
    border: 1px solid var(--border);
    white-space: nowrap;
  }
  .chip.built { background: var(--text-primary); color: var(--surface-1); border-color: var(--text-primary); }
  .chip.draft { background: transparent; color: var(--text-muted); border-style: dashed; }
  .chip.partial { background: var(--wash); color: var(--text-secondary); }
  .chip.novel { background: var(--gem); color: #fff; border-color: var(--gem); }

  .theme-pills { display: flex; flex-wrap: wrap; gap: 6px; margin: 14px 0 12px; }
  .theme-pills button { font-size: 0.72rem; padding: 4px 9px; }

  .cap { margin-top: 10px; }

  /* Wireframes. Ink only — these are sketches, not data. */
  .wire { margin: 14px 0 6px; }
  .wire svg { width: 100%; height: auto; display: block; }
  .frame { fill: none; stroke: var(--axis); stroke-dasharray: 4 4; }
  .bar { fill: var(--gridline); }
  .hl { fill: none; stroke: var(--text-muted); stroke-dasharray: 3 2; }
  .rule { stroke: var(--gridline); }
  .wlab { font-size: 9px; fill: var(--text-muted); }
  .wtiny { font-size: 8px; fill: var(--text-muted); }
  .wtiny.x { text-anchor: end; }
  .dot { fill: none; stroke: var(--axis); }
  .dot.on { fill: var(--text-muted); stroke: none; }
  .cell { fill: var(--gridline); opacity: 0.5; }
  .cell.silent { fill: var(--text-primary); opacity: 0.85; }
  .arc { fill: none; stroke: var(--text-muted); stroke-width: 1.2; }
  .node { fill: var(--surface-1); stroke: var(--text-primary); stroke-width: 2; }

  .spec { margin: 10px 0 0; display: grid; gap: 7px; }
  .spec > div { display: grid; grid-template-columns: 96px 1fr; gap: 10px; }
  .spec dt { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); font-weight: 650; }
  .spec dd { margin: 0; font-size: 0.78rem; color: var(--text-secondary); line-height: 1.5; }

  .silence-strip { display: flex; gap: 6px; margin: 20px 0 0; flex-wrap: wrap; }
  .sil {
    flex: 1 1 86px;
    background: var(--surface-1);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 9px 10px 11px;
  }
  .sil .num { font-size: 1.25rem; font-weight: 650; }
  .sil .lab { display: block; font-size: 0.66rem; color: var(--text-secondary); margin: 2px 0 6px; }
  .sil .bar { display: block; height: 4px; border-radius: 2px; background: var(--gridline); }
  .sil .bar::after {
    content: ''; display: block; height: 100%; width: var(--f);
    background: var(--text-primary); border-radius: 2px;
  }

  .globe-wrap { display: grid; grid-template-columns: minmax(0, 1fr) 220px; gap: 18px; align-items: start; margin-top: 14px; }
  .globe-side { display: flex; flex-direction: column; gap: 10px; }
  .pairline { font-size: 0.8rem; color: var(--text-secondary); line-height: 1.45; }

  .ph { margin-top: 12px; }

  .two-up { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .two-up .slot { margin-top: 18px; }

  .foot { border-top: 1px solid var(--border); padding-top: 18px; display: grid; gap: 10px; }
  .error { color: #a33; }

  @media (max-width: 900px) {
    .globe-wrap, .two-up { grid-template-columns: 1fr; }
    .cover h1 { font-size: 1.6rem; }
  }
</style>
