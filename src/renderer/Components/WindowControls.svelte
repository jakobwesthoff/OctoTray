<script>
  import { createEventDispatcher } from 'svelte';

  import { TrayModeEnabled } from '../stores/view';

  import CogSvg from '@fortawesome/fontawesome-free/svgs/solid/cog.svg';
  import CompressSvg from '@fortawesome/fontawesome-free/svgs/solid/compress-alt.svg';
  import TimesSvg from '@fortawesome/fontawesome-free/svgs/solid/times.svg';
  import PlusSvg from '@fortawesome/fontawesome-free/svgs/regular/plus-square.svg';
  import MinusSvg from '@fortawesome/fontawesome-free/svgs/regular/minus-square.svg';

  let open = false;
  const dispatch = createEventDispatcher();
</script>

<style>
  .controls {
    display: flex;
    flex-direction: row;
    direction: rtl;
    -webkit-app-region: no-drag;
  }

  .controls > * {
    direction: ltr;
  }

  .controls:not(.open) {
    width: calc(3rem + 0.6rem);
    overflow: hidden;
  }

  .controls div {
    flex-shrink: 1;
    margin-left: 0.6rem;
  }

  .controls :global(svg) {
    fill: var(--accent-background-color);
    width: 3rem;
    height: 3rem;
    transition: fill 0.2s ease-in-out;
  }

  .controls :global(svg):hover {
    fill: var(--accent-background-secondary);
  }
</style>

<div class="controls" class:open>
  {#if $TrayModeEnabled}
    <div on:click={(event) => dispatch('configuration', event)}>
      {@html CogSvg}
    </div>
  {:else}
    {#if open}
      <div on:click={(event) => (open = false)} title="Hide Controls">
        {@html MinusSvg}
      </div>
    {:else}
      <div on:click={(event) => (open = true)} title="Show Controls">
        {@html PlusSvg}
      </div>
    {/if}
    <div on:click={(event) => dispatch('configuration', event)} title="Configuration">
      {@html CogSvg}
    </div>
    <div on:click={(event) => dispatch('minimize', event)} title="Minimize">
      {@html CompressSvg}
    </div>
    <div on:click={(event) => dispatch('quit', event)} title="Quit">
      {@html TimesSvg}
    </div>
  {/if}
</div>
