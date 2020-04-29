<script>
  import Window from './Components/Window.svelte';
  import Header from './Components/Header.svelte';
  import Body from './Components/Body.svelte';
  import Footer from './Components/Footer.svelte';
  import CircleSpinner from './Components/CirlceSpinner.svelte';
  import Camera from './Components/Icons/Camera.svelte';

  import { onMount } from 'svelte';

  import { CurrentPrinterProfile, VersionInformation, WebCamUrl } from './stores/octoprint';
</script>

<style>
  .camera {
    width: 32rem;
    height: 24rem;
    border-radius: 1.4rem;
    background: var(--dashboard-camera-background);
    overflow: hidden;
    position: relative;
  }

  .camera img {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .camera :global(.icon) {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .side-by-side {
    display: flex;
    flex-direction: row;
    justify-content: left;
    align-items: center;
    padding: 1.4rem 0 1.4rem 0;
    height: 100%;
  }

  .side-by-side .left {
    flex-shrink: 1;
    border-right: 1px solid var(--header-border-color);
    padding: 0 1.4rem 0 1.4rem;
  }

  .side-by-side .right {
    border-left: 1px solid var(--header-background-color);
    padding: 0 1.4rem 0 1.4rem;
  }
</style>

<Window>
  {#if $CurrentPrinterProfile.ready}
    <Header title={$CurrentPrinterProfile.data.name} subtitle={$CurrentPrinterProfile.data.model}>
      {#if $VersionInformation.ready}{$VersionInformation.data.text}{/if}
    </Header>
    <Body>
      <div class="side-by-side">
        <div class="left">
          <div class="camera">
            <Camera />
            {#if $WebCamUrl.ready && $WebCamUrl.data !== ''}
              <img src={$WebCamUrl.data} alt="Webcam" />
            {/if}
          </div>
        </div>
        <div class="right">
          <h1>Foo</h1>
        </div>
      </div>
    </Body>
    <Footer clean>
      <h2>Temperature graph</h2>
    </Footer>
  {:else}
    <h1>Loading</h1>
  {/if}
</Window>
