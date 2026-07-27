package endpointgroups

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/set"
	endpointutils "github.com/portainer/portainer/pkg/endpoints"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

func computeGroupSizeInfo(endpointGroups []portainer.EndpointGroup, endpoints []portainer.Endpoint) (map[portainer.EndpointGroupID]int, map[portainer.EndpointGroupID]EndpointGroupTypeInfo) {
	groupSet := set.Set[portainer.EndpointGroupID]{}
	for i := range endpointGroups {
		groupSet[endpointGroups[i].ID] = true
	}

	countMap := make(map[portainer.EndpointGroupID]int)
	typeInfoMap := make(map[portainer.EndpointGroupID]EndpointGroupTypeInfo)

	for _, endpoint := range endpoints {
		if _, ok := groupSet[endpoint.GroupID]; !ok {
			continue
		}
		countMap[endpoint.GroupID]++

		typeInfo := typeInfoMap[endpoint.GroupID]
		if endpointutils.IsKubernetesEndpoint(&endpoint) {
			typeInfo.Kubernetes++
		} else if endpoint.ContainerEngine == portainer.ContainerEnginePodman {
			typeInfo.Podman++
		} else {
			typeInfo.Docker++
		}
		typeInfoMap[endpoint.GroupID] = typeInfo
	}

	for groupID, typeInfo := range typeInfoMap {
		var bits int
		if typeInfo.Docker > 0 {
			bits |= 1
		}
		if typeInfo.Kubernetes > 0 {
			bits |= 2
		}
		if typeInfo.Podman > 0 {
			bits |= 4
		}
		typeInfo.Mixed = bits&(bits-1) != 0
		typeInfoMap[groupID] = typeInfo
	}

	return countMap, typeInfoMap
}

type EndpointGroupTypeInfo struct {
	Docker     int  `json:"Docker" validate:"required"`
	Kubernetes int  `json:"Kubernetes" validate:"required"`
	Podman     int  `json:"Podman" validate:"required"`
	Mixed      bool `json:"Mixed" validate:"required"`
}

type EndpointGroupResponse struct {
	portainer.EndpointGroup
	Total    int                   `json:"Total,omitzero"`
	TypeInfo EndpointGroupTypeInfo `json:"TypeInfo,omitzero"`
}

// @id EndpointGroupList
// @summary List Environment(Endpoint) groups
// @description List all environment(endpoint) groups based on the current user authorizations. Will
// @description return all environment(endpoint) groups if using an administrator account otherwise it will
// @description only return authorized environment(endpoint) groups.
// @description **Access policy**: restricted
// @tags endpoint_groups
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param size query boolean false "If true, each environment(endpoint) group will include the number of environments(endpoints) associated to it and breakdown by type"
// @success 200 {array} EndpointGroupResponse "Environment(Endpoint) group"
// @failure 500 "Server error"
// @router /endpoint_groups [get]
func (handler *Handler) endpointGroupList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	includeSize, err := request.RetrieveBooleanQueryParameter(r, "size", true)
	if err != nil {
		return httperror.BadRequest("Invalid query parameter: size", err)
	}

	var endpoints []portainer.Endpoint
	var endpointGroups []portainer.EndpointGroup
	var handlerErr *httperror.HandlerError
	if err := handler.DataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
		var txErr error
		endpointGroups, txErr = tx.EndpointGroup().ReadAll()
		if txErr != nil {
			handlerErr = httperror.InternalServerError("Unable to retrieve environment groups from the database", txErr)
			return handlerErr
		}

		if includeSize {
			endpoints, txErr = tx.Endpoint().Endpoints()
			if txErr != nil {
				handlerErr = httperror.InternalServerError("Unable to retrieve endpoints from the database", txErr)
				return handlerErr
			}
		}

		return nil
	}); err != nil {
		if handlerErr != nil {
			return handlerErr
		}
		return httperror.InternalServerError("Unable to retrieve data from the database", err)
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	endpointGroups = security.FilterEndpointGroups(endpointGroups, securityContext)

	if len(endpointGroups) == 0 {
		return response.JSON(w, []portainer.EndpointGroup{})
	}

	var endpointGroupCountMap map[portainer.EndpointGroupID]int
	var endpointGroupTypeInfoMap map[portainer.EndpointGroupID]EndpointGroupTypeInfo
	if includeSize {
		endpointGroupCountMap, endpointGroupTypeInfoMap = computeGroupSizeInfo(endpointGroups, endpoints)
	}

	endpointGroupsResponse := make([]EndpointGroupResponse, len(endpointGroups))
	for i := range endpointGroups {
		groupID := endpointGroups[i].ID

		endpointGroupsResponse[i] = EndpointGroupResponse{
			EndpointGroup: endpointGroups[i],
		}

		if includeSize {
			endpointGroupsResponse[i].Total = endpointGroupCountMap[groupID]
			endpointGroupsResponse[i].TypeInfo = endpointGroupTypeInfoMap[groupID]
		}
	}

	return response.JSON(w, endpointGroupsResponse)
}
