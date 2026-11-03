<script>
  import '../app.css';
  import SiteNav from '$lib/SiteNav.svelte';

  let { children } = $props();
</script>

<SiteNav />

{@render children()}
