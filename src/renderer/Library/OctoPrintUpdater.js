import isFunction from 'lodash/isFunction';

import {
  CurrentPrinterProfile,
  VersionInformation,
  Settings,
  ConnectionSettings,
  CurrentJob,
} from '../stores/octoprint';

import { Active } from '../stores/view';

class OctoPrintUpdater {
  static DEFAULT_CONFIG = {
    connectionSettingsInterval: Infinity,
    currentPrinterProfileInterval: 60000,
    versionInformationInterval: Infinity,
    settingsInterval: Infinity,
    currentJobInterval: 1000,
  };

  constructor() {
    this.config = OctoPrintUpdater.DEFAULT_CONFIG;
    this.api = undefined;
    this.timers = {};
    this.updateQueue = [];

    this.paused = false;

    Active.subscribe((active) => this.handleActiveChange(active));
  }

  setApi(api) {
    this.api = api;
    this.restart();
  }

  updateConfiguration(config) {
    this.config = { ...OctoPrintUpdater.DEFAULT_CONFIG, ...config };
    this.restart();
  }

  start() {
    this.registerInterval('ConnectionSettings', ConnectionSettings);
    this.registerInterval('currentPrinterProfile', CurrentPrinterProfile);
    this.registerInterval('versionInformation', VersionInformation);
    this.registerInterval('settings', Settings);
    this.registerInterval('currentJob', CurrentJob);
  }

  stop() {
    Object.keys(this.timers).forEach((timer) => {
      const value = this.timers[timer];
      clearTimeout(value);
      delete this.timers[timer];
    });
  }

  restart() {
    this.stop();
    this.start();
  }

  registerInterval(name, store) {
    const configIntervalId = `${name}Interval`;
    const timerId = `${name}Timer`;
    const handlerFn = `on${name.substr(0, 1).toUpperCase()}${name.substr(1)}`;

    const timeoutFn = async () => {
      if (!isFunction(this[handlerFn]) || this.api === undefined) {
        return;
      }

      const data = await this[handlerFn]();
      store.set({ ready: true, data });

      if (Number.isFinite(this.config[configIntervalId]) && this.paused !== true) {
        this.timers[timerId] = setTimeout(timeoutFn, this.config[configIntervalId]);
      }
    };

    setTimeout(timeoutFn, 0);
  }

  handleActiveChange(active) {
    if (this.paused === false && active === false) {
      // Pause all execution
      this.paused = true;
      this.stop();
      console.log('All updates paused');
    } else if (this.paused === true && active === true) {
      // resume execution
      this.paused = false;
      this.start();
      console.log('Resuming all updates');
    }

    // Every other case can be ignored
  }

  async onConnectionSettings() {
    return await this.api.getConnectionSettings();
  }

  async onCurrentPrinterProfile() {
    const connection = await this.api.getConnectionSettings();
    return await this.api.getPrinterProfile(connection.current.printerProfile);
  }

  async onVersionInformation() {
    return await this.api.getVersionInformation();
  }

  async onSettings() {
    return await this.api.getSettings();
  }

  async onCurrentJob() {
    return await this.api.getCurrentJob();
  }
}

export const OctoPrintUpdaterInstance = new OctoPrintUpdater();
