import _ from 'lodash';
import { AxiosError } from 'axios';

import axios from '@/portainer/services/axios';

import { License, LicenseInfo } from './types';

type Listener = (info: LicenseInfo) => void;

interface Store {
  data?: LicenseInfo;
  lastLoaded?: number;
  invalidated: boolean;
  listeners: Listener[];
}

const store: Store = {
  listeners: [],
  invalidated: true,
};

export async function getLicenses() {
  try {
    const { data } = await axios.get<License[]>(buildUrl());

    return data;
  } catch (e) {
    const axiosError = e as AxiosError;
    throw new Error(axiosError.response?.data.message);
  }
}

interface AttachResponse {
  licenses: License[];
  failedKeys: Record<string, string>;
}

export async function attachLicense(licenseKeys: string[]) {
  try {
    const { data } = await axios.post<AttachResponse>(buildUrl(), {
      licenseKeys,
    });

    if (Object.keys(data.failedKeys).length === licenseKeys.length) {
      return data;
    }

    store.invalidated = true;
    getLicenseInfo();
    return data;
  } catch (e) {
    const axiosError = e as AxiosError;
    throw new Error(axiosError.response?.data.message);
  }
}

interface RemoveResponse {
  failedKeys: Record<string, string>;
}

export async function removeLicense(licenseKeys: string[]) {
  try {
    const { data } = await axios.post<RemoveResponse>(buildUrl('remove'), {
      licenseKeys,
    });
    if (Object.keys(data.failedKeys).length === licenseKeys.length) {
      return data;
    }

    store.invalidated = true;
    getLicenseInfo();
    return data;
  } catch (e) {
    const axiosError = e as AxiosError;
    throw new Error(axiosError.response?.data.message);
  }
}

export async function getLicenseInfo() {
  try {
    if (
      store.data &&
      !store.invalidated &&
      store.lastLoaded &&
      Math.abs(store.lastLoaded - Date.now()) < 1000 * 30
    ) {
      return store.data;
    }

    const { data: info } = await axios.get<LicenseInfo>(buildUrl('info'));
    store.data = info;
    store.lastLoaded = Date.now();
    store.invalidated = false;
    store.listeners.forEach((listener) => listener(info));

    return info;
  } catch (e) {
    const axiosError = e as AxiosError;
    throw new Error(axiosError.response?.data.message);
  }
}

export function subscribe(listener: Listener) {
  store.listeners.push(listener);
}

export function unsubscribe(listener: Listener) {
  _.remove<Listener>(store.listeners, listener);
}

/* @ngInject */
export function LicenseService() {
  return {
    licenses: getLicenses,
    attach: attachLicense,
    remove: removeLicense,
    info: getLicenseInfo,
    subscribe,
    unsubscribe,
  };
}

function buildUrl(action = '') {
  let url = 'licenses';

  if (action) {
    url += `/${action}`;
  }
  return url;
}
