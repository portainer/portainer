import { ping } from '@/docker/services/ping';
import { PortainerEndpointTypes } from '../models/endpoint/models';

angular.module('portainer.app').factory('EndpointProvider', EndpointProvider);

/* @ngInject */
function EndpointProvider() {
  const state = {
    currentEndpoint: null,
    pingInterval: null,
  };

  return { endpointID, setCurrentEndpoint, currentEndpoint, clean };

  function endpointID() {
    return state.currentEndpoint && state.currentEndpoint.Id;
  }

  function setCurrentEndpoint(endpoint) {
    state.currentEndpoint = endpoint;

    if (state.pingInterval) {
      clearInterval(state.pingInterval);
      state.pingInterval = null;
    }

    if (endpoint && endpoint.Type == PortainerEndpointTypes.EdgeAgentOnDockerEnvironment) {
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
