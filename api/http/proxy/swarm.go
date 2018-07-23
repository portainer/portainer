package proxy

import (
	"net/http"
)

// swarmInspectOperation extracts the response as a JSON object and rewrites the response based
// on the current user role. Sensitive fields are deleted from the response for non-administrator users.
func swarmInspectOperation(response *http.Response, executor *operationExecutor) error {
	// SwarmInspect response is a JSON object
	// https://docs.docker.com/engine/api/v1.30/#operation/SwarmInspect
	responseObject, err := getResponseAsJSONOBject(response)
	if err != nil {
		return err
	}

	if !executor.operationContext.isAdmin {
		delete(responseObject, "JoinTokens")
		delete(responseObject, "TLSInfo")
	}

	return rewriteResponse(response, responseObject, http.StatusOK)
}
