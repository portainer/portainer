package edgegroups

import (
	"fmt"
	"net/http"
	"slices"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/roar"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

type shadowedEdgeGroup struct {
	portainer.EdgeGroup
	EndpointIds int `json:"EndpointIds,omitempty"` // Shadow to avoid exposing in the API
}

type decoratedEdgeGroup struct {
	shadowedEdgeGroup
	HasEdgeStack     bool `json:"HasEdgeStack"`
	HasEdgeJob       bool `json:"HasEdgeJob"`
	EndpointTypes    []portainer.EndpointType
	TrustedEndpoints []portainer.EndpointID `json:"TrustedEndpoints"`
}

// @id EdgeGroupList
// @summary list EdgeGroups
// @description **Access policy**: administrator
// @tags edge_groups
// @security ApiKeyAuth
// @security jwt
// @produce json
// @success 200 {array} decoratedEdgeGroup "EdgeGroups"
// @failure 500
// @failure 503 "Edge compute features are disabled"
// @router /edge_groups [get]
func (handler *Handler) edgeGroupList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var decoratedEdgeGroups []decoratedEdgeGroup
	var err error

	err = handler.DataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
		decoratedEdgeGroups, err = getEdgeGroupList(tx)
		return err
	})

	return response.TxResponse(w, decoratedEdgeGroups, err)
}

func getEdgeGroupList(tx dataservices.DataStoreTx) ([]decoratedEdgeGroup, error) {
	edgeGroups, err := tx.EdgeGroup().ReadAll()
	if err != nil {
		return nil, httperror.InternalServerError("Unable to retrieve Edge groups from the database", err)
	}

	edgeStacks, err := tx.EdgeStack().EdgeStacks()
	if err != nil {
		return nil, httperror.InternalServerError("Unable to retrieve Edge stacks from the database", err)
	}

	usedEdgeGroups := make(map[portainer.EdgeGroupID]bool)

	for _, stack := range edgeStacks {
		for _, groupID := range stack.EdgeGroups {
			usedEdgeGroups[groupID] = true
		}
	}

	edgeJobs, err := tx.EdgeJob().ReadAll()
	if err != nil {
		return nil, httperror.InternalServerError("Unable to retrieve Edge jobs from the database", err)
	}

	decoratedEdgeGroups := []decoratedEdgeGroup{}
	for _, orgEdgeGroup := range edgeGroups {
		usedByEdgeJob := false
		for _, edgeJob := range edgeJobs {
			if slices.Contains(edgeJob.EdgeGroups, orgEdgeGroup.ID) {
				usedByEdgeJob = true
				break
			}
		}

		edgeGroup := decoratedEdgeGroup{
			shadowedEdgeGroup: shadowedEdgeGroup{EdgeGroup: orgEdgeGroup},
			EndpointTypes:     []portainer.EndpointType{},
		}
		if edgeGroup.Dynamic {
			endpointIDs, err := GetEndpointsByTags(tx, edgeGroup.TagIDs, edgeGroup.PartialMatch)
			if err != nil {
				return nil, httperror.InternalServerError("Unable to retrieve environments and environment groups for Edge group", err)
			}

			edgeGroup.Endpoints = endpointIDs
			edgeGroup.TrustedEndpoints = endpointIDs
		} else {
			trustedEndpoints, err := getTrustedEndpoints(tx, edgeGroup.EndpointIDs)
			if err != nil {
				return nil, httperror.InternalServerError("Unable to retrieve environments for Edge group", err)
			}

			edgeGroup.Endpoints = edgeGroup.EndpointIDs.ToSlice()
			edgeGroup.TrustedEndpoints = trustedEndpoints
		}

		endpointTypes, err := getEndpointTypes(tx, edgeGroup.EndpointIDs)
		if err != nil {
			return nil, httperror.InternalServerError("Unable to retrieve environment types for Edge group", err)
		}

		edgeGroup.EndpointTypes = endpointTypes
		edgeGroup.HasEdgeStack = usedEdgeGroups[edgeGroup.ID]
		edgeGroup.HasEdgeJob = usedByEdgeJob

		decoratedEdgeGroups = append(decoratedEdgeGroups, edgeGroup)
	}

	return decoratedEdgeGroups, nil
}

func getEndpointTypes(tx dataservices.DataStoreTx, endpointIds roar.Roar[portainer.EndpointID]) ([]portainer.EndpointType, error) {
	var innerErr error

	typeSet := map[portainer.EndpointType]bool{}

	endpointIds.Iterate(func(endpointID portainer.EndpointID) bool {
		endpoint, err := tx.Endpoint().Endpoint(endpointID)
		if err != nil {
			innerErr = fmt.Errorf("failed fetching environment: %w", err)

			return false
		}

		typeSet[endpoint.Type] = true

		return true
	})

	if innerErr != nil {
		return nil, innerErr
	}

	endpointTypes := make([]portainer.EndpointType, 0, len(typeSet))
	for endpointType := range typeSet {
		endpointTypes = append(endpointTypes, endpointType)
	}

	return endpointTypes, nil
}
