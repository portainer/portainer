package helm

import (
	"fmt"
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/middlewares"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/kubernetes"
	"github.com/portainer/portainer/pkg/libhelm/options"
	libhelmtypes "github.com/portainer/portainer/pkg/libhelm/types"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/gorilla/mux"
)

// Handler is the HTTP handler used to handle environment(endpoint) group operations.
type Handler struct {
	*mux.Router
	requestBouncer           security.BouncerService
	dataStore                dataservices.DataStore
	jwtService               portainer.JWTService
	kubeClusterAccessService kubernetes.KubeClusterAccessService
	kubernetesDeployer       portainer.KubernetesDeployer
	helmPackageManager       libhelmtypes.HelmPackageManager
}

// NewHandler creates a handler to manage endpoint group operations.
func NewHandler(bouncer security.BouncerService, dataStore dataservices.DataStore, jwtService portainer.JWTService, kubernetesDeployer portainer.KubernetesDeployer, helmPackageManager libhelmtypes.HelmPackageManager, kubeClusterAccessService kubernetes.KubeClusterAccessService) *Handler {
	h := &Handler{
		Router:                   mux.NewRouter(),
		requestBouncer:           bouncer,
		dataStore:                dataStore,
		jwtService:               jwtService,
		kubernetesDeployer:       kubernetesDeployer,
		helmPackageManager:       helmPackageManager,
		kubeClusterAccessService: kubeClusterAccessService,
	}

	h.Use(middlewares.WithEndpoint(dataStore.Endpoint(), "id"),
		bouncer.AuthenticatedAccess)

	// `helm list -o json`
	h.Handle("/{id}/kubernetes/helm",
		httperror.LoggerHandler(h.helmList)).Methods(http.MethodGet)

	// `helm delete RELEASE_NAME`
	h.Handle("/{id}/kubernetes/helm/{release}",
		httperror.LoggerHandler(h.helmDelete)).Methods(http.MethodDelete)

	// `helm install [NAME] [CHART] flags`
	h.Handle("/{id}/kubernetes/helm",
		httperror.LoggerHandler(h.helmInstall)).Methods(http.MethodPost)

	// `helm get all [RELEASE_NAME]`
	h.Handle("/{id}/kubernetes/helm/{release}",
		httperror.LoggerHandler(h.helmGet)).Methods(http.MethodGet)

	// `helm history [RELEASE_NAME]`
	h.Handle("/{id}/kubernetes/helm/{release}/history",
		httperror.LoggerHandler(h.helmGetHistory)).Methods(http.MethodGet)

	// `helm rollback [RELEASE_NAME] [REVISION]`
	h.Handle("/{id}/kubernetes/helm/{release}/rollback",
		httperror.LoggerHandler(h.helmRollback)).Methods(http.MethodPost)

	return h
}

// NewTemplateHandler creates a template handler to manage environment(endpoint) group operations.
func NewTemplateHandler(bouncer security.BouncerService, helmPackageManager libhelmtypes.HelmPackageManager) *Handler {
	h := &Handler{
		Router:             mux.NewRouter(),
		helmPackageManager: helmPackageManager,
		requestBouncer:     bouncer,
	}

	h.Use(bouncer.AuthenticatedAccess)

	h.Handle("/templates/helm",
		httperror.LoggerHandler(h.helmRepoSearch)).Methods(http.MethodGet)

	// helm show [COMMAND] [CHART] [REPO] flags
	h.Handle("/templates/helm/{command:chart|values|readme}",
		httperror.LoggerHandler(h.helmShow)).Methods(http.MethodGet)

	return h
}

// getHelmClusterAccess obtains the core k8s cluster access details from request.
// The cluster access includes the cluster server url, the user's bearer token and the tls certificate.
// The cluster access is passed in as kube config CLI params to helm.
func (handler *Handler) getHelmClusterAccess(r *http.Request) (*options.KubernetesClusterAccess, *httperror.HandlerError) {
	endpoint, err := middlewares.FetchEndpoint(r)
	if err != nil {
		return nil, httperror.NotFound("Unable to find an environment on request context", err)
	}

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return nil, httperror.InternalServerError("Unable to retrieve user authentication token", err)
	}

	bearerToken, _, err := handler.jwtService.GenerateToken(tokenData)
	if err != nil {
		return nil, httperror.Unauthorized("Unauthorized", err)
	}

	sslSettings, err := handler.dataStore.SSLSettings().Settings()
	if err != nil {
		return nil, httperror.InternalServerError("Unable to retrieve settings from the database", err)
	}

	hostURL := "localhost"
	if !sslSettings.SelfSigned {
		hostURL = r.Host
	}

	kubeConfigInternal := handler.kubeClusterAccessService.GetClusterDetails(hostURL, endpoint.ID, true)
	return &options.KubernetesClusterAccess{
		ClusterName:              fmt.Sprintf("%s-%s", "portainer-cluster", endpoint.Name),
		ContextName:              fmt.Sprintf("%s-%s", "portainer-ctx", endpoint.Name),
		UserName:                 fmt.Sprintf("%s-%s", "portainer-sa-user", tokenData.Username),
		ClusterServerURL:         kubeConfigInternal.ClusterServerURL,
		CertificateAuthorityFile: kubeConfigInternal.CertificateAuthorityFile,
		AuthToken:                bearerToken,
	}, nil
}
