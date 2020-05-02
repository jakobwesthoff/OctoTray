<script>
  import { onMount } from 'svelte';
  import { View, DASHBOARD, CONFIGURATION, DarkMode } from './stores/view';

  import Configuration from './Configuration.svelte';
  import Dashboard from './Dashboard.svelte';
  import { OctoPrintUpdaterInstance } from './Library/OctoPrintUpdater';
  import { OctoPrintApi } from './Library/OctoPrintApi';
  import { ipc } from './Library/ipc';
  import { checkConnection } from './Library/util';

  let activeViewComponent;
  $: {
    switch ($View) {
      case DASHBOARD:
        activeViewComponent = Dashboard;
        break;
      case CONFIGURATION:
        activeViewComponent = Configuration;
        break;
      default:
        activeViewComponent = undefined;
    }
  }

  onMount(() => {
    const unsubscribe = DarkMode.subscribe((darkMode) => {
      const body = document.getElementsByTagName('body')[0];
      if (darkMode) {
        body.classList.add('dark-mode');
      } else {
        body.classList.remove('dark-mode');
      }
    });

    return unsubscribe;
  });

  (async () => {
    const {
      octoprint: { hostname, apikey },
    } = await ipc('get-configuration');

    OctoPrintUpdaterInstance.start();

    if (await checkConnection(hostname, apikey)) {
      View.gotoConfiguration;
    } else {
      OctoPrintUpdaterInstance.setApi(new OctoPrintApi(hostname, apikey));
      View.gotoDashboard();
    }
  })();
</script>

<style>

</style>

<svelte:component this={activeViewComponent} />
