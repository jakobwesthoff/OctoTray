<script>
  import { onMount } from 'svelte';

  import ExclamationSvg from '@fortawesome/fontawesome-free/svgs/solid/exclamation-circle.svg';
  import CheckSvg from '@fortawesome/fontawesome-free/svgs/solid/check-circle.svg';

  import { View, TrayModeAvailable } from './stores/view';

  import Window from './Components/Window.svelte';

  import { ipc } from './Library/ipc';

  import { checkConnection } from './Library/util';
  import { Method } from './Library/IpcConnector';
  import { OctoPrintUpdaterInstance } from './Library/OctoPrintUpdater';
  import { OctoPrintApi } from './Library/OctoPrintApi';

  let hostnameValue;
  let apikeyValue;
  let trayModeValue;
  let activeTrayMode;
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

      await ipc('set-configuration', {
        octoprint: { hostname: hostnameValue, apikey: apikeyValue },
        traymode: trayModeValue,
      });
      OctoPrintUpdaterInstance.setApi(new OctoPrintApi(hostnameValue, apikeyValue));

      if (activeTrayMode !== trayModeValue) {
        // Traymode config change requires an app restart.
        await ipc('show-dialog-and-restart');
      } else {
        View.gotoDashboard();
      }
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
        traymode,
      } = await ipc('get-configuration');

      hostnameValue = hostname;
      apikeyValue = apikey;
      trayModeValue = traymode;
      activeTrayMode = traymode;
    });
  });
</script>

<style>
  .title-container {
    display: flex;
    flex-direction: row;
  }

  .title-container span:not(.title) {
    flex-shrink: 1;
    width: 3rem;
    height: 3rem;
  }

  .title-container span :global(svg) {
    width: 3rem;
    height: 3rem;
    flex-shrink: 1;
  }

  .error :global(svg) {
    fill: red;
  }

  .title {
    font-size: 2.4rem;
    color: var(--text-primary-color);
    font-weight: bold;
    flex-grow: 1;
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
    padding: 1rem 2rem;
    height: 100%;
    display: flex;
    flex-direction: column;
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

  form {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    margin: 0;
  }

  label:not(.normal) {
    font-size: 1.7rem;
    color: var(--text-secondary-color);
    font-weight: bold;
    margin-top: 0.3rem;
  }

  input[type='text'] {
    margin-bottom: 1rem;
    transition: width 0.4s ease-in-out;
  }

  fieldset {
    padding: 0;
    margin: 0 0 .3rem 0;
  }
</style>

<Window>
  <div class="side-by-side">
    <div class="left">
      <div class="title-container">
        <div class="title">Configuration</div>
        {#if connectionChecked}
          {#if connectionError !== undefined}
            <span class="error" title={connectionError.message}>
              {@html ExclamationSvg}
            </span>
          {/if}
        {/if}
      </div>
      <form>
        <fieldset>
          <label for="hostname">Octoprint Hostname</label>
          <input type="text" id="hostname" bind:value={hostnameValue} disabled={loading} />
        </fieldset>
        <fieldset>
          <label for="apikey">ApiKey</label>
          <input type="text" id="apikey" bind:value={apikeyValue} disabled={loading} />
        </fieldset>
        {#if $TrayModeAvailable}
          <fieldset>
            <input type="checkbox" id="traymode" bind:checked={trayModeValue} disabled={loading} />
            <label class="label-inline normal" for="traymode">Use Tray / Menubar Mode</label>
          </fieldset>
        {/if}
      </form>
    </div>
    <div class="right">
      <button class="button-primary" disabled={loading} on:click={onSave}>Save</button>
      <button class="button-primary" disabled={loading} on:click={onCancel}>Cancel</button>
    </div>
  </div>
</Window>
