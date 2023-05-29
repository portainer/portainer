package edgestacks

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/internal/edge"
	edgetypes "github.com/portainer/portainer/api/internal/edge/types"

	"github.com/pkg/errors"
)

// Service represents a service for managing edge stacks.
type Service struct {
	dataStore dataservices.DataStore
}

// NewService returns a new instance of a service.
func NewService(dataStore dataservices.DataStore) *Service {
	return &Service{
		dataStore: dataStore,
	}
}

// BuildEdgeStack builds the initial edge stack object
// PersistEdgeStack is required to be called after this to persist the edge stack
func (service *Service) BuildEdgeStack(
	tx dataservices.DataStoreTx,
	name string,
	deploymentType portainer.EdgeStackDeploymentType,
	edgeGroups []portainer.EdgeGroupID,
	registries []portainer.RegistryID,
	useManifestNamespaces bool,
) (*portainer.EdgeStack, error) {
	err := validateUniqueName(tx.EdgeStack().EdgeStacks, name)
	if err != nil {
		return nil, err
	}

	stackID := tx.EdgeStack().GetNextIdentifier()
	return &portainer.EdgeStack{
		ID:                    portainer.EdgeStackID(stackID),
		Name:                  name,
		DeploymentType:        deploymentType,
		CreationDate:          time.Now().Unix(),
		EdgeGroups:            edgeGroups,
		Status:                make(map[portainer.EndpointID]portainer.EdgeStackStatus),
		Version:               1,
		UseManifestNamespaces: useManifestNamespaces,
	}, nil
}

func validateUniqueName(edgeStacksGetter func() ([]portainer.EdgeStack, error), name string) error {
	edgeStacks, err := edgeStacksGetter()
	if err != nil {
		return err
	}

	for _, stack := range edgeStacks {
		if strings.EqualFold(stack.Name, name) {
			return httperrors.NewConflictError("Edge stack name must be unique")
		}
	}

	return nil
}

// PersistEdgeStack persists the edge stack in the database and its relations
func (service *Service) PersistEdgeStack(
	tx dataservices.DataStoreTx,
	stack *portainer.EdgeStack,
	storeManifest edgetypes.StoreManifestFunc) (*portainer.EdgeStack, error) {

	relationConfig, err := edge.FetchEndpointRelationsConfig(tx)

	if err != nil {
		return nil, fmt.Errorf("unable to find environment relations in database: %w", err)
	}

	relatedEndpointIds, err := edge.EdgeStackRelatedEndpoints(stack.EdgeGroups, relationConfig.Endpoints, relationConfig.EndpointGroups, relationConfig.EdgeGroups)
	if err != nil {
		if errors.Is(err, edge.ErrEdgeGroupNotFound) {
			return nil, httperrors.NewInvalidPayloadError(err.Error())
		}
		return nil, fmt.Errorf("unable to persist environment relation in database: %w", err)
	}

	stackFolder := strconv.Itoa(int(stack.ID))
	composePath, manifestPath, projectPath, err := storeManifest(stackFolder, relatedEndpointIds)
	if err != nil {
		return nil, fmt.Errorf("unable to store manifest: %w", err)
	}

	stack.ManifestPath = manifestPath
	stack.ProjectPath = projectPath
	stack.EntryPoint = composePath
	stack.NumDeployments = len(relatedEndpointIds)

	err = service.updateEndpointRelations(tx, stack.ID, relatedEndpointIds)
	if err != nil {
		return nil, fmt.Errorf("unable to update endpoint relations: %w", err)
	}

	err = tx.EdgeStack().Create(stack.ID, stack)
	if err != nil {
		return nil, err
	}

	return stack, nil
}

// updateEndpointRelations adds a relation between the Edge Stack to the related environments(endpoints)
func (service *Service) updateEndpointRelations(tx dataservices.DataStoreTx, edgeStackID portainer.EdgeStackID, relatedEndpointIds []portainer.EndpointID) error {
	endpointRelationService := tx.EndpointRelation()

	for _, endpointID := range relatedEndpointIds {
		relation, err := endpointRelationService.EndpointRelation(endpointID)
		if err != nil {
			return fmt.Errorf("unable to find endpoint relation in database: %w", err)
		}

		relation.EdgeStacks[edgeStackID] = true

		err = endpointRelationService.UpdateEndpointRelation(endpointID, relation)
		if err != nil {
			return fmt.Errorf("unable to persist endpoint relation in database: %w", err)
		}
	}

	return nil
}

// DeleteEdgeStack deletes the edge stack from the database and its relations
func (service *Service) DeleteEdgeStack(tx dataservices.DataStoreTx, edgeStackID portainer.EdgeStackID, relatedEdgeGroupsIds []portainer.EdgeGroupID) error {
	relationConfig, err := edge.FetchEndpointRelationsConfig(tx)
	if err != nil {
		return errors.WithMessage(err, "Unable to retrieve environments relations config from database")
	}

	relatedEndpointIds, err := edge.EdgeStackRelatedEndpoints(relatedEdgeGroupsIds, relationConfig.Endpoints, relationConfig.EndpointGroups, relationConfig.EdgeGroups)
	if err != nil {
		return errors.WithMessage(err, "Unable to retrieve edge stack related environments from database")
	}

	for _, endpointID := range relatedEndpointIds {
		relation, err := tx.EndpointRelation().EndpointRelation(endpointID)
		if err != nil {
			return errors.WithMessage(err, "Unable to find environment relation in database")
		}

		delete(relation.EdgeStacks, edgeStackID)

		err = tx.EndpointRelation().UpdateEndpointRelation(endpointID, relation)
		if err != nil {
			return errors.WithMessage(err, "Unable to persist environment relation in database")
		}
	}

	err = tx.EdgeStack().DeleteEdgeStack(portainer.EdgeStackID(edgeStackID))
	if err != nil {
		return errors.WithMessage(err, "Unable to remove the edge stack from the database")
	}

	return nil
}
