import _ from 'lodash-es';
import { PortainerEndpointTypes } from 'Portainer/models/endpoint/models';

function findAssociatedGroup(endpoint, groups) {
  return _.find(groups, function (group) {
    return group.Id === endpoint.GroupId;
  });
}

export default class EndpointHelper {
  static isLocalEndpoint(endpoint) {
    return endpoint.URL.includes('unix://') || endpoint.URL.includes('npipe://') || endpoint.Type === PortainerEndpointTypes.KubernetesLocalEnvironment;
  }

  static isDockerEndpoint(endpoint) {
    return [PortainerEndpointTypes.DockerEnvironment, PortainerEndpointTypes.AgentOnDockerEnvironment, PortainerEndpointTypes.EdgeAgentOnDockerEnvironment].includes(endpoint.Type);
  }

  static isAgentEndpoint(endpoint) {
    return [
      PortainerEndpointTypes.AgentOnDockerEnvironment,
      PortainerEndpointTypes.EdgeAgentOnDockerEnvironment,
      PortainerEndpointTypes.AgentOnKubernetesEnvironment,
      PortainerEndpointTypes.EdgeAgentOnKubernetesEnvironment,
    ].includes(endpoint.Type);
  }

  static isEdgeEndpoint(endpoint) {
    return [PortainerEndpointTypes.EdgeAgentOnDockerEnvironment, PortainerEndpointTypes.EdgeAgentOnKubernetesEnvironment].includes(endpoint.Type);
  }

  static mapGroupNameToEndpoint(endpoints, groups) {
    for (var i = 0; i < endpoints.length; i++) {
      var endpoint = endpoints[i];
      var group = findAssociatedGroup(endpoint, groups);
      if (group) {
        endpoint.GroupName = group.Name;
      }
    }
  }
}

export function isOfflineEndpoint(endpoint) {
  return endpoint.Status !== 1;
}
