package edgegroups

import (
	"fmt"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/slices"
	"github.com/portainer/portainer/pkg/featureflags"
)

type decoratedEdgeGroup struct {
	portainer.EdgeGroup
	HasEdgeStack  bool `json:"HasEdgeStack"`
	HasEdgeJob    bool `json:"HasEdgeJob"`
	EndpointTypes []portainer.EndpointType
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

	if featureflags.IsEnabled(portainer.FeatureNoTx) {
		decoratedEdgeGroups, err = getEdgeGroupList(handler.DataStore)
	} else {
		err = handler.DataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
			decoratedEdgeGroups, err = getEdgeGroupList(tx)
			return err
		})
	}

	return txResponse(w, decoratedEdgeGroups, err)
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
			if slices.Contains(edgeJob.EdgeGroups, portainer.EdgeGroupID(orgEdgeGroup.ID)) {
				usedByEdgeJob = true
				break
			}
		}

		edgeGroup := decoratedEdgeGroup{
			EdgeGroup:     orgEdgeGroup,
			EndpointTypes: []portainer.EndpointType{},
		}
		if edgeGroup.Dynamic {
			endpointIDs, err := GetEndpointsByTags(tx, edgeGroup.TagIDs, edgeGroup.PartialMatch)
			if err != nil {
				return nil, httperror.InternalServerError("Unable to retrieve environments and environment groups for Edge group", err)
			}

			edgeGroup.Endpoints = endpointIDs
		}

		endpointTypes, err := getEndpointTypes(tx, edgeGroup.Endpoints)
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

func getEndpointTypes(tx dataservices.DataStoreTx, endpointIds []portainer.EndpointID) ([]portainer.EndpointType, error) {
	typeSet := map[portainer.EndpointType]bool{}
	for _, endpointID := range endpointIds {
		endpoint, err := tx.Endpoint().Endpoint(endpointID)
		if err != nil {
			return nil, fmt.Errorf("failed fetching environment: %w", err)
		}

		typeSet[endpoint.Type] = true
	}

	endpointTypes := make([]portainer.EndpointType, 0, len(typeSet))
	for endpointType := range typeSet {
		endpointTypes = append(endpointTypes, endpointType)
	}

	return endpointTypes, nil
}
