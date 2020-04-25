<script>
  import { onMount } from 'svelte';

  import Window from './Components/Window.svelte';
  import Header from './Components/Header.svelte';
  import Body from './Components/Body.svelte';
  import Footer from './Components/Footer.svelte';
  import CircleSpinner from './Components/CirlceSpinner.svelte';

  import { ipc } from './ipc';

  let hostnameValue;
  let apikeyValue;
  let loading = true;

  async function withLoading(action) {
    loading = true;
    await action();
    loading = false;
  }

  async function onCancel(event) {
    withLoading(async () => {
      const {
        octoprint: { hostname, apikey },
      } = await ipc('get-configuration');

      hostnameValue = hostname;
      apikeyValue = apikey;
    });
  }

  async function onSave(event) {
    withLoading(async () => {
      await ipc('set-configuration', { octoprint: { hostname: hostnameValue, apikey: apikeyValue } });
    });
  }

  onMount(async () => {
    withLoading(async () => {
      const {
        octoprint: { hostname, apikey },
      } = await ipc('get-configuration');

      hostnameValue = hostname;
      apikeyValue = apikey;
    });
  });
</script>

<style>
  .button-area {
    margin-top: 1rem;
    margin-right: 2rem;
  }

  label {
    margin-top: 1.4rem;
  }

  fieldset {
    padding: 0;
  }
</style>

<Window>
  <Header title="Configuration">
    {#if loading}
      <CircleSpinner size="4rem" />
    {/if}
  </Header>
  <Body>
    <form>
      <fieldset>
        <label for="hostname">Octoprint Hostname</label>
        <input type="text" id="hostname" bind:value={hostnameValue} disabled={loading} />
        <label for="apikey">ApiKey</label>
        <input type="text" id="apikey" bind:value={apikeyValue} disabled={loading} />
      </fieldset>
    </form>
  </Body>
  <Footer clean>
    <div class="float-right button-area">
      <button class="button-primary" disabled={loading} on:click={onSave}>Save</button>
      <button class="button-primary" disabled={loading} on:click={onCancel}>Cancel</button>
    </div>
  </Footer>
</Window>
