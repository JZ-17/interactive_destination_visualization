<script>
  /**
   * A passport stamp: the big number in rubber-stamp ink, in the ticket's
   * colour. The line around the rim says what the number is, and the sentence
   * beside it on the page says it again in full.
   */
  let { value = '', rim = '', code = '' } = $props();
  const id = `stamp-${Math.random().toString(36).slice(2, 8)}`;
</script>

<svg class="stamp" viewBox="0 0 220 220" role="img" aria-label="{value}. {rim}">
  <defs>
    <path id="{id}-arc" d="M110 110 m-84 0 a84 84 0 1 1 168 0 a84 84 0 1 1 -168 0" />
    <filter id="{id}-ink">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" result="n" />
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3.2 2.35" result="holes" />
      <feComposite in="SourceGraphic" in2="holes" operator="in" />
    </filter>
  </defs>
  <g filter="url(#{id}-ink)">
    <circle cx="110" cy="110" r="104" class="ring" stroke-width="4.5" />
    <circle cx="110" cy="110" r="70" class="ring" stroke-width="2" />
    <text class="rim"><textPath href="#{id}-arc" textLength="520" lengthAdjust="spacing">{rim}</textPath></text>
    <text class="value" x="110" y="124" text-anchor="middle">{value}</text>
    <text class="code" x="110" y="153" text-anchor="middle">{code}</text>
  </g>
</svg>

<style>
  .stamp { display: block; width: 100%; height: auto; transform: rotate(-9deg); }
  .ring { fill: none; stroke: var(--ticket); transition: stroke 0.4s ease; }
  text { fill: var(--ticket); font-family: var(--display); transition: fill 0.4s ease; }
  .rim { font-size: 14.5px; }
  .value { font-size: 52px; font-weight: 700; }
  .code { font-size: 14px; letter-spacing: 0.18em; }
</style>
