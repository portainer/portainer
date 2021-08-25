package helm

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/portainer/libhelm"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	portainer "github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"
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

	// `helm install [NAME] [CHART] flags`
	h.Handle("/{id}/kubernetes/helm",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.helmInstall))).Methods(http.MethodPost)

	return h
}

// NewTemplateHandler creates a template handler to manage endpoint group operations.
func NewTemplateHandler(bouncer requestBouncer, helmPackageManager libhelm.HelmPackageManager) *Handler {
	h := &Handler{
		Router:             mux.NewRouter(),
		helmPackageManager: helmPackageManager,
		requestBouncer:     bouncer,
	}

	h.Handle("/templates/helm",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.helmRepoSearch))).Methods(http.MethodGet)

	// helm show [COMMAND] [CHART] [REPO] flags
	h.Handle("/templates/helm/{command:chart|values|readme}",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.helmShow))).Methods(http.MethodGet)

	return h
}

// GetEndpoint returns the portainer.Endpoint for the request
func (handler *Handler) GetEndpoint(r *http.Request) (*portainer.Endpoint, *httperror.HandlerError) {
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
