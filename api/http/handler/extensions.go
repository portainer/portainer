package handler

import (
	"encoding/json"
	"strconv"

	"github.com/asaskevich/govalidator"
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/proxy"
	"github.com/portainer/portainer/http/security"

	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
)

// ExtensionHandler represents an HTTP API handler for managing Settings.
type ExtensionHandler struct {
	*mux.Router
	Logger          *log.Logger
	EndpointService portainer.EndpointService
	ProxyManager    *proxy.Manager
}

// NewExtensionHandler returns a new instance of ExtensionHandler.
func NewExtensionHandler(bouncer *security.RequestBouncer) *ExtensionHandler {
	h := &ExtensionHandler{
		Router: mux.NewRouter(),
		Logger: log.New(os.Stderr, "", log.LstdFlags),
	}
	h.Handle("/{endpointId}/extensions",
		bouncer.AdministratorAccess(http.HandlerFunc(h.handlePostExtensions))).Methods(http.MethodPost)
	return h
}

type (
	postExtensionRequest struct {
		Type int    `valid:"required"`
		URL  string `valid:"required"`
	}
)

func (handler *ExtensionHandler) handlePostExtensions(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["endpointId"])
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}
	endpointID := portainer.EndpointID(id)

	endpoint, err := handler.EndpointService.Endpoint(endpointID)
	if err == portainer.ErrEndpointNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	var req postExtensionRequest
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err = govalidator.ValidateStruct(req)
	if err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	extensionType := portainer.EndpointExtensionType(req.Type)

	for _, extension := range endpoint.Extensions {
		if extension.Type == extensionType {
			httperror.WriteErrorResponse(w, portainer.ErrEndpointExtensionAlreadyAssociated, http.StatusConflict, handler.Logger)
			return
		}
	}

	extension := portainer.EndpointExtension{
		Type: extensionType,
		URL:  req.URL,
	}

	endpoint.Extensions = append(endpoint.Extensions, extension)

	err = handler.EndpointService.UpdateEndpoint(endpoint.ID, endpoint)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	encodeJSON(w, extension, handler.Logger)
}
