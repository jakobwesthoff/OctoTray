<script>
  import camera from '@fortawesome/fontawesome-free/svgs/solid/camera.svg';
</script>

<style>
  .icon {
    display: inline-block;
    width: 8rem;
    height: 8rem;
  }

  .icon :global(svg) {
    fill: var(--dashboard-camera-icon);
    width: 8rem;
    height: 8rem;
  }
</style>

<span class="icon">
  {@html camera}
</span>
