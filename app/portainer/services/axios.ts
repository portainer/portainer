import Axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import {
  setupCache,
  buildMemoryStorage,
  CacheAxiosResponse,
  InterpreterResult,
  AxiosCacheInstance,
} from 'axios-cache-interceptor';
import { loadProgressBar } from 'axios-progress-bar';
import 'axios-progress-bar/dist/nprogress.css';

import PortainerError from '@/portainer/error';

import {
  CACHE_DURATION,
  dispatchCacheRefreshEventIfNeeded,
  portainerAgentManagerOperation,
  portainerAgentTargetHeader,
} from './http-request.helper';
import { dockerMaxAPIVersionInterceptor } from './dockerMaxApiVersionInterceptor';
import { MAX_DOCKER_API_VERSION } from './dockerMaxApiVersion';

const portainerCacheHeader = 'X-Portainer-Cache';

const storage = buildMemoryStorage();
// mock the cache adapter
export const cache = {
  store: {
    clear: () => {
      storage.data = {};
    },
  },
};

function headerInterpreter(
  headers?: CacheAxiosResponse['headers']
): InterpreterResult {
  if (!headers) {
    return 'not enough headers';
  }

  if (headers[portainerCacheHeader]) {
    return CACHE_DURATION;
  }

  return 'not enough headers';
}

const axios = Axios.create({
  baseURL: 'api',
  maxDockerAPIVersion: MAX_DOCKER_API_VERSION,
});
axios.interceptors.request.use((req) => {
  dispatchCacheRefreshEventIfNeeded(req);
  return req;
});

// type guard the axios instance
function isAxiosCacheInstance(
  a: AxiosInstance | AxiosCacheInstance
): a is AxiosCacheInstance {
  return (a as AxiosCacheInstance).defaults.cache !== undefined;
}

// when entering a kubernetes environment, or updating user settings, update the cache adapter
export function updateAxiosAdapter(useCache: boolean) {
  if (useCache) {
    if (isAxiosCacheInstance(axios)) {
      return;
    }

    setupCache(axios, {
      storage,
      ttl: CACHE_DURATION,
      methods: ['get', 'head', 'options', 'post'],
      // cachePredicate determines if the response should be cached based on response
      cachePredicate: {
        containsHeaders: {
          [portainerCacheHeader]: () => true,
        },
        ignoreUrls: [/^(?!.*\bkubernetes\b).*$/gm],
        responseMatch: (res) => {
          if (res.config.method === 'post') {
            if (res.config.url?.includes('selfsubjectaccessreviews')) {
              return true;
            }
            return false;
          }
          return true;
        },
      },
      // headerInterpreter interprets the response headers to determine if the response should be cached
      headerInterpreter,
    });
  }
}

export default axios;

loadProgressBar(undefined, axios);

export const agentTargetHeader = 'X-PortainerAgent-Target';

export function agentInterceptor(config: InternalAxiosRequestConfig) {
  if (!config.url || !config.url.includes('/docker/')) {
    return config;
  }

  const newConfig = { ...config };
  const target = portainerAgentTargetHeader();
  if (target) {
    newConfig.headers[agentTargetHeader] = target;
  }

  if (portainerAgentManagerOperation()) {
    newConfig.headers['X-PortainerAgent-ManagerOperation'] = '1';
  }

  return newConfig;
}

axios.interceptors.request.use(dockerMaxAPIVersionInterceptor);
axios.interceptors.request.use(agentInterceptor);

axios.interceptors.response.use(undefined, (error) => {
  if (
    error.response?.status === 401 &&
    !error.config.url.includes('/v2/') && // docker proxy through agent
    !error.config.url.includes('/api/v4/') && // gitlab proxy
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

type DefaultAxiosErrorType = {
  message: string;
  details?: string;
};

export function defaultErrorParser(axiosError: AxiosError<unknown>) {
  if (isDefaultResponse(axiosError.response?.data)) {
    const message = axiosError.response?.data.message || '';
    const details = axiosError.response?.data.details || message;
    const error = new Error(message);
    return { error, details };
  }
  if (isArrayResponse(axiosError.response?.data)) {
    const message = axiosError.response?.data[0].message || '';
    const details = axiosError.response?.data[0].details || message;
    const error = new Error(message);
    return { error, details };
  }

  const details = axiosError.response?.data
    ? axiosError.response?.data.toString()
    : '';
  const error = new Error('Axios error');
  return { error, details };
}

// handle jsonObjectsToArrayHandler transformation
function isArrayResponse(data: unknown): data is DefaultAxiosErrorType[] {
  return (
    !!data &&
    Array.isArray(data) &&
    'message' in data[0] &&
    typeof data[0].message === 'string'
  );
}

export function isDefaultResponse(
  data: unknown
): data is DefaultAxiosErrorType {
  return (
    !!data &&
    typeof data === 'object' &&
    'message' in data &&
    typeof data.message === 'string'
  );
}

export function isAxiosError<ResponseType>(
  error: unknown
): error is AxiosError<ResponseType> {
  return Axios.isAxiosError(error);
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

    if (value instanceof File) {
      formData.append(key, value);
      return;
    }

    if (Array.isArray(value)) {
      formData.append(key, arrayToJson(value));
      return;
    }

    if (typeof value === 'object') {
      formData.append(key, JSON.stringify(value));
      return;
    }

    formData.append(key, value.toString());
  });

  return formData;
}

/**
 * The Docker API often returns a list of JSON object.
 * This handler wrap the JSON objects in an array.
 * @param data Raw docker API response (stream of objects in a single string)
 * @returns An array of parsed objects
 */
export function jsonObjectsToArrayHandler(data: string): unknown[] {
  // catching empty data helps the function not to fail and prevents unwanted error message to user.
  if (!data) {
    return [];
  }
  const str = `[${data.replace(/\n/g, ' ').replace(/\}\s*\{/g, '}, {')}]`;
  return JSON.parse(str);
}
