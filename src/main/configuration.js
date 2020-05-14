import Store from 'electron-store';
import { isTrayModeAvailable } from './trayAvailable';

export const defaultConfiguration = {
  octoprint: {
    hostname: '',
    apikey: '',
  },
  traymode: isTrayModeAvailable() ? true : false,
};

export let configuration;
export function initConfiguration() {
  configuration = new Store();
  if (configuration.size === 0) {
    // Initialize
    configuration.set(defaultConfiguration);
  }
}
