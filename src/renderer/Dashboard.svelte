<script>
  import Window from './Components/Window.svelte';
  import Header from './Components/Header.svelte';
  import Body from './Components/Body.svelte';
  import Footer from './Components/Footer.svelte';
  import CircleSpinner from './Components/CirlceSpinner.svelte';

  import { onMount } from 'svelte';

  import { CurrentPrinterProfile, VersionInformation, WebCamUrl } from './stores/octoprint';
</script>

<style>
.camera {
  max-width: 32rem;
  max-height: 24rem;
}
</style>

<Window>
  {#if $CurrentPrinterProfile.ready}
    <Header title={$CurrentPrinterProfile.data.name} subtitle={$CurrentPrinterProfile.data.model}>
      {#if $VersionInformation.ready}{$VersionInformation.data.text}{/if}
    </Header>
    <Body>
      {#if $WebCamUrl.ready}
      <div class="camera">
        <img src="{$WebCamUrl.data}" alt="Webcam" />
      </div>
      {/if}
    </Body>
    <Footer clean>
      <h2>Temperature graph</h2>
    </Footer>
  {:else}
    <h1>Loading</h1>
  {/if}
</Window>
