package endpointgroups

import (
	"errors"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/pkg/featureflags"
)

// @id EndpointGroupDeleteEndpoint
// @summary Removes environment(endpoint) from an environment(endpoint) group
// @description **Access policy**: administrator
// @tags endpoint_groups
// @security ApiKeyAuth
// @security jwt
// @param id path int true "EndpointGroup identifier"
// @param endpointId path int true "Environment(Endpoint) identifier"
// @success 204 "Success"
// @failure 400 "Invalid request"
// @failure 404 "EndpointGroup not found"
// @failure 500 "Server error"
// @router /endpoint_groups/{id}/endpoints/{endpointId} [delete]
func (handler *Handler) endpointGroupDeleteEndpoint(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointGroupID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid environment group identifier route variable", err)
	}

	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "endpointId")
	if err != nil {
		return httperror.BadRequest("Invalid environment identifier route variable", err)
	}

	if featureflags.IsEnabled(portainer.FeatureNoTx) {
		err = handler.removeEndpoint(handler.DataStore, portainer.EndpointGroupID(endpointGroupID), portainer.EndpointID(endpointID))
	} else {
		err = handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
			return handler.removeEndpoint(tx, portainer.EndpointGroupID(endpointGroupID), portainer.EndpointID(endpointID))
		})
	}

	if err != nil {
		var httpErr *httperror.HandlerError
		if errors.As(err, &httpErr) {
			return httpErr
		}

		return httperror.InternalServerError("Unexpected error", err)
	}

	return response.Empty(w)
}

func (handler *Handler) removeEndpoint(tx dataservices.DataStoreTx, endpointGroupID portainer.EndpointGroupID, endpointID portainer.EndpointID) error {
	_, err := tx.EndpointGroup().Read(portainer.EndpointGroupID(endpointGroupID))
	if tx.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find an environment group with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find an environment group with the specified identifier inside the database", err)
	}

	endpoint, err := tx.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if tx.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find an environment with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find an environment with the specified identifier inside the database", err)
	}

	endpoint.GroupID = portainer.EndpointGroupID(1)

	err = tx.Endpoint().UpdateEndpoint(endpoint.ID, endpoint)
	if err != nil {
		return httperror.InternalServerError("Unable to persist environment changes inside the database", err)
	}

	err = handler.updateEndpointRelations(tx, endpoint, nil)
	if err != nil {
		return httperror.InternalServerError("Unable to persist environment relations changes inside the database", err)
	}

	return nil
}
