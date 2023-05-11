package edgestacks

import (
	"net/http"
	"strconv"

	"github.com/pkg/errors"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/internal/edge"
	"github.com/portainer/portainer/api/internal/set"
	"github.com/portainer/portainer/pkg/featureflags"

	"github.com/rs/zerolog/log"
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
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	var stack *portainer.EdgeStack
	if featureflags.IsEnabled(portainer.FeatureNoTx) {
		stack, err = handler.updateEdgeStack(handler.DataStore, portainer.EdgeStackID(stackID), payload)
	} else {
		err = handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
			stack, err = handler.updateEdgeStack(tx, portainer.EdgeStackID(stackID), payload)
			return err
		})
	}

	if err != nil {
		var httpErr *httperror.HandlerError
		if errors.As(err, &httpErr) {
			return httpErr
		}

		return httperror.InternalServerError("Unexpected error", err)
	}

	return response.JSON(w, stack)
}

func (handler *Handler) updateEdgeStack(tx dataservices.DataStoreTx, stackID portainer.EdgeStackID, payload updateEdgeStackPayload) (*portainer.EdgeStack, error) {
	stack, err := tx.EdgeStack().EdgeStack(portainer.EdgeStackID(stackID))
	if err != nil {
		return nil, handler.handlerDBErr(err, "Unable to find a stack with the specified identifier inside the database")
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

	entryPoint := stack.EntryPoint
	manifestPath := stack.ManifestPath
	deploymentType := stack.DeploymentType

	if deploymentType != payload.DeploymentType {
		// deployment type was changed - need to delete the old file
		err = handler.FileService.RemoveDirectory(stack.ProjectPath)
		if err != nil {
			log.Warn().Err(err).Msg("Unable to clear old files")
		}

		entryPoint = ""
		manifestPath = ""
		deploymentType = payload.DeploymentType
	}

	stackFolder := strconv.Itoa(int(stack.ID))

	hasWrongType, err := hasWrongEnvironmentType(tx.Endpoint(), relatedEndpointIds, payload.DeploymentType)
	if err != nil {
		return nil, httperror.BadRequest("unable to check for existence of non fitting environments: %w", err)
	}
	if hasWrongType {
		return nil, httperror.BadRequest("edge stack with config do not match the environment type", nil)
	}

	if payload.DeploymentType == portainer.EdgeStackDeploymentCompose {
		if entryPoint == "" {
			entryPoint = filesystem.ComposeFileDefaultName
		}

		_, err := handler.FileService.StoreEdgeStackFileFromBytes(stackFolder, entryPoint, []byte(payload.StackFileContent))
		if err != nil {
			return nil, httperror.InternalServerError("Unable to persist updated Compose file on disk", err)
		}

		tempManifestPath, err := handler.convertAndStoreKubeManifestIfNeeded(stackFolder, stack.ProjectPath, entryPoint, relatedEndpointIds)
		if err != nil {
			return nil, httperror.InternalServerError("Unable to convert and persist updated Kubernetes manifest file on disk", err)
		}

		manifestPath = tempManifestPath
	}

	if deploymentType == portainer.EdgeStackDeploymentKubernetes {
		if manifestPath == "" {
			manifestPath = filesystem.ManifestFileDefaultName
		}

		_, err = handler.FileService.StoreEdgeStackFileFromBytes(stackFolder, manifestPath, []byte(payload.StackFileContent))
		if err != nil {
			return nil, httperror.InternalServerError("Unable to persist updated Kubernetes manifest file on disk", err)
		}
	}

	err = tx.EdgeStack().UpdateEdgeStackFunc(stack.ID, func(edgeStack *portainer.EdgeStack) {
		edgeStack.NumDeployments = len(relatedEndpointIds)
		if payload.UpdateVersion {
			edgeStack.Status = make(map[portainer.EndpointID]portainer.EdgeStackStatus)
			edgeStack.Version++
		}

		edgeStack.UseManifestNamespaces = payload.UseManifestNamespaces

		edgeStack.DeploymentType = deploymentType
		edgeStack.EntryPoint = entryPoint
		edgeStack.ManifestPath = manifestPath

		edgeStack.EdgeGroups = groupsIds
	})
	if err != nil {
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
			return nil, nil, errors.WithMessage(err, "Unable to find environment relation in database")
		}

		delete(relation.EdgeStacks, edgeStackID)

		err = tx.EndpointRelation().UpdateEndpointRelation(endpointID, relation)
		if err != nil {
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
		if err != nil {
			return nil, nil, errors.WithMessage(err, "Unable to find environment relation in database")
		}

		relation.EdgeStacks[edgeStackID] = true

		err = tx.EndpointRelation().UpdateEndpointRelation(endpointID, relation)
		if err != nil {
			return nil, nil, errors.WithMessage(err, "Unable to persist environment relation in database")
		}
	}

	return newRelatedEnvironmentIDs, endpointsToAdd, nil
}
