package edgegroups

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/pkg/featureflags"
)

// @id EdgeGroupInspect
// @summary Inspects an EdgeGroup
// @description **Access policy**: administrator
// @tags edge_groups
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param id path int true "EdgeGroup Id"
// @success 200 {object} portainer.EdgeGroup
// @failure 503 "Edge compute features are disabled"
// @failure 500
// @router /edge_groups/{id} [get]
func (handler *Handler) edgeGroupInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	edgeGroupID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid Edge group identifier route variable", err)
	}

	var edgeGroup *portainer.EdgeGroup
	if featureflags.IsEnabled(portainer.FeatureNoTx) {
		edgeGroup, err = getEdgeGroup(handler.DataStore, portainer.EdgeGroupID(edgeGroupID))
	} else {
		err = handler.DataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
			edgeGroup, err = getEdgeGroup(tx, portainer.EdgeGroupID(edgeGroupID))
			return err
		})
	}

	return txResponse(w, edgeGroup, err)
}

func getEdgeGroup(tx dataservices.DataStoreTx, ID portainer.EdgeGroupID) (*portainer.EdgeGroup, error) {
	edgeGroup, err := tx.EdgeGroup().Read(ID)
	if tx.IsErrObjectNotFound(err) {
		return nil, httperror.NotFound("Unable to find an Edge group with the specified identifier inside the database", err)
	} else if err != nil {
		return nil, httperror.InternalServerError("Unable to find an Edge group with the specified identifier inside the database", err)
	}

	if edgeGroup.Dynamic {
		endpoints, err := GetEndpointsByTags(tx, edgeGroup.TagIDs, edgeGroup.PartialMatch)
		if err != nil {
			return nil, httperror.InternalServerError("Unable to retrieve environments and environment groups for Edge group", err)
		}

		edgeGroup.Endpoints = endpoints
	}

	return edgeGroup, err
}
