import { ping } from '@/docker/services/ping';
import {
  Environment,
  EnvironmentType,
} from '@/react/portainer/environments/types';

interface State {
  currentEndpoint: Environment | null;
  pingInterval: NodeJS.Timer | null;
}

/* @ngInject */
export function EndpointProvider() {
  const state: State = {
    currentEndpoint: null,
    pingInterval: null,
  };

  return { endpointID, setCurrentEndpoint, currentEndpoint, clean };

  function endpointID() {
    return state.currentEndpoint?.Id;
  }

  function setCurrentEndpoint(endpoint: Environment | null) {
    state.currentEndpoint = endpoint;

    if (state.pingInterval) {
      clearInterval(state.pingInterval);
      state.pingInterval = null;
    }

    if (endpoint && endpoint.Type === EnvironmentType.EdgeAgentOnDocker) {
      state.pingInterval = setInterval(() => ping(endpoint.Id), 60 * 1000);
    }
  }

  function currentEndpoint() {
    return state.currentEndpoint;
  }

  function clean() {
    setCurrentEndpoint(null);
  }
}

export type EndpointProviderInterface = ReturnType<typeof EndpointProvider>;
