<script>
  import { onMount } from 'svelte';

  import { View } from './stores/view';

  import Window from './Components/Window.svelte';

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
    View.gotoDashboard();
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

      View.gotoDashboard();
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
  .title {
    font-size: 2.4rem;
    color: var(--text-primary-color);
    font-weight: bold;
  }

  .side-by-side {
    display: flex;
    flex-direction: row;
    justify-content: left;
    align-items: center;
    height: 100%;
  }

  .left {
    flex-grow: 1;
    padding: 2rem 2rem;
    height: 100%;
  }

  .right {
    height: 100%;
    flex-grow: shrink;
    display: flex;
    flex-direction: column;
  }

  .right button {
    height: 100%;
    margin: 0;
    border-radius: 0;
  }

  .right button:first-child {
    margin-bottom: 2px;
  }

  label {
    font-size: 1.7rem;
    color: var(--text-secondary-color);
    font-weight: bold;
    margin-top: 0.8rem;
  }

  input[type='text'] {
    margin-bottom: 1rem;
  }

  fieldset {
    padding: 0;
  }

  /* .test-connection-container {
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
  } */
</style>

<Window>
  <div class="side-by-side">
    <div class="left">
      <div class="title">Configuration</div>
      <form>
        <fieldset>
          <label for="hostname">Octoprint Hostname</label>
          <input type="text" id="hostname" bind:value={hostnameValue} disabled={loading} />
          <label for="apikey">ApiKey</label>
          <input type="text" id="apikey" bind:value={apikeyValue} disabled={loading} />
        </fieldset>
      </form>
      <!-- <div class="test-connection-container">
    <button class="button.primary" disabled={loading} on:click={onTestConnection}>Test Connection</button>
    {#if connectionChecked}
      {#if connectionError === undefined}
        <div class="valid">Connection looks fine.</div>
      {:else}
        <div class="invalid">Connection could not be established: {connectionError.message}</div>
      {/if}
    {/if}
  </div> -->
    </div>
    <div class="right">
      <button class="button-primary" disabled={loading} on:click={onSave}>Save</button>
      <button class="button-primary" disabled={loading} on:click={onCancel}>Cancel</button>
    </div>
  </div>
</Window>
