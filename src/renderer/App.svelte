<script>
  import { View } from './stores/view';

  import Configuration from './Configuration.svelte';
  import Dashboard from './Dashboard.svelte';
  import { OctoPrintUpdaterInstance } from './Library/OctoPrintUpdater';
  import { OctoPrintApi } from './Library/OctoPrintApi';
  import { ipc } from './Library/ipc';
  import { checkConnection } from './Library/util';

  (async () => {
    const {
      octoprint: { hostname, apikey },
    } = await ipc('get-configuration');

    OctoPrintUpdaterInstance.start();

    if (await checkConnection(hostname, apikey)) {
      View.set(Configuration);
    } else {
      OctoPrintUpdaterInstance.setApi(new OctoPrintApi(hostname, apikey));
      View.set(Dashboard);
    }
  })();
</script>

<style>

</style>

<svelte:component this={$View} />
