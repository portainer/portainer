package kubernetes

import (
	"errors"
	"fmt"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
	kcli "github.com/portainer/portainer/api/kubernetes/cli"
)

// @id GetKubernetesConfig
// @summary Generates kubeconfig file enabling client communication with k8s api server
// @description Generates kubeconfig file enabling client communication with k8s api server
// @description **Access policy**: authenticated
// @tags kubernetes
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @success 200 "Success"
// @failure 400 "Invalid request"
// @failure 401 "Unauthorized"
// @failure 403 "Permission denied"
// @failure 404 "Environment(Endpoint) or ServiceAccount not found"
// @failure 500 "Server error"
// @router /kubernetes/{id}/config [get]
func (handler *Handler) getKubernetesConfig(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid environment identifier route variable", err}
	}

	endpoint, err := handler.dataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if handler.dataStore.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an environment with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an environment with the specified identifier inside the database", err}
	}

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to access environment", err}
	}

	bearerToken, err := handler.JwtService.GenerateTokenForKubeconfig(tokenData)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to generate JWT token", err}
	}

	cli, err := handler.kubernetesClientFactory.GetKubeClient(endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to create Kubernetes client", err}
	}

	apiServerURL := getProxyUrl(r, endpointID)

	config, err := cli.GetKubeConfig(r.Context(), apiServerURL, bearerToken, tokenData)
	if err != nil {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to generate Kubeconfig", err}
	}

	filenameBase := fmt.Sprintf("%s-%s", tokenData.Username, endpoint.Name)
	contentAcceptHeader := r.Header.Get("Accept")
	if contentAcceptHeader == "text/yaml" {
		yaml, err := kcli.GenerateYAML(config)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Failed to generate Kubeconfig", err}
		}

		w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; %s.yaml", filenameBase))
		return YAML(w, yaml)
	}

	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; %s.json", filenameBase))
	return response.JSON(w, config)
}

// getProxyUrl generates portainer proxy url which acts as proxy to k8s api server
func getProxyUrl(r *http.Request, endpointID int) string {
	return fmt.Sprintf("https://%s/api/endpoints/%d/kubernetes", r.Host, endpointID)
}

// YAML writes yaml response as string to writer. Returns a pointer to a HandlerError if encoding fails.
// This could be moved to a more useful place; but that place is most likely not in this project.
// It should actually go in https://github.com/portainer/libhttp - since that is from where we use response.JSON.
// We use `data interface{}` as parameter - since im trying to keep it as close to (or the same as) response.JSON method signature:
// https://github.com/portainer/libhttp/blob/d20481a3da823c619887c440a22fdf4fa8f318f2/response/response.go#L13
func YAML(rw http.ResponseWriter, data interface{}) *httperror.HandlerError {
	rw.Header().Set("Content-Type", "text/yaml")

	strData, ok := data.(string)
	if !ok {
		return &httperror.HandlerError{
			StatusCode: http.StatusInternalServerError,
			Message:    "Unable to write YAML response",
			Err:        errors.New("failed to convert input to string"),
		}
	}

	fmt.Fprint(rw, strData)

	return nil
}
