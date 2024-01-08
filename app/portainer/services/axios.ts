import Axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  setupCache,
  buildMemoryStorage,
  type CacheAxiosResponse,
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

function headerInterpreter(headers?: CacheAxiosResponse['headers']) {
  if (headers && headers[portainerCacheHeader]) {
    return CACHE_DURATION / 1000; // in seconds
  }

  return 'not enough headers';
}

const axios = setupCache(Axios.create({ baseURL: 'api' }), {
  storage,
  ttl: 0, // default 0 for no cache
  methods: ['get', 'head', 'options', 'post'],
  cachePredicate: {
    containsHeaders: {
      accept: (header) => !header?.includes('application/yaml'),
      [portainerCacheHeader]: () => true,
    },
    ignoreUrls: [/^(?!.*\bkubernetes\b).*$/gm],
    responseMatch: (res) => {
      if (res.config.method === 'post') {
        // dont cache post request except for selfsubjectaccessreviews
        if (res.config.url?.includes('selfsubjectaccessreviews')) {
          return true;
        }
        return false;
      }
      return true;
    },
  },
  headerInterpreter,
});
axios.interceptors.request.use((req) => {
  dispatchCacheRefreshEventIfNeeded(req);
  return req;
});

// when entering a kubernetes environment, or updating user settings, update the cache adapter
export function updateAxiosAdapter(useCache: boolean) {
  if (useCache) {
    axios.defaults.cache.ttl = CACHE_DURATION;
  }
}

loadProgressBar(undefined, axios);

export default axios;

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

  const details = axiosError.response?.data
    ? axiosError.response?.data.toString()
    : '';
  const error = new Error('Axios error');
  return { error, details };
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
