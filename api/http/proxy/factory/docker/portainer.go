package docker

import (
	"os"
)

var portainerContainerId string

func init() {
	// use hostname as the current  portainer id
	// Reference issue: JIRA EE-917
	// https://social.msdn.microsoft.com/Forums/en-US/5e5bff27-7511-4fb2-9ffa-207520d0ffb8/how-to-gain-windows-container-id-in-windows-container?forum=windowscontainers
	// Because Windows container cannot obtain container ID from /proc/self/cgroups like linux container,
	// as a workaround, we currently use hostname as container ID.
	portainerContainerId, _ = os.Hostname()
}

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
	resourceId, ok := resourceObject["Id"].(string)
	if !ok {
		return resourceObject, nil
	}
	if len(resourceId) >= 12 && resourceId[0:12] == portainerContainerId {
		resourceObject["IsPortainer"] = true
	}
	return resourceObject, nil
}
