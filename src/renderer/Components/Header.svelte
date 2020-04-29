<script>
  import { View } from '../stores/view';
  import Back from './Icons/Back.svelte';

  export let title;
  export let subtitle;
  export let back = undefined;
  export let disabled = false;

  function onBack() {
    if (disabled) {
      return;
    }

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

  .subtitle {
    font-size: 1.8rem;
    color: var(--header-subtitle-color);
    position: absolute;
    top: 50%;
    margin-left: .8rem;
    transform: translate(0, -50%);
  }

  .subtitle:before {
    content: '(';
  }
  .subtitle:after {
    content: ')';
  }
</style>

<div class="header">
  {#if back !== undefined}
    <span class="back-area">
      <Back {disabled} on:click={onBack} />
    </span>
  {/if}
  <section class:back>
    <span class="title">{title}</span>
    {#if subtitle}
      <span class="subtitle">{subtitle}</span>
    {/if}
    <div class="float-right">
      <slot />
    </div>
  </section>
</div>
