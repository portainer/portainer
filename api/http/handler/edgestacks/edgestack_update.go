package edgestacks

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/edge"
	"github.com/portainer/portainer/api/set"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"

	"github.com/pkg/errors"
)

type updateEdgeStackPayload struct {
	StackFileContent string
	UpdateVersion    bool
	EdgeGroups       []portainer.EdgeGroupID
	DeploymentType   portainer.EdgeStackDeploymentType
	// Uses the manifest's namespaces instead of the default one
	UseManifestNamespaces bool
}

func (payload *updateEdgeStackPayload) Validate(r *http.Request) error {
	if payload.StackFileContent == "" {
		return errors.New("invalid stack file content")
	}

	if len(payload.EdgeGroups) == 0 {
		return errors.New("edge Groups are mandatory for an Edge stack")
	}

	return nil
}

// @id EdgeStackUpdate
// @summary Update an EdgeStack
// @description **Access policy**: administrator
// @tags edge_stacks
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "EdgeStack Id"
// @param body body updateEdgeStackPayload true "EdgeStack data"
// @success 200 {object} portainer.EdgeStack
// @failure 500
// @failure 400
// @failure 503 "Edge compute features are disabled"
// @router /edge_stacks/{id} [put]
func (handler *Handler) edgeStackUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	stackID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid stack identifier route variable", err)
	}

	var payload updateEdgeStackPayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	var stack *portainer.EdgeStack
	if err := handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		stack, err = handler.updateEdgeStack(tx, portainer.EdgeStackID(stackID), payload)
		return err
	}); err != nil {
		var httpErr *httperror.HandlerError
		if errors.As(err, &httpErr) {
			return httpErr
		}

		return httperror.InternalServerError("Unexpected error", err)
	}

	return response.JSON(w, stack)
}

func (handler *Handler) updateEdgeStack(tx dataservices.DataStoreTx, stackID portainer.EdgeStackID, payload updateEdgeStackPayload) (*portainer.EdgeStack, error) {
	stack, err := tx.EdgeStack().EdgeStack(stackID)
	if err != nil {
		return nil, handlerDBErr(err, "Unable to find a stack with the specified identifier inside the database")
	}

	relationConfig, err := edge.FetchEndpointRelationsConfig(tx)
	if err != nil {
		return nil, httperror.InternalServerError("Unable to retrieve environments relations config from database", err)
	}

	relatedEndpointIds, err := edge.EdgeStackRelatedEndpoints(stack.EdgeGroups, relationConfig.Endpoints, relationConfig.EndpointGroups, relationConfig.EdgeGroups)
	if err != nil {
		return nil, httperror.InternalServerError("Unable to retrieve edge stack related environments from database", err)
	}

	groupsIds := stack.EdgeGroups
	if payload.EdgeGroups != nil {
		newRelated, _, err := handler.handleChangeEdgeGroups(tx, stack.ID, payload.EdgeGroups, relatedEndpointIds, relationConfig)
		if err != nil {
			return nil, httperror.InternalServerError("Unable to handle edge groups change", err)
		}

		groupsIds = payload.EdgeGroups
		relatedEndpointIds = newRelated

	}

	hasWrongType, err := hasWrongEnvironmentType(tx.Endpoint(), relatedEndpointIds, payload.DeploymentType)
	if err != nil {
		return nil, httperror.InternalServerError("unable to check for existence of non fitting environments: %w", err)
	}
	if hasWrongType {
		return nil, httperror.BadRequest("edge stack with config do not match the environment type", nil)
	}

	stack.NumDeployments = len(relatedEndpointIds)

	stack.UseManifestNamespaces = payload.UseManifestNamespaces

	stack.EdgeGroups = groupsIds

	if payload.UpdateVersion {
		if err := handler.updateStackVersion(stack, payload.DeploymentType, []byte(payload.StackFileContent), "", relatedEndpointIds); err != nil {
			return nil, httperror.InternalServerError("Unable to update stack version", err)
		}
	}

	if err := tx.EdgeStack().UpdateEdgeStack(stack.ID, stack); err != nil {
		return nil, httperror.InternalServerError("Unable to persist the stack changes inside the database", err)
	}

	return stack, nil
}

func (handler *Handler) handleChangeEdgeGroups(tx dataservices.DataStoreTx, edgeStackID portainer.EdgeStackID, newEdgeGroupsIDs []portainer.EdgeGroupID, oldRelatedEnvironmentIDs []portainer.EndpointID, relationConfig *edge.EndpointRelationsConfig) ([]portainer.EndpointID, set.Set[portainer.EndpointID], error) {
	newRelatedEnvironmentIDs, err := edge.EdgeStackRelatedEndpoints(newEdgeGroupsIDs, relationConfig.Endpoints, relationConfig.EndpointGroups, relationConfig.EdgeGroups)
	if err != nil {
		return nil, nil, errors.WithMessage(err, "Unable to retrieve edge stack related environments from database")
	}

	oldRelatedSet := set.ToSet(oldRelatedEnvironmentIDs)
	newRelatedSet := set.ToSet(newRelatedEnvironmentIDs)

	endpointsToRemove := set.Set[portainer.EndpointID]{}
	for endpointID := range oldRelatedSet {
		if !newRelatedSet[endpointID] {
			endpointsToRemove[endpointID] = true
		}
	}

	for endpointID := range endpointsToRemove {
		relation, err := tx.EndpointRelation().EndpointRelation(endpointID)
		if err != nil {
			if tx.IsErrObjectNotFound(err) {
				continue
			}
			return nil, nil, errors.WithMessage(err, "Unable to find environment relation in database")
		}

		delete(relation.EdgeStacks, edgeStackID)

		if err := tx.EndpointRelation().UpdateEndpointRelation(endpointID, relation); err != nil {
			return nil, nil, errors.WithMessage(err, "Unable to persist environment relation in database")
		}
	}

	endpointsToAdd := set.Set[portainer.EndpointID]{}
	for endpointID := range newRelatedSet {
		if !oldRelatedSet[endpointID] {
			endpointsToAdd[endpointID] = true
		}
	}

	for endpointID := range endpointsToAdd {
		relation, err := tx.EndpointRelation().EndpointRelation(endpointID)
		if err != nil && !tx.IsErrObjectNotFound(err) {
			return nil, nil, errors.WithMessage(err, "Unable to find environment relation in database")
		}

		if relation == nil {
			relation = &portainer.EndpointRelation{
				EndpointID: endpointID,
				EdgeStacks: map[portainer.EdgeStackID]bool{},
			}
		}
		relation.EdgeStacks[edgeStackID] = true

		if err := tx.EndpointRelation().UpdateEndpointRelation(endpointID, relation); err != nil {
			return nil, nil, errors.WithMessage(err, "Unable to persist environment relation in database")
		}
	}

	return newRelatedEnvironmentIDs, endpointsToAdd, nil
}
