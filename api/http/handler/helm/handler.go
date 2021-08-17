package helm

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	portainer "github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"
	"github.com/portainer/portainer/api/exec/helm"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
)

const (
	handlerActivityContext = "Kubernetes"
)

// Handler is the HTTP handler used to handle endpoint group operations.
type Handler struct {
	*mux.Router
	requestBouncer     *security.RequestBouncer
	DataStore          portainer.DataStore
	HelmPackageManager helm.HelmPackageManager
}

// NewHandler creates a handler to manage endpoint group operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router:         mux.NewRouter(),
		requestBouncer: bouncer,
	}

	// `helm list -o json`
	h.Handle("/{id}/kubernetes/helm",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.helmList))).Methods(http.MethodGet)

	// `helm get manifest RELEASE_NAME`
	h.Handle("/{id}/kubernetes/helm/{release}",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.helmGet))).Methods(http.MethodGet)

	// `helm delete RELEASE_NAME`
	h.Handle("/{id}/kubernetes/helm/{release}",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.helmDelete))).Methods(http.MethodDelete)

	// `helm install [NAME] [CHART] flags`
	h.Handle("/{id}/kubernetes/helm",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.helmInstall))).Methods(http.MethodPost)

	return h
}

// NewTemplateHandler creates a template handler to manage endpoint group operations.
func NewTemplateHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router:         mux.NewRouter(),
		requestBouncer: bouncer,
	}
	// `helm search [COMMAND] [CHART] flags`
	h.Handle("/templates/helm",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.helmRepoSearch))).Methods(http.MethodGet)

	// `helm show [COMMAND] [CHART] flags`
	h.Handle("/templates/helm/{chart}/{command:chart|values|readme}",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.helmShow))).Methods(http.MethodGet)

	return h
}

// GetEndpoint returns the portainer.Endpoint for the request
func (handler *Handler) GetEndpoint(r *http.Request) (*portainer.Endpoint, *httperror.HandlerError) {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return nil, &httperror.HandlerError{http.StatusBadRequest, "Invalid endpoint identifier route variable", err}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err == bolterrors.ErrObjectNotFound {
		return nil, &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint with the specified identifier inside the database", err}
	} else if err != nil {
		return nil, &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint with the specified identifier inside the database", err}
	}

	return endpoint, nil
}

// getProxyUrl generates portainer proxy url which acts as proxy to k8s api server
func getProxyUrl(r *http.Request, endpointID portainer.EndpointID) string {
	return fmt.Sprintf("https://%s/api/endpoints/%d/kubernetes", r.Host, endpointID)
}

// extractBearerToken extracts user's portainer bearer token from request auth header
func extractBearerToken(r *http.Request) (string, error) {
	token := ""
	tokens := r.Header["Authorization"]
	if len(tokens) >= 1 {
		token = tokens[0]
		token = strings.TrimPrefix(token, "Bearer ")
	}
	if token == "" {
		return "", httperrors.ErrUnauthorized
	}
	return token, nil
}
