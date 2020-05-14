<script>
  import { TrayModeEnabled } from '../stores/view';

  import { fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  let drag;
  $: drag = !$TrayModeEnabled;
</script>

<style>
  .window {
    position: absolute;
    top: 10px;
    left: 10px;
    width: 700px;
    height: 260px;
    background-color: var(--window-background-color);
    color: var(--text-primary-color);
    border-radius: 17px;
    /* box-shadow: 12px 10px 17px 6px rgba(0, 0, 0, 0.3); */
    overflow: hidden;
    padding: 0;
    margin: 0;
  }

  .drag {
    -webkit-app-region: drag;
  }
</style>

<div class="window" class:drag transition:fade={{ duration: 400, easing: quintOut }}>
  <slot />
</div>
