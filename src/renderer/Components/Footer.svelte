<script>
  export let clean = false;
  $: styled = !clean;
</script>

<style>
  .footer {
    height: 6.2rem;
  }

  .styled {
    background: var(--footer-background-color);
    border-top: 0.1rem solid var(--footer-border-color);
    padding: 1.8rem 2rem 1rem 2rem;
  }
</style>

<div class:styled class="footer">
  <slot />
</div>
