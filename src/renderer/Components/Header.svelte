<script>
  import { View } from '../stores/view';
  import Back from './Icons/Back.svelte';

  export let title;
  export let back = undefined;

  function onBack() {
    View.set(back);
  }
</script>

<style>
  .header {
    background: var(--header-background-color);
    border-bottom: 0.1rem solid var(--header-border-color);
    height: 6.2rem;
    padding: 0 2rem;
    position: relative;
  }

  section {
    --spacing-left: 2rem;
    --spacing-right: 2rem;
    position: absolute;
    left: var(--spacing-left);
    top: 50%;
    transform: translate(0, -50%);
    font-size: 3rem;
    display: block;
    width: calc(100% - var(--spacing-left) - var(--spacing-right));
  }

  section.back {
    --spacing-left: 3.7rem;
  }

  .back-area {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translate(0, -50%);
    height: 3.6rem;
  }
</style>

<div class="header">
  {#if back !== undefined}
    <span class="back-area">
      <Back on:click={onBack} />
    </span>
  {/if}
  <section class:back>
    <span class="title">{title}</span>
    <div class="float-right">
      <slot />
    </div>
  </section>
</div>
