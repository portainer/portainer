import angular from 'angular';
import { API_ENDPOINT_ENDPOINTS } from '@/constants';

angular.module('portainer.agent').factory('Host', HostFactory);

function HostFactory($resource, EndpointProvider, StateManager) {
  return $resource(
    `${API_ENDPOINT_ENDPOINTS}/:endpointId/docker/v:version/host/:action`,
    {
      endpointId: EndpointProvider.endpointID,
      version: StateManager.getAgentApiVersion,
    },
    {
      info: { method: 'GET', params: { action: 'info' } },
    }
  );
}
