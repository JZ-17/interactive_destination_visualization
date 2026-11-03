<script>
  /**
   * The menu bar on every page. The main page is the one thing here that looks
   * like a destination; the rest are earlier drafts, kept for reference and
   * set back so nobody mistakes them for the site.
   */
  import { page } from '$app/state';
  import { base } from '$app/paths';

  const DRAFTS = [
    { href: 'board/', label: 'Boarding intro' },
    { href: 'prototype-a/', label: 'Prototype A: Rank the 50' },
    { href: 'prototype-b/', label: 'Prototype B: Globe' },
    { href: 'story/', label: 'Site outline' }
  ];

  let here = $derived(page.url.pathname.replace(/\/$/, ''));
  const isHere = (href, current) => current.endsWith(`/${href.replace(/\/$/, '')}`);
  let onDraft = $derived(DRAFTS.some((d) => isHere(d.href, here)));
</script>

<nav class="site" aria-label="Site">
  <a class="main" class:current={!onDraft} href="{base}/" aria-current={onDraft ? undefined : 'page'}>
    How cities sell themselves
  </a>
  <span class="label" id="drafts-label">Earlier drafts</span>
  <ul aria-labelledby="drafts-label">
    {#each DRAFTS as d (d.href)}
      <li>
        <a href="{base}/{d.href}" class:current={isHere(d.href, here)} aria-current={isHere(d.href, here) ? 'page' : undefined}>
          {d.label}
        </a>
      </li>
    {/each}
  </ul>
</nav>

<style>
  /* One line at every width, scrolling sideways on a phone: the full-screen
     drafts subtract --nav-h from their own height, so it cannot wrap. */
  .site {
    display: flex;
    align-items: center;
    gap: 16px;
    height: var(--nav-h);
    padding: 0 16px;
    overflow-x: auto;
    scrollbar-width: none;
    white-space: nowrap;
    background: #fff;
    border-bottom: 1px solid rgba(25, 30, 59, 0.12);
    font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
    font-size: 0.78rem;
    color: #191e3b;
  }
  a { text-decoration: none; color: inherit; }
  a:focus-visible { outline: 2px solid #191e3b; outline-offset: 2px; border-radius: 4px; }

  .main {
    flex: none;
    padding: 5px 12px;
    border-radius: 999px;
    border: 1px solid #191e3b;
    font-weight: 650;
  }
  .main:hover { background: rgba(25, 30, 59, 0.06); color: inherit; }
  .main.current { background: #191e3b; color: #fff; }

  .label { flex: none; margin-left: auto; color: #5d6378; }
  ul { display: flex; gap: 14px; margin: 0; padding: 0; list-style: none; }
  ul a { color: #4a5068; }
  ul a:hover { color: #191e3b; text-decoration: underline; text-underline-offset: 3px; }
  ul a.current { color: #191e3b; font-weight: 650; text-decoration: underline; text-underline-offset: 3px; }

  @media (max-width: 900px) {
    .label { margin-left: 0; }
  }
</style>
