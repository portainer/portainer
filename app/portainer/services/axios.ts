import axiosOrigin, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import { loadProgressBar } from 'axios-progress-bar';
import 'axios-progress-bar/dist/nprogress.css';

import PortainerError from '@/portainer/error';
import { get as localStorageGet } from '@/portainer/hooks/useLocalStorage';

import {
  portainerAgentManagerOperation,
  portainerAgentTargetHeader,
} from './http-request.helper';

const axios = axiosOrigin.create({ baseURL: 'api' });

loadProgressBar(undefined, axios);

export default axios;

axios.interceptors.request.use(async (config) => {
  const newConfig = { headers: config.headers || {}, ...config };

  const jwt = localStorageGet('JWT', '');
  if (jwt) {
    newConfig.headers.Authorization = `Bearer ${jwt}`;
  }

  return newConfig;
});

export function agentInterceptor(config: AxiosRequestConfig) {
  if (!config.url || !config.url.includes('/docker/')) {
    return config;
  }

  const newConfig = { headers: config.headers || {}, ...config };
  const target = portainerAgentTargetHeader();
  if (target) {
    newConfig.headers['X-PortainerAgent-Target'] = target;
  }

  if (portainerAgentManagerOperation()) {
    newConfig.headers['X-PortainerAgent-ManagerOperation'] = '1';
  }

  return newConfig;
}

axios.interceptors.request.use(agentInterceptor);

export function redirectInterceptor(error: AxiosError) {
  const newError = {
    headers: error.response?.headers || {},
    status: error.response?.status || {},
    ...error,
  };
  if (newError.status === 307 || newError.status === 308) {
    const redirectReason = newError.headers['redirect-reason'];
    if (redirectReason === 'AdminInitTimeout') {
      window.location.href = '/#!/admin-timeout';
    }
  }
  return Promise.reject(error);
}

axios.interceptors.response.use(
  (response: AxiosResponse) => response,
  redirectInterceptor
);

export function parseAxiosError(
  err: Error,
  msg = '',
  parseError = defaultErrorParser
) {
  let resultErr = err;
  let resultMsg = msg;

  if ('isAxiosError' in err) {
    const { error, details } = parseError(err as AxiosError);
    resultErr = error;
    resultMsg = msg ? `${msg}: ${details}` : details;
  }

  return new PortainerError(resultMsg, resultErr);
}

function defaultErrorParser(axiosError: AxiosError) {
  const message = axiosError.response?.data.message;
  const details = axiosError.response?.data.details || message;
  const error = new Error(message);
  return { error, details };
}
