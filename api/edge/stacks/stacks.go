package stacks

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/edge"
)

type StoreManifestFunc func(stackFolder string, relatedEndpointIds []portainer.EndpointID) (composePath, manifestPath, projectPath string, err error)

// CreateEdgeStack creates a new Edge Stack and handles related creation tasks
func CreateEdgeStack(dataStore dataservices.DataStore, name string, deploymentType portainer.EdgeStackDeploymentType, edgeGroups []portainer.EdgeGroupID, storeManifest StoreManifestFunc) (*portainer.EdgeStack, error) {
	err := validateUniqueName(dataStore.EdgeStack(), name)
	if err != nil {
		return nil, err
	}

	stackID := dataStore.EdgeStack().GetNextIdentifier()
	stack := &portainer.EdgeStack{
		ID:             portainer.EdgeStackID(stackID),
		Name:           name,
		DeploymentType: deploymentType,
		CreationDate:   time.Now().Unix(),
		EdgeGroups:     edgeGroups,
		Status:         make(map[portainer.EndpointID]portainer.EdgeStackStatus),
		Version:        1,
	}

	relationConfig, err := FetchEndpointRelationsConfig(dataStore)
	if err != nil {
		return nil, errors.WithMessage(err, "unable to find environment relations in database")
	}

	relatedEndpointIds, err := edge.EdgeStackRelatedEndpoints(stack.EdgeGroups, relationConfig.Endpoints, relationConfig.EndpointGroups, relationConfig.EdgeGroups)
	if err != nil {
		return nil, errors.WithMessage(err, "unable to persist environment relation in database")
	}

	stackFolder := strconv.Itoa(int(stackID))
	composePath, manifestPath, projectPath, err := storeManifest(stackFolder, relatedEndpointIds)
	if err != nil {
		return nil, errors.WithMessage(err, "unable to store manifest")
	}

	stack.ManifestPath = manifestPath
	stack.ProjectPath = projectPath
	stack.EntryPoint = composePath

	err = updateEndpointRelations(dataStore.EndpointRelation(), stack.ID, relatedEndpointIds)
	if err != nil {
		return nil, fmt.Errorf("unable to update endpoint relations: %w", err)
	}

	err = dataStore.EdgeStack().Create(stack.ID, stack)
	if err != nil {
		return nil, err
	}

	return stack, nil
}

// updateEndpointRelations adds a relation between the Edge Stack to the related environments(endpoints)
func updateEndpointRelations(endpointRelationService dataservices.EndpointRelationService, edgeStackID portainer.EdgeStackID, relatedEndpointIds []portainer.EndpointID) error {
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

func validateUniqueName(edgeStackService dataservices.EdgeStackService, name string) error {
	edgeStacks, err := edgeStackService.EdgeStacks()
	if err != nil {
		return err
	}

	for _, stack := range edgeStacks {
		if strings.EqualFold(stack.Name, name) {
			return errors.New("edge stack name must be unique")
		}
	}
	return nil
}

type EndpointRelationsConfig struct {
	Endpoints      []portainer.Endpoint
	EndpointGroups []portainer.EndpointGroup
	EdgeGroups     []portainer.EdgeGroup
}

// FetchEndpointRelationsConfig fetches config needed for Edge Stack related endpoints
func FetchEndpointRelationsConfig(dataStore dataservices.DataStore) (*EndpointRelationsConfig, error) {
	endpoints, err := dataStore.Endpoint().Endpoints()
	if err != nil {
		return nil, fmt.Errorf("unable to retrieve environments from database: %w", err)
	}

	endpointGroups, err := dataStore.EndpointGroup().EndpointGroups()
	if err != nil {
		return nil, fmt.Errorf("unable to retrieve environment groups from database: %w", err)
	}

	edgeGroups, err := dataStore.EdgeGroup().EdgeGroups()
	if err != nil {
		return nil, fmt.Errorf("unable to retrieve edge groups from database: %w", err)
	}

	return &EndpointRelationsConfig{
		Endpoints:      endpoints,
		EndpointGroups: endpointGroups,
		EdgeGroups:     edgeGroups,
	}, nil
}

func DeleteEdgeStack(edgeStackID portainer.EdgeStackID, relatedEdgeGroupsIds []portainer.EdgeGroupID, dataStore dataservices.DataStore) error {
	err := dataStore.EdgeStack().DeleteEdgeStack(portainer.EdgeStackID(edgeStackID))
	if err != nil {
		return errors.WithMessage(err, "Unable to remove the edge stack from the database")
	}

	relationConfig, err := FetchEndpointRelationsConfig(dataStore)
	if err != nil {
		return errors.WithMessage(err, "Unable to retrieve environments relations config from database")
	}

	relatedEndpointIds, err := edge.EdgeStackRelatedEndpoints(relatedEdgeGroupsIds, relationConfig.Endpoints, relationConfig.EndpointGroups, relationConfig.EdgeGroups)
	if err != nil {
		return errors.WithMessage(err, "Unable to retrieve edge stack related environments from database")
	}

	for _, endpointID := range relatedEndpointIds {
		relation, err := dataStore.EndpointRelation().EndpointRelation(endpointID)
		if err != nil {
			return errors.WithMessage(err, "Unable to find environment relation in database")
		}

		delete(relation.EdgeStacks, edgeStackID)

		err = dataStore.EndpointRelation().UpdateEndpointRelation(endpointID, relation)
		if err != nil {
			return errors.WithMessage(err, "Unable to persist environment relation in database")
		}
	}

	return nil
}
