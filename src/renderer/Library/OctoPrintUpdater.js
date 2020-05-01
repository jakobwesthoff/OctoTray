import isFunction from 'lodash/isFunction';

import { CurrentPrinterProfile, VersionInformation, Settings, ConnectionSettings, CurrentJob } from '../stores/octoprint';

class OctoPrintUpdater {
  static DEFAULT_CONFIG = {
    connectionSettingsInterval: 10000,
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

      if (Number.isFinite(this.config[configIntervalId])) {
        this.timers[timerId] = setTimeout(timeoutFn, this.config[configIntervalId]);
      }
    };

    setTimeout(timeoutFn, 0);
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
