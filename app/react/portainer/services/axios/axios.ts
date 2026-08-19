import Axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import {
  AxiosCacheInstance,
  buildMemoryStorage,
  CacheAxiosResponse,
  InterpreterResult,
  setupCache,
  StorageValue,
} from 'axios-cache-interceptor';
import { loadProgressBar } from 'axios-progress-bar';
import 'axios-progress-bar/dist/nprogress.css';
import qs from 'qs';

import {
  CACHE_DURATION,
  dispatchCacheRefreshEventIfNeeded,
  portainerAgentManagerOperation,
  portainerAgentTargetHeader,
} from '@/portainer/services/http-request.helper';
import { dockerMaxAPIVersionInterceptor } from '@/portainer/services/dockerMaxApiVersionInterceptor';

export { parseAxiosError } from './utils/parseAxiosError';

const portainerCacheHeader = 'X-Portainer-Cache';

const storage = buildMemoryStorage();
// mock the cache adapter
export const cache = {
  store: {
    clear: () => {
      storage.data = new Map<string, StorageValue>();
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
  paramsSerializer: {
    serialize: (params) => qs.stringify(params, { arrayFormat: 'brackets' }),
  },
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

let isRedirectingToLogout = false;

axios.interceptors.response.use(undefined, (error) => {
  if (
    error.response?.status === 401 &&
    !error.config.url.includes('/v2/') && // docker proxy through agent
    !error.config.url.includes('/api/v4/') && // gitlab proxy
    !isRedirectingToLogout &&
    isTransitionRequiresAuthentication()
  ) {
    isRedirectingToLogout = true;
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
