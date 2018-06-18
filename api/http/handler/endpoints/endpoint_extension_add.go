package endpoints

import (
	"net/http"

	"github.com/asaskevich/govalidator"
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/request"
	"github.com/portainer/portainer/http/response"
)

type endpointExtensionAddPayload struct {
	Type int
	URL  string
}

func (payload *endpointExtensionAddPayload) Validate(r *http.Request) error {
	if payload.Type != 1 {
		return portainer.Error("Invalid type value. Value must be one of: 1 (Storidge)")
	}
	if payload.Type == 1 && govalidator.IsNull(payload.URL) {
		return portainer.Error("Invalid extension URL")
	}
	return nil
}

// POST request on /api/endpoints/:id/extensions
func (handler *Handler) endpointExtensionAdd(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid endpoint identifier route variable", err}
	}

	endpoint, err := handler.EndpointService.Endpoint(portainer.EndpointID(endpointID))
	if err == portainer.ErrEndpointNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint with the specified identifier inside the database", err}
	}

	var payload endpointExtensionAddPayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	extensionType := portainer.EndpointExtensionType(payload.Type)

	var extension *portainer.EndpointExtension
	for _, ext := range endpoint.Extensions {
		if ext.Type == extensionType {
			extension = &ext
		}
	}

	if extension != nil {
		extension.URL = payload.URL
	} else {
		extension = &portainer.EndpointExtension{
			Type: extensionType,
			URL:  payload.URL,
		}
		endpoint.Extensions = append(endpoint.Extensions, *extension)
	}

	err = handler.EndpointService.UpdateEndpoint(endpoint.ID, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist endpoint changes inside the database", err}
	}

	return response.JSON(w, extension)
}
