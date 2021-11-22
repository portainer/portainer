package docker

import (
	portainer "github.com/portainer/portainer/api"
)

func (transport *Transport) applyPortainerContainers(resources []interface{}) ([]interface{}, error) {
	decoratedResourceData := make([]interface{}, 0)
	for _, resource := range resources {
		responseObject, ok := resource.(map[string]interface{})
		if !ok {
			decoratedResourceData = append(decoratedResourceData, resource)
			continue
		}
		responseObject, _ = transport.applyPortainerContainer(responseObject)

		decoratedResourceData = append(decoratedResourceData, responseObject)
	}
	return decoratedResourceData, nil
}

func (transport *Transport) applyPortainerContainer(resourceObject map[string]interface{}) (map[string]interface{}, error) {
	portainerContainerId := portainer.ServerStatus.PortainerContainerID
	if resourceObject["Id"].(string)[0:12] == portainerContainerId {
		resourceObject["IsPortainer"] = true
	}
	return resourceObject, nil
}
