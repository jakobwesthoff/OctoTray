import { writable, derived } from 'svelte/store';
import { ipc } from '../Library/ipc';

export const CurrentPrinterProfile = writable({
  ready: false,
  data: undefined,
});

export const ConnectionSettings = writable({
  ready: false,
  data: undefined,
});

export const VersionInformation = writable({
  ready: false,
  data: undefined,
});

export const Settings = writable({
  ready: false,
  data: undefined,
});

export const WebCamUrl = derived(
  [Settings],
  async ([$Settings], set) => {
    if (!$Settings.ready) {
      set({ ready: false, data: undefined });
      return;
    }

    const {
      octoprint: { hostname },
    } = await ipc('get-configuration');
    set({ ready: true, data: `${hostname}${$Settings.data.webcam.streamUrl}` });
  },
  { ready: false, data: undefined }
);

export const CurrentJob = writable({
  ready: false,
  data: undefined,
});
