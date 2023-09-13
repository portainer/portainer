package edgestacks

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/endpointutils"
)

func hasKubeEndpoint(endpointService dataservices.EndpointService, endpointIDs []portainer.EndpointID) (bool, error) {
	return hasEndpointPredicate(endpointService, endpointIDs, endpointutils.IsKubernetesEndpoint)
}

func hasDockerEndpoint(endpointService dataservices.EndpointService, endpointIDs []portainer.EndpointID) (bool, error) {
	return hasEndpointPredicate(endpointService, endpointIDs, endpointutils.IsDockerEndpoint)
}

func hasEndpointPredicate(endpointService dataservices.EndpointService, endpointIDs []portainer.EndpointID, predicate func(*portainer.Endpoint) bool) (bool, error) {
	for _, endpointID := range endpointIDs {
		endpoint, err := endpointService.Endpoint(endpointID)
		if err != nil {
			return false, fmt.Errorf("failed to retrieve environment from database: %w", err)
		}

		if predicate(endpoint) {
			return true, nil
		}
	}

	return false, nil
}

func hasWrongEnvironmentType(endpointService dataservices.EndpointService, endpointIDs []portainer.EndpointID, deploymentType portainer.EdgeStackDeploymentType) (bool, error) {
	return hasEndpointPredicate(endpointService, endpointIDs, func(e *portainer.Endpoint) bool {
		switch deploymentType {
		case portainer.EdgeStackDeploymentKubernetes:
			return !endpointutils.IsKubernetesEndpoint(e)
		case portainer.EdgeStackDeploymentCompose:
			return !endpointutils.IsDockerEndpoint(e)
		default:
			return true
		}
	})
}
