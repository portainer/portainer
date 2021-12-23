import axios, {AxiosError, AxiosRequestConfig} from 'axios';

import { get as localStorageGet } from '../hooks/useLocalStorage';

import {
  portainerAgentManagerOperation,
  portainerAgentTargetHeader,
} from './http-request.helper';
import PortainerError from "Portainer/error";

const axiosApiInstance = axios.create({ baseURL: '/api' });

export default axiosApiInstance;

axiosApiInstance.interceptors.request.use(async (config) => {
  const newConfig = { ...config };

  const jwt = localStorageGet('JWT', '');
  if (jwt) {
    newConfig.headers = {
      Authorization: `Bearer ${jwt}`,
    };
  }

  return newConfig;
});

export function agentInterceptor(config: AxiosRequestConfig) {
  if (!config.url || !config.url.includes('/docker/')) {
    return config;
  }

  const newConfig = { headers: config.headers || {}, ...config };

  newConfig.headers['X-PortainerAgent-Target'] = portainerAgentTargetHeader();
  if (portainerAgentManagerOperation()) {
    newConfig.headers['X-PortainerAgent-ManagerOperation'] = '1';
  }

  return newConfig;
}

axiosApiInstance.interceptors.request.use(agentInterceptor);

export function parseAxiosError(err : Error, msg : string) {
  let resultErr = err
  let resultMsg = msg;

  if ("isAxiosError" in err) {
    const axiosError = err as AxiosError;
    resultErr = new Error(`${axiosError.response?.data.message}`);
    resultMsg = `${msg}: ${axiosError.response?.data.details}`;
  }

  return new PortainerError(resultMsg, resultErr);
}
