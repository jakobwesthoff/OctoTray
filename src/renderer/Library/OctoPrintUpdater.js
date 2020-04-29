import isFunction from 'lodash/isFunction';

import { CurrentPrinterProfile, VersionInformation, Settings } from '../stores/octoprint';

class OctoPrintUpdater {
  static DEFAULT_CONFIG = {
    currentPrinterProfileInterval: 60000,
    versionInformationInterval: Infinity,
    settingsInterval: Infinity,
  };

  constructor() {
    this.config = OctoPrintUpdater.DEFAULT_CONFIG;
    this.api = undefined;
    this.timers = {};
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
    this.registerInterval('currentPrinterProfile', CurrentPrinterProfile);
    this.registerInterval('versionInformation', VersionInformation);
    this.registerInterval('settings', Settings);
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

  async onCurrentPrinterProfile() {
    const connection = await this.api.getConnectionSettings();
    const profile = await this.api.getPrinterProfile(connection.current.printerProfile);

    return profile;
  }

  async onVersionInformation() {
    return await this.api.getVersionInformation();
  }

  async onSettings() {
    return await this.api.getSettings();
  }
}

export const OctoPrintUpdaterInstance = new OctoPrintUpdater();
