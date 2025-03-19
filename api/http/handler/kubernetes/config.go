package kubernetes

import (
	"crypto/x509"
	"encoding/pem"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/endpointutils"
	kcli "github.com/portainer/portainer/api/kubernetes/cli"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/rs/zerolog/log"

	clientV1 "k8s.io/client-go/tools/clientcmd/api/v1"
)

// @id GetKubernetesConfig
// @summary Generate a kubeconfig file
// @description Generate a kubeconfig file that allows a client to communicate with the Kubernetes API server
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce application/json, application/yaml
// @param ids query []int false "will include only these environments(endpoints)"
// @param excludeIds query []int false "will exclude these environments(endpoints)"
// @success 200 {object} interface{} "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier."
// @failure 500 "Server error occurred while attempting to generate the kubeconfig file."
// @router /kubernetes/config [get]
func (handler *Handler) getKubernetesConfig(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesConfig").Msg("Permission denied to access environment")
		return httperror.Forbidden("Permission denied to access environment", err)
	}

	bearerToken, err := handler.JwtService.GenerateTokenForKubeconfig(tokenData)
	if err != nil {
		log.Error().Err(err).Str("context", "getKubernetesConfig").Msg("Unable to generate JWT token")
		return httperror.InternalServerError("Unable to generate JWT token", err)
	}

	endpoints, handlerErr := handler.filterUserKubeEndpoints(r)
	if handlerErr != nil {
		log.Error().Err(handlerErr).Str("context", "getKubernetesConfig").Msg("Unable to filter user kube endpoints")
		return handlerErr
	}

	if len(endpoints) == 0 {
		log.Error().Str("context", "getKubernetesConfig").Msg("Empty endpoints list")
		return httperror.BadRequest("empty endpoints list", errors.New("empty endpoints list"))
	}

	config := handler.buildConfig(r, tokenData, bearerToken, endpoints, false)

	return writeFileContent(w, r, endpoints, tokenData, config)
}

func (handler *Handler) filterUserKubeEndpoints(r *http.Request) ([]portainer.Endpoint, *httperror.HandlerError) {
	var endpointIDs []portainer.EndpointID
	_ = request.RetrieveJSONQueryParameter(r, "ids", &endpointIDs, true)

	var excludeEndpointIDs []portainer.EndpointID
	_ = request.RetrieveJSONQueryParameter(r, "excludeIds", &excludeEndpointIDs, true)

	if len(endpointIDs) > 0 && len(excludeEndpointIDs) > 0 {
		log.Error().Str("context", "filterUserKubeEndpoints").Msg("Can't provide both 'ids' and 'excludeIds' parameters")
		return nil, httperror.BadRequest("Can't provide both 'ids' and 'excludeIds' parameters", errors.New("invalid parameters"))
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		log.Error().Err(err).Str("context", "filterUserKubeEndpoints").Msg("Unable to retrieve info from request context")
		return nil, httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	endpointGroups, err := handler.DataStore.EndpointGroup().ReadAll()
	if err != nil {
		log.Error().Err(err).Str("context", "filterUserKubeEndpoints").Msg("Unable to retrieve environment groups from the database")
		return nil, httperror.InternalServerError("Unable to retrieve environment groups from the database", err)
	}

	if len(endpointIDs) > 0 {
		var endpoints []portainer.Endpoint
		for _, endpointID := range endpointIDs {
			endpoint, err := handler.DataStore.Endpoint().Endpoint(endpointID)
			if err != nil {
				log.Error().Err(err).Str("context", "filterUserKubeEndpoints").Msg("Unable to retrieve environment from the database")
				return nil, httperror.InternalServerError("Unable to retrieve environment from the database", err)
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
	endpoints, err := handler.DataStore.Endpoint().Endpoints()
	if err != nil {
		log.Error().Err(err).Str("context", "filterUserKubeEndpoints").Msg("Unable to retrieve environments from the database")
		return nil, httperror.InternalServerError("Unable to retrieve environments from the database", err)
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

func (handler *Handler) buildConfig(r *http.Request, tokenData *portainer.TokenData, bearerToken string, endpoints []portainer.Endpoint, isInternal bool) *clientV1.Config {
	var configAuthInfos []clientV1.NamedAuthInfo

	configClusters := make([]clientV1.NamedCluster, len(endpoints))
	configContexts := make([]clientV1.NamedContext, len(endpoints))
	authInfosSet := make(map[string]bool)

	for idx, endpoint := range endpoints {
		instanceID := handler.KubernetesClientFactory.GetInstanceID()
		serviceAccountName := kcli.UserServiceAccountName(int(tokenData.ID), instanceID)

		configClusters[idx] = handler.buildCluster(r, endpoint, isInternal)
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
	}
}

// buildCluster builds a Kubernetes cluster configuration based on the endpoint and if it's used internally or externally.
func (handler *Handler) buildCluster(r *http.Request, endpoint portainer.Endpoint, isInternal bool) clientV1.NamedCluster {
	kubeConfigInternal := handler.kubeClusterAccessService.GetClusterDetails(r.Host, endpoint.ID, isInternal)

	if isInternal {
		return clientV1.NamedCluster{
			Name: buildClusterName(endpoint.Name),
			Cluster: clientV1.Cluster{
				Server:                kubeConfigInternal.ClusterServerURL,
				InsecureSkipTLSVerify: true,
			},
		}
	}

	selfSignedCert := false
	serverUrl, err := url.Parse(kubeConfigInternal.ClusterServerURL)
	if err != nil {
		log.Warn().Err(err).Msg("Failed to parse server URL")
	}

	if strings.EqualFold(serverUrl.Scheme, "https") {
		var certPem []byte
		var err error

		if kubeConfigInternal.CertificateAuthorityData != "" {
			certPem = []byte(kubeConfigInternal.CertificateAuthorityData)
		} else if kubeConfigInternal.CertificateAuthorityFile != "" {
			certPem, err = os.ReadFile(kubeConfigInternal.CertificateAuthorityFile)
			if err != nil {
				log.Warn().Err(err).Msg("Failed to open certificate file")
			}
		}

		if certPem != nil {
			selfSignedCert, err = IsSelfSignedCertificate(certPem)
			if err != nil {
				log.Warn().Err(err).Msg("Failed to verify if certificate is self-signed")
			}
		}
	}

	return clientV1.NamedCluster{
		Name: buildClusterName(endpoint.Name),
		Cluster: clientV1.Cluster{
			Server:                kubeConfigInternal.ClusterServerURL,
			InsecureSkipTLSVerify: selfSignedCert,
		},
	}
}

func buildClusterName(endpointName string) string {
	return "portainer-cluster-" + endpointName
}

func buildContext(serviceAccountName string, endpoint portainer.Endpoint) clientV1.NamedContext {
	return clientV1.NamedContext{
		Name: "portainer-ctx-" + endpoint.Name,
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
			log.Error().Err(err).Str("context", "writeFileContent").Msg("Failed to generate Kubeconfig")
			return httperror.InternalServerError("Failed to generate Kubeconfig", err)
		}

		w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; %s.yaml", filenameBase))
		return response.YAML(w, yaml)
	}

	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; %s.json", filenameBase))
	return response.JSON(w, config)
}

func IsSelfSignedCertificate(certPem []byte) (bool, error) {
	if certPem == nil {
		return false, errors.New("certificate data is empty")
	}

	if !strings.Contains(string(certPem), "BEGIN CERTIFICATE") {
		certPem = []byte(fmt.Sprintf("-----BEGIN CERTIFICATE-----\n%s\n-----END CERTIFICATE-----", string(certPem)))
	}

	block, _ := pem.Decode(certPem)
	if block == nil {
		return false, errors.New("failed to decode certificate")
	}

	cert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return false, err
	}

	if cert.Issuer.String() != cert.Subject.String() {
		return false, nil
	}

	roots := x509.NewCertPool()
	roots.AddCert(cert)

	opts := x509.VerifyOptions{
		Roots:       roots,
		CurrentTime: cert.NotBefore,
	}

	_, err = cert.Verify(opts)
	return err == nil, err
}
