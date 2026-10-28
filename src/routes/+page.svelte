<script>
  /** Index: what the two prototypes are and how they differ. */
</script>

<svelte:head><title>How cities sell themselves — prototypes</title></svelte:head>

<main>
  <p class="eyebrow">CS 171 · Milestone 6</p>
  <h1>How cities sell themselves</h1>
  <p class="lede">
    Fifty official tourism-board homepages, parsed into theme rates, rhetorical
    moves and distinctive vocabulary. Two prototypes combine the same three
    views — a type grid, a two-measure scatter and a head-to-head comparison —
    with different layouts and different coordination.
  </p>

  <a class="panel card wide first" href="board/">
    <p class="eyebrow">The hook</p>
    <h2>Where do you want to go today?</h2>
    <p>
      The front door. Pick a destination, take the boarding pass, then fly
      through the words that city's tourism board wrote — and watch how many of
      the other forty-nine wrote them too. Twenty-six of the fifty call
      themselves <em>unique</em>.
    </p>
    <ul>
      <li>Dropdown or dice → destination</li>
      <li>Scroll → the fly-through</li>
      <li>Word size = cities using it</li>
    </ul>
  </a>

  <div class="cards">
    <a class="panel card" href="prototype-a/">
      <p class="eyebrow">Prototype A</p>
      <h2>Rank the 50</h2>
      <p>
        Pick a theme and all fifty cities <strong>sort</strong> into a card
        gallery — most first or least first. Reading down a ranked column needs
        no chart literacy at all. Starts from a <em>measure</em>.
      </p>
      <ul>
        <li>Theme → sort</li>
        <li>Category → filter</li>
        <li>Two cards → comparison</li>
      </ul>
    </a>

    <a class="panel card" href="prototype-b/">
      <p class="eyebrow">Prototype B</p>
      <h2>Spin the globe, pick two</h2>
      <p>
        A large globe you drag to rotate. Click two cities anywhere on Earth and
        every comparison below fills in for that pair. Starts from a
        <em>place</em>.
      </p>
      <ul>
        <li>Globe click → selection</li>
        <li>Archetype → highlight</li>
        <li>Pair → full cross-comparison</li>
      </ul>
    </a>
  </div>

  <a class="panel card wide" href="story/">
    <p class="eyebrow">Site structure</p>
    <h2>The whole story, in order</h2>
    <p>
      The rough layout of the final site: hook, three beats, the globe payoff,
      then the tool. Both built views are embedded live; the three
      <strong>drafted</strong> views sit in their narrative slots as wireframes
      with their encoding specs.
    </p>
    <ul>
      <li>2 built</li>
      <li>3 drafted</li>
      <li>Novel view: the Silence Grid</li>
    </ul>
  </a>

  <section class="panel caveats">
    <h3>What this data will and will not support</h3>
    <ul class="note">
      <li>
        Similarity here is cosine on descriptive TF-IDF and tops out at
        <strong>0.20</strong> across the whole corpus — a ranking, not a
        percentage. No two cities are "95% alike", so we show no similarity
        score at all.
      </li>
      <li>
        The popular/hidden label is hand-assigned and about 10 of 50 disagree
        with their own Wikipedia traffic (Chicago is tagged "hidden" on 3.6M
        views a year). <strong>Obscurity</strong>, an outside measure, is
        offered as a sort key in Prototype A.
      </li>
      <li>
        <strong>Distinctiveness</strong> and <strong>vocabulary richness</strong>
        correlate −0.76 and −0.72 with how long the scrape was, so neither is
        offered as an axis. Rare word share is.
      </li>
      <li>
        Archetype is the theme a city <em>over-indexes</em> on, not the one it
        mentions most — food leads almost everywhere.
      </li>
    </ul>
  </section>
</main>

<style>
  main {
    max-width: 880px;
    margin: 0 auto;
    padding: 56px 16px 64px;
  }
  h1 { font-size: 2rem; margin-top: 6px; }
  .lede {
    margin-top: 12px;
    max-width: 64ch;
    color: var(--text-secondary);
    line-height: 1.6;
    font-size: 0.92rem;
  }
  .cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-top: 28px;
  }
  .card {
    text-decoration: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
    transition: border-color 120ms, transform 120ms;
  }
  .card:hover { border-color: var(--text-muted); transform: translateY(-2px); }
  .card p:not(.eyebrow) { font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5; }
  .card ul {
    margin: 4px 0 0; padding: 0; list-style: none;
    display: flex; flex-wrap: wrap; gap: 5px;
  }
  .card li {
    font-size: 0.68rem;
    padding: 2px 8px;
    border: 1px solid var(--border);
    border-radius: 999px;
    color: var(--text-muted);
  }

  .card.wide { margin-top: 14px; }
  /* The hook sits above the two prototypes, so it leads rather than follows. */
  .card.first { margin-top: 28px; }

  .caveats { margin-top: 28px; }
  .caveats h3 { margin-bottom: 9px; }
  .caveats ul { margin: 0; padding-left: 18px; }
  .caveats li { margin-bottom: 7px; }

  @media (max-width: 720px) {
    .cards { grid-template-columns: 1fr; }
  }
</style>
