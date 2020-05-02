import { writable } from 'svelte/store';
import { tick } from 'svelte';

export const DASHBOARD = 'DASHBOARD';
export const CONFIGURATION = 'CONFIGURATION';

export const View = (() => {
  const { subscribe, set } = writable(undefined);

  return {
    subscribe,
    async gotoDashboard() {
      // Hack to ensure camera stream is stopped and not left dangling, when
      // changing to configuration.
      CameraEnabled.set(false);
      await tick();
      set(DASHBOARD);
    },
    async gotoConfiguration() {
      // Hack to ensure camera stream is stopped and not left dangling, when
      // changing to configuration.
      CameraEnabled.set(false);
      await tick();
      set(CONFIGURATION);
    },
  };
})();

export const Active = writable(false);

export const CameraEnabled = writable(false);
