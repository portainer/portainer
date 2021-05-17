package docker

import (
	"net/http"

	"github.com/portainer/portainer/api/http/proxy/factory/utils"
)

// swarmInspectOperation extracts the response as a JSON object and rewrites the response based
// on the current user role. Sensitive fields are deleted from the response for non-administrator users.
func swarmInspectOperation(response *http.Response, executor *operationExecutor) error {
	// SwarmInspect response is a JSON object
	// https://docs.docker.com/engine/api/v1.30/#operation/SwarmInspect
	responseObject, err := utils.GetResponseAsJSONObject(response)
	if err != nil {
		return err
	}

	if !executor.operationContext.isAdmin {
		delete(responseObject, "JoinTokens")
		delete(responseObject, "TLSInfo")
	}

	return utils.RewriteResponse(response, responseObject, http.StatusOK)
}
