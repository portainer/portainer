import { PortainerEndpointTypes } from '@/portainer/models/endpoint/models';
import { isLocalEnvironment } from '@/react/portainer/environments/utils';

angular.module('portainer.app').factory('DockerHubService', DockerHubService);

/* @ngInject */
function DockerHubService(Endpoints, AgentDockerhub) {
  return {
    checkRateLimits,
  };

  function checkRateLimits(endpoint, registryId) {
    if (isLocalEnvironment(endpoint)) {
      return Endpoints.dockerhubLimits({ id: endpoint.Id, registryId }).$promise;
    }

    switch (endpoint.Type) {
      case PortainerEndpointTypes.AgentOnDockerEnvironment:
      case PortainerEndpointTypes.EdgeAgentOnDockerEnvironment:
        return AgentDockerhub.limits({ endpointId: endpoint.Id, endpointType: 'docker', registryId }).$promise;

      case PortainerEndpointTypes.AgentOnKubernetesEnvironment:
      case PortainerEndpointTypes.EdgeAgentOnKubernetesEnvironment:
        return AgentDockerhub.limits({ endpointId: endpoint.Id, endpointType: 'kubernetes', registryId }).$promise;
    }
  }
}
