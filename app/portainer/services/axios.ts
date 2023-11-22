import axiosOrigin, { AxiosError, AxiosRequestConfig } from 'axios';
import { setupCache } from 'axios-cache-adapter';
import { loadProgressBar } from 'axios-progress-bar';

import 'axios-progress-bar/dist/nprogress.css';
import PortainerError from '@/portainer/error';

import {
  CACHE_DURATION,
  dispatchCacheRefreshEventIfNeeded,
  portainerAgentManagerOperation,
  portainerAgentTargetHeader,
} from './http-request.helper';

export const cache = setupCache({
  maxAge: CACHE_DURATION,
  debug: false, // set to true to print cache hits/misses
  exclude: {
    query: false, // include urls with query params
    methods: ['put', 'patch', 'delete'],
    filter: (req: AxiosRequestConfig) => {
      // exclude caching get requests unless the path contains 'kubernetes'
      if (!req.url?.includes('kubernetes') && req.method === 'get') {
        return true;
      }

      // exclude caching post requests unless the path contains 'selfsubjectaccessreview'
      if (
        !req.url?.includes('selfsubjectaccessreview') &&
        req.method === 'post'
      ) {
        return true;
      }
      return false;
    },
  },
  // ask to clear cache on mutation
  invalidate: async (_, req) => {
    dispatchCacheRefreshEventIfNeeded(req);
  },
});

// by default don't use the cache adapter
const axios = axiosOrigin.create({ baseURL: 'api' });

// when entering a kubernetes environment, or updating user settings, update the cache adapter
export function updateAxiosAdapter(useCache: boolean) {
  axios.defaults.adapter = useCache ? cache.adapter : undefined;
}

loadProgressBar(undefined, axios);

export default axios;

export const agentTargetHeader = 'X-PortainerAgent-Target';

export function agentInterceptor(config: AxiosRequestConfig) {
  if (!config.url || !config.url.includes('/docker/')) {
    return config;
  }

  const newConfig = { headers: config.headers || {}, ...config };
  const target = portainerAgentTargetHeader();
  if (target) {
    newConfig.headers[agentTargetHeader] = target;
  }

  if (portainerAgentManagerOperation()) {
    newConfig.headers['X-PortainerAgent-ManagerOperation'] = '1';
  }

  return newConfig;
}

axios.interceptors.request.use(agentInterceptor);

axios.interceptors.response.use(undefined, (error) => {
  if (
    error.response?.status === 401 &&
    !error.config.url.includes('/v2/') &&
    !error.config.url.includes('/api/v4/') &&
    isTransitionRequiresAuthentication()
  ) {
    // eslint-disable-next-line no-console
    console.error('Unauthorized request, logging out');
    window.location.hash = '/logout';
    window.location.reload();
  }

  return Promise.reject(error);
});

const UNAUTHENTICATED_ROUTES = [
  '/logout',
  '/internal-auth',
  '/auth',
  '/init/admin',
];
function isTransitionRequiresAuthentication() {
  return !UNAUTHENTICATED_ROUTES.some((route) =>
    window.location.hash.includes(route)
  );
}

/**
 * Parses an Axios error and returns a PortainerError.
 * @param err The original error.
 * @param msg An optional error message to prepend.
 * @param parseError A function to parse AxiosErrors. Defaults to defaultErrorParser.
 * @returns A PortainerError with the parsed error message and details.
 */
export function parseAxiosError(
  err: unknown,
  msg = '',
  parseError = defaultErrorParser
) {
  let resultErr = err;
  let resultMsg = msg;

  if (isAxiosError(err)) {
    const { error, details } = parseError(err);
    resultErr = error;
    if (msg && details) {
      resultMsg = `${msg}: ${details}`;
    } else {
      resultMsg = msg || details;
    }
  }

  return new PortainerError(resultMsg, resultErr);
}

export function defaultErrorParser(axiosError: AxiosError) {
  const message = axiosError.response?.data.message || '';
  const details = axiosError.response?.data.details || message;
  const error = new Error(message);
  return { error, details };
}

export function isAxiosError<
  ResponseType = { message: string; details: string },
>(error: unknown): error is AxiosError<ResponseType> {
  return axiosOrigin.isAxiosError(error);
}

export function arrayToJson<T>(arr?: Array<T>) {
  if (!arr) {
    return '';
  }

  return JSON.stringify(arr);
}

export function json2formData(json: Record<string, unknown>) {
  const formData = new FormData();

  Object.entries(json).forEach(([key, value]) => {
    if (typeof value === 'undefined' || value === null) {
      return;
    }

    if (Array.isArray(value)) {
      formData.append(key, arrayToJson(value));
      return;
    }

    formData.append(key, value as string);
  });

  return formData;
}
