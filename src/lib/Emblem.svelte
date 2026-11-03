<script>
  /**
   * One drawn emblem per personality, tarot-style. Text always names the
   * personality beside it: the picture is character, not the only label.
   */
  let { name = 'The Understated' } = $props();

  // Gear teeth, generated so they are even.
  const teeth = Array.from({ length: 8 }, (_, i) => i * 45);
  const petals = Array.from({ length: 7 }, (_, i) => (i * 360) / 7);
</script>

<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  {#if name === 'The Braggart'}
    <path d="M22 72 L17 34 L36 50 L50 24 L64 50 L83 34 L78 72 Z" />
    <path d="M24 81 H76" />
    <circle cx="50" cy="60" r="4" />
  {:else if name === 'The Name-Dropper'}
    <circle cx="50" cy="40" r="23" />
    <circle cx="50" cy="40" r="16" stroke-dasharray="2 4" />
    <path d="M38 60 L30 86 L44 77 L50 86 L56 77 L70 86 L62 60" />
  {:else if name === 'The Closer'}
    <path d="M30 18 H70 M30 82 H70" />
    <path d="M35 18 C35 40 65 56 65 82 M65 18 C65 40 35 56 35 82" />
    <path d="M42 76 C46 70 54 70 58 76 Z" fill="currentColor" />
    <path d="M50 52 V66" stroke-dasharray="1 5" />
  {:else if name === 'The Host'}
    <path d="M20 24 H80 A5 5 0 0 1 85 29 V62 A5 5 0 0 1 80 67 H46 L30 82 V67 H20 A5 5 0 0 1 15 62 V29 A5 5 0 0 1 20 24 Z" />
    <circle cx="35" cy="45" r="2.6" fill="currentColor" />
    <circle cx="50" cy="45" r="2.6" fill="currentColor" />
    <circle cx="65" cy="45" r="2.6" fill="currentColor" />
  {:else if name === 'The Sensualist'}
    {#each petals as a (a)}
      <ellipse cx="50" cy="29" rx="10" ry="19" transform="rotate({a} 50 50)" />
    {/each}
    <circle cx="50" cy="50" r="7" fill="currentColor" />
  {:else if name === 'The Underdog'}
    <path d="M12 80 C30 56 70 56 88 80 Z" />
    <path d="M50 20 L55 34 L70 34 L58 43 L62 57 L50 49 L38 57 L42 43 L30 34 L45 34 Z" />
  {:else if name === 'The Bargain'}
    <path d="M18 20 H50 L84 54 L54 84 L18 50 Z" />
    <circle cx="33" cy="35" r="5" />
    <path d="M44 60 L60 44" />
    <circle cx="46" cy="47" r="2" fill="currentColor" />
    <circle cx="59" cy="58" r="2" fill="currentColor" />
  {:else if name === 'The Good Citizen'}
    <path d="M22 78 C14 40 42 16 82 18 C84 58 60 86 22 78 Z" />
    <path d="M14 88 C30 66 44 52 62 38" />
    <path d="M38 62 L36 46 M48 53 L47 38 M38 62 L54 64 M48 53 L64 54" />
  {:else if name === 'The Cliche Machine'}
    {#each teeth as a (a)}
      <rect x="44" y="12" width="12" height="13" rx="2" transform="rotate({a} 50 50)" />
    {/each}
    <circle cx="50" cy="50" r="26" />
    <circle cx="50" cy="50" r="9" />
  {:else}
    <path d="M12 64 H88" />
    <circle cx="50" cy="42" r="13" />
  {/if}
</svg>

<style>
  svg { display: block; width: 100%; height: 100%; }
</style>
