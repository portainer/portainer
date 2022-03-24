package kubernetes

import (
	"errors"
	"fmt"
	"net/http"
	"strings"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/endpointutils"
	kcli "github.com/portainer/portainer/api/kubernetes/cli"
	clientV1 "k8s.io/client-go/tools/clientcmd/api/v1"
)

// @id GetKubernetesConfig
// @summary Generates kubeconfig file enabling client communication with k8s api server
// @description Generates kubeconfig file enabling client communication with k8s api server
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param ids query []int false "will include only these environments(endpoints)"
// @param excludeIds query []int false "will exclude these environments(endpoints)"
// @success 200 "Success"
// @failure 400 "Invalid request"
// @failure 401 "Unauthorized"
// @failure 403 "Permission denied"
// @failure 404 "Environment(Endpoint) or ServiceAccount not found"
// @failure 500 "Server error"
// @router /kubernetes/config [get]
func (handler *Handler) getKubernetesConfig(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to access environment", err}
	}
	bearerToken, err := handler.jwtService.GenerateTokenForKubeconfig(tokenData)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to generate JWT token", err}
	}

	endpoints, handlerErr := handler.filterUserKubeEndpoints(r)
	if handlerErr != nil {
		return handlerErr
	}
	if len(endpoints) == 0 {
		return &httperror.HandlerError{http.StatusBadRequest, "empty endpoints list", errors.New("empty endpoints list")}
	}

	config, handlerErr := handler.buildConfig(r, tokenData, bearerToken, endpoints)
	if handlerErr != nil {
		return handlerErr
	}

	return writeFileContent(w, r, endpoints, tokenData, config)
}

func (handler *Handler) filterUserKubeEndpoints(r *http.Request) ([]portainer.Endpoint, *httperror.HandlerError) {
	var endpointIDs []portainer.EndpointID
	_ = request.RetrieveJSONQueryParameter(r, "ids", &endpointIDs, true)

	var excludeEndpointIDs []portainer.EndpointID
	_ = request.RetrieveJSONQueryParameter(r, "excludeIds", &excludeEndpointIDs, true)

	if len(endpointIDs) > 0 && len(excludeEndpointIDs) > 0 {
		return nil, &httperror.HandlerError{http.StatusBadRequest, "Can't provide both 'ids' and 'excludeIds' parameters", errors.New("invalid parameters")}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return nil, &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	endpointGroups, err := handler.dataStore.EndpointGroup().EndpointGroups()
	if err != nil {
		return nil, &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve environment groups from the database", err}
	}

	if len(endpointIDs) > 0 {
		var endpoints []portainer.Endpoint
		for _, endpointID := range endpointIDs {
			endpoint, err := handler.dataStore.Endpoint().Endpoint(endpointID)
			if err != nil {
				return nil, &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve environment from the database", err}
			}
			if !endpointutils.IsKubernetesEndpoint(endpoint) {
				continue
			}
			endpoints = append(endpoints, *endpoint)
		}
		filteredEndpoints := security.FilterEndpoints(endpoints, endpointGroups, securityContext)
		return filteredEndpoints, nil
	}

	var kubeEndpoints []portainer.Endpoint
	endpoints, err := handler.dataStore.Endpoint().Endpoints()
	if err != nil {
		return nil, &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve environments from the database", err}
	}
	for _, endpoint := range endpoints {
		if !endpointutils.IsKubernetesEndpoint(&endpoint) {
			continue
		}
		kubeEndpoints = append(kubeEndpoints, endpoint)
	}

	filteredEndpoints := security.FilterEndpoints(kubeEndpoints, endpointGroups, securityContext)
	if len(excludeEndpointIDs) > 0 {
		filteredEndpoints = endpointutils.FilterByExcludeIDs(filteredEndpoints, excludeEndpointIDs)
	}
	return filteredEndpoints, nil
}

func (handler *Handler) buildConfig(r *http.Request, tokenData *portainer.TokenData, bearerToken string, endpoints []portainer.Endpoint) (*clientV1.Config, *httperror.HandlerError) {
	configClusters := make([]clientV1.NamedCluster, len(endpoints))
	configContexts := make([]clientV1.NamedContext, len(endpoints))
	var configAuthInfos []clientV1.NamedAuthInfo
	authInfosSet := make(map[string]bool)

	for idx, endpoint := range endpoints {
		instanceID := handler.kubernetesClientFactory.GetInstanceID()
		serviceAccountName := kcli.UserServiceAccountName(int(tokenData.ID), instanceID)

		configClusters[idx] = handler.buildCluster(r, endpoint)
		configContexts[idx] = buildContext(serviceAccountName, endpoint)
		if !authInfosSet[serviceAccountName] {
			configAuthInfos = append(configAuthInfos, buildAuthInfo(serviceAccountName, bearerToken))
			authInfosSet[serviceAccountName] = true
		}
	}

	return &clientV1.Config{
		APIVersion:     "v1",
		Kind:           "Config",
		Clusters:       configClusters,
		Contexts:       configContexts,
		CurrentContext: configContexts[0].Name,
		AuthInfos:      configAuthInfos,
	}, nil
}

func (handler *Handler) buildCluster(r *http.Request, endpoint portainer.Endpoint) clientV1.NamedCluster {
	hostURL := strings.Split(r.Host, ":")[0]
	kubeConfigInternal := handler.kubeClusterAccessService.GetData(hostURL, endpoint.ID)
	return clientV1.NamedCluster{
		Name: buildClusterName(endpoint.Name),
		Cluster: clientV1.Cluster{
			Server:                kubeConfigInternal.ClusterServerURL,
			InsecureSkipTLSVerify: true,
		},
	}
}

func buildClusterName(endpointName string) string {
	return fmt.Sprintf("portainer-cluster-%s", endpointName)
}

func buildContext(serviceAccountName string, endpoint portainer.Endpoint) clientV1.NamedContext {
	contextName := fmt.Sprintf("portainer-ctx-%s", endpoint.Name)
	return clientV1.NamedContext{
		Name: contextName,
		Context: clientV1.Context{
			AuthInfo: serviceAccountName,
			Cluster:  buildClusterName(endpoint.Name),
		},
	}
}

func buildAuthInfo(serviceAccountName string, bearerToken string) clientV1.NamedAuthInfo {
	return clientV1.NamedAuthInfo{
		Name: serviceAccountName,
		AuthInfo: clientV1.AuthInfo{
			Token: bearerToken,
		},
	}
}

func writeFileContent(w http.ResponseWriter, r *http.Request, endpoints []portainer.Endpoint, tokenData *portainer.TokenData, config *clientV1.Config) *httperror.HandlerError {
	filenameSuffix := "kubeconfig"
	if len(endpoints) == 1 {
		filenameSuffix = endpoints[0].Name
	}
	filenameBase := fmt.Sprintf("%s-%s", tokenData.Username, filenameSuffix)

	if r.Header.Get("Accept") == "text/yaml" {
		yaml, err := kcli.GenerateYAML(config)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Failed to generate Kubeconfig", err}
		}

		w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; %s.yaml", filenameBase))
		return response.YAML(w, yaml)
	}

	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; %s.json", filenameBase))
	return response.JSON(w, config)
}
