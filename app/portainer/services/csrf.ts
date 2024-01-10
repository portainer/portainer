import { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { CacheAxiosResponse } from 'axios-cache-interceptor';
import { IHttpResponse } from 'angular';

import axios from './axios';

axios.interceptors.response.use(csrfTokenReaderInterceptor);
axios.interceptors.request.use(csrfInterceptor);

let csrfToken: string | null = null;

export function csrfTokenReaderInterceptor(
  config: CacheAxiosResponse | AxiosResponse
) {
  const csrfTokenHeader = config.headers['x-csrf-token'];
  if (csrfTokenHeader) {
    csrfToken = csrfTokenHeader;
  }
  return config;
}

export function csrfTokenReaderInterceptorAngular(
  config: IHttpResponse<unknown>
) {
  const csrfTokenHeader = config.headers('x-csrf-token');
  if (csrfTokenHeader) {
    csrfToken = csrfTokenHeader;
  }
  return config;
}

export function csrfInterceptor(config: InternalAxiosRequestConfig) {
  if (!csrfToken) {
    return config;
  }

  const newConfig = { ...config };
  newConfig.headers['X-CSRF-Token'] = csrfToken;
  return newConfig;
}
