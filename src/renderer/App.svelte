<script>
  import { View } from './stores/view';

  import Configuration from './Configuration.svelte';
  View.set(Configuration);
  // import Dashboard from './Dashboard.svelte';
</script>

<style>
</style>

<svelte:component this={$View} />
