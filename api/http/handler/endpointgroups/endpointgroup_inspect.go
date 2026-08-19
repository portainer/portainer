package endpointgroups

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @summary Inspect an Environment(Endpoint) group
// @description Retrieve details abont an environment(endpoint) group.
// @description **Access policy**: administrator
// @tags endpoint_groups
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment(Endpoint) group identifier"
// @param size query boolean false "If true, include the number of environments and breakdown by type"
// @success 200 {object} EndpointGroupResponse "Success"
// @failure 400 "Invalid request"
// @failure 404 "EndpointGroup not found"
// @failure 500 "Server error"
// @router /endpoint_groups/{id} [get]
func (handler *Handler) endpointGroupInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointGroupID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid environment group identifier route variable", err)
	}

	includeSize, err := request.RetrieveBooleanQueryParameter(r, "size", true)
	if err != nil {
		return httperror.BadRequest("Invalid query parameter: size", err)
	}

	groupID := portainer.EndpointGroupID(endpointGroupID)

	var endpointGroup *portainer.EndpointGroup
	var endpoints []portainer.Endpoint

	if err := handler.DataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		endpointGroup, err = tx.EndpointGroup().Read(groupID)
		if err != nil {
			return err
		}
		if includeSize {
			endpoints, err = tx.Endpoint().Endpoints()
		}
		return err
	}); err != nil {
		if handler.DataStore.IsErrObjectNotFound(err) {
			return httperror.NotFound("Unable to find an environment group with the specified identifier inside the database", err)
		}
		return httperror.InternalServerError("Unable to retrieve environment group details", err)
	}

	resp := EndpointGroupResponse{
		EndpointGroup: *endpointGroup,
	}

	if includeSize {
		countMap, typeInfoMap := computeGroupSizeInfo([]portainer.EndpointGroup{*endpointGroup}, endpoints)
		resp.Total = countMap[groupID]
		resp.TypeInfo = typeInfoMap[groupID]
	}

	return response.JSON(w, resp)
}
