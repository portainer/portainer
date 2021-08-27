package helm

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/portainer/libhelm"
	"github.com/portainer/libhelm/options"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	portainer "github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/kubernetes"
)

const (
	handlerActivityContext = "Kubernetes"
)

type requestBouncer interface {
	AuthenticatedAccess(h http.Handler) http.Handler
}

// Handler is the HTTP handler used to handle endpoint group operations.
type Handler struct {
	*mux.Router
	requestBouncer     requestBouncer
	dataStore          portainer.DataStore
	kubeConfigService  kubernetes.KubeConfigService
	helmPackageManager libhelm.HelmPackageManager
}

// NewHandler creates a handler to manage endpoint group operations.
func NewHandler(bouncer requestBouncer, dataStore portainer.DataStore, helmPackageManager libhelm.HelmPackageManager, kubeConfigService kubernetes.KubeConfigService) *Handler {
	h := &Handler{
		Router:             mux.NewRouter(),
		requestBouncer:     bouncer,
		dataStore:          dataStore,
		helmPackageManager: helmPackageManager,
		kubeConfigService:  kubeConfigService,
	}

	// `helm list -o json`
	h.Handle("/{id}/kubernetes/helm",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.helmList))).Methods(http.MethodGet)

	// `helm delete RELEASE_NAME`
	h.Handle("/{id}/kubernetes/helm/{release}",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.helmDelete))).Methods(http.MethodDelete)

	// `helm install [NAME] [CHART] flags`
	h.Handle("/{id}/kubernetes/helm",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.helmInstall))).Methods(http.MethodPost)

	return h
}

// NewTemplateHandler creates a template handler to manage endpoint group operations.
func NewTemplateHandler(bouncer requestBouncer, dataStore portainer.DataStore, helmPackageManager libhelm.HelmPackageManager) *Handler {
	h := &Handler{
		Router:             mux.NewRouter(),
		dataStore:          dataStore,
		helmPackageManager: helmPackageManager,
		requestBouncer:     bouncer,
	}
	// `helm search [COMMAND] [CHART] flags`
	h.Handle("/templates/helm",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.helmRepoSearch))).Methods(http.MethodGet)

	// `helm show [COMMAND] [CHART] flags`
	h.Handle("/templates/helm/{chart}/{command:chart|values|readme}",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.helmShow))).Methods(http.MethodGet)

	return h
}

// getEndpoint returns the portainer.Endpoint for the request
func (handler *Handler) getEndpoint(r *http.Request) (*portainer.Endpoint, *httperror.HandlerError) {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return nil, &httperror.HandlerError{http.StatusBadRequest, "Invalid endpoint identifier route variable", err}
	}

	endpoint, err := handler.dataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err == bolterrors.ErrObjectNotFound {
		return nil, &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint with the specified identifier inside the database", err}
	} else if err != nil {
		return nil, &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint with the specified identifier inside the database", err}
	}

	return endpoint, nil
}

// getHelmClusterAccess obtains the core k8s cluster access details from request.
// The cluster access includes the cluster server url, the user's bearer token and the tls certificate.
// The cluster access is passed in as kube config CLI params to helm binary.
func (handler *Handler) getHelmClusterAccess(r *http.Request) (*options.KubernetesClusterAccess, *httperror.HandlerError) {
	endpoint, httperr := handler.getEndpoint(r)
	if httperr != nil {
		return nil, httperr
	}

	bearerToken, err := security.ExtractBearerToken(r)
	if err != nil {
		return nil, &httperror.HandlerError{http.StatusUnauthorized, "Unauthorized", err}
	}

	clusterAccess := handler.kubeConfigService.GetKubeConfigInternal(endpoint.ID, bearerToken)
	return &options.KubernetesClusterAccess{
		ClusterServerURL:         clusterAccess.ClusterServerURL,
		CertificateAuthorityFile: clusterAccess.CertificateAuthorityFile,
		AuthToken:                clusterAccess.AuthToken,
	}, nil
}
