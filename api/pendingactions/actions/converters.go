package actions

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
)

type (
	CleanNAPWithOverridePoliciesPayload struct {
		EndpointGroupID portainer.EndpointGroupID
	}
)

func ConvertCleanNAPWithOverridePoliciesPayload(actionData interface{}) (*CleanNAPWithOverridePoliciesPayload, error) {
	var payload CleanNAPWithOverridePoliciesPayload

	if actionData == nil {
		return nil, nil
	}

	// backward compatible with old data format
	if endpointGroupId, ok := actionData.(float64); ok {
		payload.EndpointGroupID = portainer.EndpointGroupID(endpointGroupId)
		return &payload, nil
	}

	data, ok := actionData.(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("failed to convert actionData to map[string]interface{}")

	}

	for key, value := range data {
		switch key {
		case "EndpointGroupID":
			if endpointGroupID, ok := value.(float64); ok {
				payload.EndpointGroupID = portainer.EndpointGroupID(endpointGroupID)
			}
		}
	}

	return &payload, nil
}
