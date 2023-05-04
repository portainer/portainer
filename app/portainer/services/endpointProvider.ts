import { ping } from '@/docker/services/ping';
import { environmentStore } from '@/react/hooks/current-environment-store';
import {
  Environment,
  EnvironmentType,
} from '@/react/portainer/environments/types';

interface State {
  currentEndpoint: Environment | null;
  pingInterval: NodeJS.Timer | null;
}

const DEFAULT_TITLE = 'Portainer';

/* @ngInject */
export function EndpointProvider() {
  const state: State = {
    currentEndpoint: null,
    pingInterval: null,
  };

  environmentStore.subscribe((state) => {
    if (!state.environmentId) {
      setCurrentEndpoint(null);
    }
  });

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

    if (endpoint === null) {
      sessionStorage.setItem(
        'portainer.environmentId',
        JSON.stringify(undefined)
      );
    }

    document.title = endpoint
      ? `${DEFAULT_TITLE} | ${endpoint.Name}`
      : `${DEFAULT_TITLE}`;
  }

  function currentEndpoint() {
    return state.currentEndpoint;
  }

  function clean() {
    setCurrentEndpoint(null);
    environmentStore.getState().clear();
  }
}

export type EndpointProviderInterface = ReturnType<typeof EndpointProvider>;
