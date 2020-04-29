<script>
  import { onMount } from 'svelte';

  import Dashboard from './Dashboard.svelte';
  import Window from './Components/Window.svelte';
  import Header from './Components/Header.svelte';
  import Body from './Components/Body.svelte';
  import Footer from './Components/Footer.svelte';
  import CircleSpinner from './Components/CirlceSpinner.svelte';

  import { ipc } from './Library/ipc';

  import { checkConnection } from './Library/util';
  import { Method } from './Library/IpcConnector';
  import { OctoPrintUpdaterInstance } from './Library/OctoPrintUpdater';
  import { OctoPrintApi } from './Library/OctoPrintApi';

  let hostnameValue;
  let apikeyValue;
  let loading = true;

  let connectionChecked = false;
  let connectionError = undefined;

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
      connectionChecked = false;
      connectionError = undefined;
    });
  }

  async function onSave(event) {
    withLoading(async () => {
      connectionError = await checkConnection(hostnameValue, apikeyValue);
      connectionChecked = true;

      if (connectionError !== undefined) {
        return;
      }

      await ipc('set-configuration', { octoprint: { hostname: hostnameValue, apikey: apikeyValue } });
      OctoPrintUpdaterInstance.setApi(new OctoPrintApi(hostnameValue, apikeyValue));
    });
  }

  async function onTestConnection(event) {
    withLoading(async () => {
      connectionError = await checkConnection(hostnameValue, apikeyValue);
      connectionChecked = true;
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

  .test-connection-container {
    margin-top: 2rem;
    width: 100%;
    display: flex;
    align-items: center;
    flex-direction: column;
  }

  .test-connection-container .valid {
    color: green;
    margin: 1rem;
  }

  .test-connection-container .invalid {
    color: red;
    margin: 1rem;
  }
</style>

<Window>
  <Header title="Configuration" back={Dashboard} disabled={loading}>
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
    <div class="test-connection-container">
      <button class="button.primary" disabled={loading} on:click={onTestConnection}>Test Connection</button>
      {#if connectionChecked}
        {#if connectionError === undefined}
          <div class="valid">Connection looks fine.</div>
        {:else}
          <div class="invalid">Connection could not be established: {connectionError.message}</div>
        {/if}
      {/if}
    </div>
  </Body>
  <Footer clean>
    <div class="float-right button-area">
      <button class="button-primary" disabled={loading} on:click={onSave}>Save</button>
      <button class="button-primary" disabled={loading} on:click={onCancel}>Cancel</button>
    </div>
  </Footer>
</Window>
