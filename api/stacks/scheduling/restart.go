package scheduling

import (
	"cmp"
	"context"
	"fmt"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/source"
	gitupdate "github.com/portainer/portainer/api/git/update"
	"github.com/portainer/portainer/api/gitops/workflows"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/scheduler"
	"github.com/portainer/portainer/api/stacks/deployments"
	"github.com/portainer/portainer/api/stacks/stackutils"

	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
)

type StackRestarter struct {
	dataStore           dataservices.DataStore
	gitService          portainer.GitService
	stackDeployer       deployments.StackDeployer
	swarmStackManager   portainer.SwarmStackManager
	composeStackManager portainer.ComposeStackManager
}

func NewStackRestarter(
	dataStore dataservices.DataStore,
	gitService portainer.GitService,
	stackDeployer deployments.StackDeployer,
	swarmStackManager portainer.SwarmStackManager,
	composeStackManager portainer.ComposeStackManager,
) *StackRestarter {
	return &StackRestarter{
		dataStore:           dataStore,
		gitService:          gitService,
		stackDeployer:       stackDeployer,
		swarmStackManager:   swarmStackManager,
		composeStackManager: composeStackManager,
	}
}

func (r *StackRestarter) Restart(ctx context.Context, stackID portainer.StackID) error {
	stack, err := r.dataStore.Stack().Read(stackID)
	if dataservices.IsErrObjectNotFound(err) {
		return scheduler.NewPermanentError(errors.WithMessagef(err, "failed to find stack %d", stackID))
	}
	if err != nil {
		return fmt.Errorf("failed to read stack %d: %w", stackID, err)
	}

	if !hasRestartSchedule(stack) {
		return scheduler.NewPermanentError(fmt.Errorf("stack %d no longer has a restart schedule", stackID))
	}

	if stack.Status == portainer.StackStatusInactive || stack.Status == portainer.StackStatusDeploying {
		log.Info().
			Int("stack_id", int(stack.ID)).
			Str("stack", stack.Name).
			Int("status", int(stack.Status)).
			Msg("skipping scheduled restart because stack is not restartable right now")

		return nil
	}

	endpoint, err := r.dataStore.Endpoint().Endpoint(stack.EndpointID)
	if dataservices.IsErrObjectNotFound(err) {
		return scheduler.NewPermanentError(errors.WithMessagef(err, "failed to find endpoint %d for stack %d", stack.EndpointID, stack.ID))
	}
	if err != nil {
		return fmt.Errorf("failed to read endpoint %d for stack %d: %w", stack.EndpointID, stack.ID, err)
	}

	user, err := r.resolveExecutionUser(stack)
	if err != nil {
		return err
	}

	registries, err := r.getRegistries(user, endpoint.ID)
	if err != nil {
		return err
	}

	if err := r.dataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		liveStack, err := tx.Stack().Read(stack.ID)
		if err != nil {
			return err
		}

		stackutils.PrepareStackStatusForDeployment(liveStack)
		liveStack.UpdateDate = time.Now().Unix()

		return tx.Stack().Update(liveStack.ID, liveStack)
	}); err != nil {
		return fmt.Errorf("failed to mark stack %d as deploying before scheduled restart: %w", stack.ID, err)
	}

	redeployErr := r.restartStack(ctx, user, stack, endpoint, registries)

	if err := r.dataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		liveStack, err := tx.Stack().Read(stack.ID)
		if err != nil {
			return err
		}

		liveStack.UpdateDate = time.Now().Unix()
		liveStack.CurrentDeploymentInfo = stack.CurrentDeploymentInfo
		stackutils.UpdateStackStatusFromDeploymentResult(liveStack, redeployErr)

		return tx.Stack().Update(liveStack.ID, liveStack)
	}); err != nil {
		return fmt.Errorf("failed to persist scheduled redeploy result for stack %d: %w", stack.ID, err)
	}

	return redeployErr
}

func (r *StackRestarter) restartStack(
	ctx context.Context,
	user *portainer.User,
	stack *portainer.Stack,
	endpoint *portainer.Endpoint,
	registries []portainer.Registry,
) error {
	pullImages := stack.RestartSchedule != nil && stack.RestartSchedule.PullImages
	prune := stack.Option != nil && stack.Option.Prune

	if stack.WorkflowID != 0 {
		if err := r.refreshGitState(ctx, user, stack); err != nil {
			return err
		}
	}

	switch stack.Type {
	case portainer.DockerComposeStack:
		stack.Name = r.composeStackManager.NormalizeStackName(stack.Name)

		if stackutils.IsRelativePathStack(stack) {
			if err := r.stackDeployer.StopRemoteComposeStack(ctx, user.ID, stack, endpoint); err != nil {
				return errors.WithMessagef(err, "failed to stop compose stack %d before scheduled redeploy", stack.ID)
			}

			if err := r.stackDeployer.DeployRemoteComposeStack(ctx, user.ID, stack, endpoint, registries, prune, pullImages, true); err != nil {
				return errors.WithMessagef(err, "failed to redeploy compose stack %d", stack.ID)
			}

			return nil
		}

		if err := r.stackDeployer.UndeployComposeStack(ctx, stack, endpoint); err != nil {
			return errors.WithMessagef(err, "failed to stop compose stack %d before scheduled redeploy", stack.ID)
		}

		if err := r.stackDeployer.DeployComposeStack(ctx, stack, endpoint, registries, prune, pullImages, true); err != nil {
			return errors.WithMessagef(err, "failed to redeploy compose stack %d", stack.ID)
		}

		return nil
	case portainer.DockerSwarmStack:
		stack.Name = r.swarmStackManager.NormalizeStackName(stack.Name)

		if stackutils.IsRelativePathStack(stack) {
			if err := r.stackDeployer.StopRemoteSwarmStack(ctx, user.ID, stack, endpoint); err != nil {
				return errors.WithMessagef(err, "failed to stop swarm stack %d before scheduled redeploy", stack.ID)
			}

			if err := r.stackDeployer.DeployRemoteSwarmStack(ctx, user.ID, stack, endpoint, registries, prune, pullImages); err != nil {
				return errors.WithMessagef(err, "failed to redeploy swarm stack %d", stack.ID)
			}

			return nil
		}

		if err := r.swarmStackManager.Remove(ctx, stack, endpoint); err != nil {
			return errors.WithMessagef(err, "failed to stop swarm stack %d before scheduled redeploy", stack.ID)
		}

		if err := r.stackDeployer.DeploySwarmStack(ctx, stack, endpoint, registries, prune, pullImages); err != nil {
			return errors.WithMessagef(err, "failed to redeploy swarm stack %d", stack.ID)
		}

		return nil
	default:
		return scheduler.NewPermanentError(fmt.Errorf("stack type %d does not support scheduled restarts", stack.Type))
	}
}

func (r *StackRestarter) refreshGitState(ctx context.Context, user *portainer.User, stack *portainer.Stack) error {
	var memberships []portainer.TeamMembership
	if err := r.dataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		memberships, err = tx.TeamMembership().TeamMembershipsByUserID(user.ID)
		return err
	}); err != nil {
		return fmt.Errorf("failed to load team memberships for stack execution user %q: %w", user.Username, err)
	}

	userContext := source.NewUserContext(user, memberships)
	gitSource, artifact, err := workflows.GitSourceAndArtifactForStack(r.dataStore, userContext, stack.WorkflowID, stack.ID)
	if err != nil {
		return errors.WithMessagef(err, "failed to load git config for stack %d", stack.ID)
	}
	if gitSource == nil {
		return scheduler.NewPermanentError(fmt.Errorf("stack %d is missing its git source configuration", stack.ID))
	}

	gitConfig := workflows.MergeSourceAndFile(gitSource, artifact)
	newHash := gitConfig.ConfigHash
	if !stack.FromAppTemplate {
		updated, latestHash, err := gitupdate.UpdateGitObject(ctx, r.gitService, fmt.Sprintf("stack:%d", stack.ID), gitConfig, false, stack.ProjectPath)
		if err != nil {
			if txErr := r.dataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
				return workflows.SaveStackStatus(tx, userContext, stack.WorkflowID, stack.ID, gitSource.ID, err)
			}); txErr != nil {
				return fmt.Errorf("git refresh failed for stack %d: %w (and failed to persist status: %w)", stack.ID, err, txErr)
			}

			return errors.WithMessagef(err, "failed to refresh git repository for stack %d", stack.ID)
		}

		if txErr := r.dataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
			return workflows.SaveStackStatus(tx, userContext, stack.WorkflowID, stack.ID, gitSource.ID, nil)
		}); txErr != nil {
			return fmt.Errorf("failed to persist git sync status for stack %d: %w", stack.ID, txErr)
		}

		if updated {
			stack.UpdateDate = time.Now().Unix()
		}
		newHash = latestHash
	}

	stack.CurrentDeploymentInfo = &portainer.StackDeploymentInfo{
		RepositoryURL:   gitConfig.URL,
		ReferenceName:   gitConfig.ReferenceName,
		ConfigFilePath:  gitConfig.ConfigFilePath,
		AdditionalFiles: stack.AdditionalFiles,
		ConfigHash:      newHash,
		SourceID:        gitSource.ID,
	}

	if err := r.dataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return workflows.UpdateArtifactFileForStack(tx, stack.WorkflowID, stack.ID, gitSource.ID, func(a *portainer.ArtifactFile) {
			a.Hash = newHash
			a.RefStatus = portainer.SourceStatusHealthy
			a.RefError = ""
			a.PathStatus = portainer.SourceStatusHealthy
			a.PathError = ""
		})
	}); err != nil {
		return fmt.Errorf("failed to persist git artifact state for stack %d: %w", stack.ID, err)
	}

	return nil
}

func (r *StackRestarter) resolveExecutionUser(stack *portainer.Stack) (*portainer.User, error) {
	author := cmp.Or(stack.UpdatedBy, stack.CreatedBy)
	if author != "" {
		user, err := r.dataStore.User().UserByUsername(author)
		if err == nil {
			return user, nil
		}
		if !dataservices.IsErrObjectNotFound(err) {
			return nil, fmt.Errorf("failed to read stack author %q for stack %d: %w", author, stack.ID, err)
		}
	}

	admins, err := r.dataStore.User().UsersByRole(portainer.AdministratorRole)
	if err != nil {
		return nil, fmt.Errorf("failed to find an execution user for stack %d: %w", stack.ID, err)
	}
	if len(admins) == 0 {
		return nil, scheduler.NewPermanentError(fmt.Errorf("stack %d has no available execution user", stack.ID))
	}

	return &admins[0], nil
}

func (r *StackRestarter) getRegistries(user *portainer.User, endpointID portainer.EndpointID) ([]portainer.Registry, error) {
	registries, err := r.dataStore.Registry().ReadAll()
	if err != nil {
		return nil, fmt.Errorf("unable to retrieve registries from the database: %w", err)
	}

	if user.Role == portainer.AdministratorRole {
		return registries, nil
	}

	userMemberships, err := r.dataStore.TeamMembership().TeamMembershipsByUserID(user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch memberships of execution user %q: %w", user.Username, err)
	}

	filteredRegistries := make([]portainer.Registry, 0, len(registries))
	for _, registry := range registries {
		if security.AuthorizedRegistryAccess(&registry, user, userMemberships, endpointID) {
			filteredRegistries = append(filteredRegistries, registry)
		}
	}

	return filteredRegistries, nil
}
