import _ from 'lodash-es';

/* @ngInject */
export function LicenseService(License) {
  const licenseStore = {
    data: {},
    lastLoaded: null,
    invalidated: true,
    listeners: [],
  };

  return { licenses, attach, remove, info, subscribe, unsubscribe };

  function licenses() {
    return License.query().$promise;
  }

  async function attach(licenseKeys) {
    const response = await License.attach({ licenseKeys }).$promise;
    if (Object.keys(response.failedKeys).length === licenseKeys.length) {
      return response;
    }

    licenseStore.invalidated = true;
    info();
    return response;
  }

  async function remove(licenseKeys) {
    const response = await License.remove({ licenseKeys }).$promise;
    if (Object.keys(response.failedKeys).length === licenseKeys.length) {
      return response;
    }

    licenseStore.invalidated = true;
    info();
    return response;
  }

  async function info() {
    if (!licenseStore.invalidated && Math.abs(licenseStore.lastLoaded - Date.now()) < 1000 * 60 * 10) {
      return licenseStore.data;
    }
    const info = await License.info().$promise;
    licenseStore.data = info;
    licenseStore.lastLoaded = Date.now();
    licenseStore.invalidated = false;
    licenseStore.listeners.forEach((listener) => listener(licenseStore.data));
    return licenseStore.data;
  }

  function subscribe(listener) {
    licenseStore.listeners.push(listener);
  }

  function unsubscribe(listener) {
    _.remove(licenseStore.listeners, listener);
  }
}
