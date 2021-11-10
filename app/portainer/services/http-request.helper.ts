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
