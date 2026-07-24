// Package teardown removes a stack's deployed resources, database records,
// and project files.
package teardown

import (
	"context"
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/stacks/deployments"
	"github.com/portainer/portainer/api/stacks/stackutils"

	"github.com/rs/zerolog/log"
)

// Service manages stack teardown.
//
// A full teardown calls the methods in order: RemoveResources, then
// DeleteRecords inside the caller's write transaction, then RemoveFiles once
// the transaction has committed.
type Service interface {
	// RemoveResources removes the deployed Docker/Kubernetes resources for a
	// stack.
	RemoveResources(ctx context.Context, userID portainer.UserID, stack *portainer.Stack, endpoint *portainer.Endpoint) error

	// DeleteRecords removes the stack's database records — its stack record
	// and its resource control.
	DeleteRecords(tx dataservices.DataStoreTx, stack *portainer.Stack) error

	// RemoveFiles removes the stack's project files from disk.
	RemoveFiles(stack *portainer.Stack) error
}

type service struct {
	fileService         portainer.FileService
	swarmStackManager   portainer.SwarmStackManager
	composeStackManager portainer.ComposeStackManager
	stackDeployer       deployments.StackDeployer
	kubernetesDeployer  portainer.KubernetesDeployer
}

// NewService creates a stack teardown service.
func NewService(
	fileService portainer.FileService,
	swarmStackManager portainer.SwarmStackManager,
	composeStackManager portainer.ComposeStackManager,
	stackDeployer deployments.StackDeployer,
	kubernetesDeployer portainer.KubernetesDeployer,
) Service {
	return &service{
		fileService:         fileService,
		swarmStackManager:   swarmStackManager,
		composeStackManager: composeStackManager,
		stackDeployer:       stackDeployer,
		kubernetesDeployer:  kubernetesDeployer,
	}
}

func (s *service) RemoveResources(ctx context.Context, userID portainer.UserID, stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	switch stack.Type {
	case portainer.DockerSwarmStack:
		stack.Name = s.swarmStackManager.NormalizeStackName(stack.Name)

		if stackutils.IsRelativePathStack(stack) {
			return s.stackDeployer.UndeployRemoteSwarmStack(ctx, userID, stack, endpoint)
		}

		return s.swarmStackManager.Remove(ctx, stack, endpoint)

	case portainer.DockerComposeStack:
		stack.Name = s.composeStackManager.NormalizeStackName(stack.Name)

		if stackutils.IsRelativePathStack(stack) {
			return s.stackDeployer.UndeployRemoteComposeStack(ctx, userID, stack, endpoint)
		}

		return s.stackDeployer.UndeployComposeStack(ctx, stack, endpoint)

	case portainer.KubernetesStack:
		manifestFiles := stackutils.GetStackFilePaths(stack, true)

		out, err := s.kubernetesDeployer.Remove(ctx, userID, endpoint, manifestFiles, stack.Namespace)
		if err != nil {
			for _, manifest := range manifestFiles {
				if exists, fileExistsErr := filesystem.FileExists(manifest); fileExistsErr != nil || !exists {
					// If removal has failed and one of the manifest files is missing,
					// we can consider this stack as removed
					log.Warn().Err(fileExistsErr).Msgf("failed to find manifest %s, but stack deletion will continue", manifest)
					return nil
				}
			}
			return fmt.Errorf("failed to remove kubernetes resources: %q. Error: %w", out, err)
		}

		return nil

	default:
		return fmt.Errorf("unsupported stack type: %v", stack.Type)
	}
}

func (s *service) DeleteRecords(tx dataservices.DataStoreTx, stack *portainer.Stack) error {
	resourceControl, err := tx.ResourceControl().ResourceControlByResourceIDAndType(stackutils.ResourceControlID(stack.EndpointID, stack.Name), portainer.StackResourceControl)
	if err != nil {
		return fmt.Errorf("unable to retrieve the resource control associated to the stack: %w", err)
	}

	if err := tx.Stack().Delete(stack.ID); err != nil {
		return fmt.Errorf("unable to remove the stack from the database: %w", err)
	}

	if resourceControl != nil {
		if err := tx.ResourceControl().Delete(resourceControl.ID); err != nil {
			return fmt.Errorf("unable to remove the associated resource control from the database: %w", err)
		}
	}

	return nil
}

func (s *service) RemoveFiles(stack *portainer.Stack) error {
	if err := s.fileService.RemoveDirectory(stack.ProjectPath); err != nil {
		return fmt.Errorf("unable to remove stack files from disk: %w", err)
	}

	return nil
}
