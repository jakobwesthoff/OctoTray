import { writable } from 'svelte/store';

export const DASHBOARD = 'DASHBOARD';
export const CONFIGURATION = 'CONFIGURATION';

export const View = (() => {
  const { subscribe, set } = writable(undefined);

  return {
    subscribe,
    gotoDashboard() {
      set(DASHBOARD);
    },
    gotoConfiguration() {
      set(CONFIGURATION);
    },
  };
})();

export const Active = writable(false);
