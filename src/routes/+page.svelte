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

  <div class="cards">
    <a class="panel card" href="prototype-a/">
      <p class="eyebrow">Prototype A</p>
      <h2>Start from a type, narrow down</h2>
      <p>
        A faceted dashboard. The type grid is the control surface: picking a row
        <strong>filters</strong> the scatter and the summary numbers. Side-by-side
        layout, no geography.
      </p>
      <ul>
        <li>Grid → filter</li>
        <li>Hover → link</li>
        <li>Two clicks → comparison</li>
      </ul>
    </a>

    <a class="panel card" href="prototype-b/">
      <p class="eyebrow">Prototype B</p>
      <h2>Start from a city, follow the thread</h2>
      <p>
        A stacked, map-first walkthrough. The map leads, and clicking a city
        draws arcs to the four cities that sound most like it. Filtering moves to
        a brush; the grid only <strong>highlights</strong>.
      </p>
      <ul>
        <li>Brush → filter</li>
        <li>Grid + hover → link</li>
        <li>Map click → selection</li>
      </ul>
    </a>
  </div>

  <section class="panel caveats">
    <h3>What this data will and will not support</h3>
    <ul class="note">
      <li>
        Similarity is cosine on descriptive TF-IDF and tops out at
        <strong>0.20</strong> across the whole corpus. It ranks pairs; it is not a
        percentage, and no two cities here are "95% alike".
      </li>
      <li>
        There are <strong>four definitions of "twin"</strong> and they pick the
        same partner for at most 8 of the 50 cities. Both prototypes show all four.
      </li>
      <li>
        The popular/hidden label is hand-assigned and about 10 of 50 disagree with
        their own Wikipedia traffic. Prototype B filters on
        <strong>obscurity</strong>, an outside measure, instead.
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

  .caveats { margin-top: 28px; }
  .caveats h3 { margin-bottom: 9px; }
  .caveats ul { margin: 0; padding-left: 18px; }
  .caveats li { margin-bottom: 7px; }

  @media (max-width: 720px) {
    .cards { grid-template-columns: 1fr; }
  }
</style>
