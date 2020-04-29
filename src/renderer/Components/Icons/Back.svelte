<script>
  import angleLeft from '@fortawesome/fontawesome-free/svgs/solid/angle-left.svg';
  export let disabled = false;
</script>

<style>
  .icon {
    display: inline-block;
    width: 3.6rem;
    height: 3.6rem;
  }

  .icon :global(svg) {
    fill: var(--accent-color);
    width: 3.6rem;
    height: 3.6rem;
    transition: fill 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .icon.disabled :global(svg),
  .icon.disabled :global(svg):hover {
    fill: var(--accent-color-disabled);
  }

  .icon :global(svg):hover {
    fill: var(--accent-color-dark);
  }
</style>

<span class="icon" class:disabled on:click>
  {@html angleLeft}
</span>
