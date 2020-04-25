<script>
  export let title;
</script>

<div class="header">
  <section>{title}</section>
  <div class='float-right'>
    <slot />
  </div>
</div>

<style>
  .header {
    background: var(--header-background-color);
    border-bottom: .1rem solid var(--header-border-color);
    height: 6.2rem;
    padding: 1rem 2rem 1rem 2rem;
  }

  .header section {
    font-size: 3rem;
    display: inline;
  }
</style>