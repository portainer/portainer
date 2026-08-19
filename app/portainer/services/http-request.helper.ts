import { AxiosRequestConfig } from 'axios';

export const CACHE_DURATION = 5 * 60 * 1000; // 5m in ms
// event emitted when cache need to be refreshed
// used to sync $http + axios cache clear
export const CACHE_REFRESH_EVENT = '__cache__refresh__event__';

// utility function to dispatch catch refresh event
export function dispatchCacheRefreshEvent() {
  dispatchEvent(new CustomEvent(CACHE_REFRESH_EVENT, {}));
}

// perform checks on config.method and config.url
// to dispatch event in only specific scenarios
export function dispatchCacheRefreshEventIfNeeded(req: AxiosRequestConfig) {
  if (
    req.method &&
    ['post', 'patch', 'put', 'delete'].includes(req.method.toLowerCase()) &&
    // don't clear cache when we try to check for namespaces accesses
    // otherwise we will clear it on every page
    req.url &&
    !req.url.includes('selfsubjectaccessreviews') &&
    req.url.includes('kubernetes')
  ) {
    dispatchCacheRefreshEvent();
  }
}

interface Headers {
  agentTargetQueue: string[];
  agentManagerOperation: boolean;
  registryAuthentication?: string;
  agentTargetLastValue: string;
}

const headers: Headers = {
  agentTargetQueue: [],
  agentManagerOperation: false,
  agentTargetLastValue: '',
};

export function registryAuthenticationHeader() {
  return headers.registryAuthentication;
}

export function setRegistryAuthenticationHeader(headerValue: string) {
  headers.registryAuthentication = headerValue;
}

// Due to the fact that async HTTP requests are decorated using an interceptor
// we need to store and retrieve the headers using a first-in-first-out (FIFO) data structure.
// Otherwise, sequential HTTP requests might end up using the same header value (incorrect in the case
// of starting multiple containers on different nodes for example).
// To prevent having to use the HttpRequestHelper.setPortainerAgentTargetHeader before EACH request,
// we re-use the latest available header in the data structure (handy in thee case of multiple requests affecting
// the same node in the same view).
export function portainerAgentTargetHeader() {
  if (headers.agentTargetQueue.length === 0) {
    return headers.agentTargetLastValue;
  }

  if (headers.agentTargetQueue.length === 1) {
    const [lastValue] = headers.agentTargetQueue;
    headers.agentTargetLastValue = lastValue;
  }

  return headers.agentTargetQueue.shift() || '';
}

export function setPortainerAgentTargetHeader(headerValue: string) {
  if (headerValue) {
    headers.agentTargetQueue.push(headerValue);
  }
}

export function setPortainerAgentManagerOperation(set: boolean) {
  headers.agentManagerOperation = set;
}

export function portainerAgentManagerOperation() {
  return headers.agentManagerOperation;
}

export function resetAgentHeaders() {
  headers.agentTargetQueue = [];
  headers.agentTargetLastValue = '';
  headers.agentManagerOperation = false;
  delete headers.registryAuthentication;
}

/* @ngInject */
export function HttpRequestHelperAngular() {
  return {
    registryAuthenticationHeader,
    setRegistryAuthenticationHeader,
    portainerAgentTargetHeader,
    setPortainerAgentTargetHeader,
    setPortainerAgentManagerOperation,
    portainerAgentManagerOperation,
    resetAgentHeaders,
  };
}
