<script>
  import angleLeft from '@fortawesome/fontawesome-free/svgs/solid/angle-left.svg';
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
    transition: fill .3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .icon :global(svg):hover {
    fill: var(--accent-color-dark);
  }
</style>

<span class="icon" on:click>
  {@html angleLeft}
</span>
