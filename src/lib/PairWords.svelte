<script>
  /**
   * The describing words two cities have in common, rarest first: a word only a
   * handful of the fifty use says more about a pair than "cultural" does.
   */
  import { sharedWords } from './data.js';

  let { a, b, index } = $props();

  let words = $derived(sharedWords(a, b, index, 14));
  let top = $derived(Math.max(2, ...words.map((w) => w.cities)));
  // Rarer word = bigger word, on the page's one display face.
  const sizeOf = (n) => 16 + ((top - n) / Math.max(1, top - 2)) * 26;
</script>

<div class="meet">
  {#if words.length}
    <ul>
      {#each words as w (w.word)}
        <li style="font-size:{sizeOf(w.cities)}px">{w.word}<span>{w.cities}</span></li>
      {/each}
    </ul>
    <p class="key">Both cities write these. Bigger word = fewer of the fifty use it. The small number is how many do.</p>
  {:else}
    <p class="none">{a.city} and {b.city} have no describing words in common.</p>
  {/if}
  <p class="sig">
    {#if a.signatureWord === b.signatureWord}
      Both over-use one word more than any other: <strong>{a.signatureWord}</strong>.
    {:else}
      {a.city} over-uses <strong>{a.signatureWord}</strong> most against the other cities. {b.city} over-uses <strong>{b.signatureWord}</strong>.
    {/if}
  </p>
</div>

<style>
  .meet { width: min(920px, 100%); margin-inline: auto; padding-inline: 16px; text-align: center; }
  ul { display: flex; flex-wrap: wrap; justify-content: center; align-items: baseline; gap: 8px 24px; margin: 0; padding: 0; list-style: none; font-family: var(--display); }
  li span { margin-left: 3px; font-size: 0.5em; vertical-align: super; opacity: 0.7; }
  .key { margin-top: 16px; font-size: 0.78rem; color: var(--text-secondary); }
  .none { font-family: var(--display); font-size: 1.5rem; }
  .sig { margin-top: 22px; font-size: 1rem; line-height: 1.5; color: var(--text-secondary); }
  .sig strong { color: var(--text-primary); font-weight: 650; }
</style>
