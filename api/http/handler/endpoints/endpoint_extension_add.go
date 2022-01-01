package endpoints

// TODO: legacy extension management

import (
	"errors"
	"net/http"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
)

type endpointExtensionAddPayload struct {
	Type int
	URL  string
}

func (payload *endpointExtensionAddPayload) Validate(r *http.Request) error {
	if payload.Type != 1 {
		return errors.New("Invalid type value. Value must be one of: 1 (Storidge)")
	}
	if payload.Type == 1 && govalidator.IsNull(payload.URL) {
		return errors.New("Invalid extension URL")
	}
	return nil
}

// @id endpointExtensionAdd
// @tags endpoints
// @deprecated
// @param id path int true "Environment(Endpoint) identifier"
// @success 204 "Success"
// @router /endpoints/{id}/extensions [post]
func (handler *Handler) endpointExtensionAdd(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid environment identifier route variable", err}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an environment with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an environment with the specified identifier inside the database", err}
	}

	var payload endpointExtensionAddPayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	extensionType := portainer.EndpointExtensionType(payload.Type)

	var extension *portainer.EndpointExtension
	for idx := range endpoint.Extensions {
		if endpoint.Extensions[idx].Type == extensionType {
			extension = &endpoint.Extensions[idx]
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

	err = handler.DataStore.Endpoint().UpdateEndpoint(endpoint.ID, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist environment changes inside the database", err}
	}

	return response.JSON(w, extension)
}
