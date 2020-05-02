<script>
  import { fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
</script>

<style>
  .window {
    position: absolute;
    top: 10px;
    left: 10px;
    width: 700px;
    height: 250px;
    background-color: var(--window-background-color);
    color: var(--text-primary-color);
    border-radius: 17px;
    /* box-shadow: 12px 10px 17px 6px rgba(0, 0, 0, 0.3); */
    overflow: hidden;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
  }
</style>

<div class="window" transition:fade={{ duration: 400, easing: quintOut }}>
  <slot />
</div>
