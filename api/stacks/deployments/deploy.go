package deployments

import (
	"fmt"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/git/update"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/stacks/stackutils"

	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
)

type StackAuthorMissingErr struct {
	stackID    int
	authorName string
}

func (e *StackAuthorMissingErr) Error() string {
	return fmt.Sprintf("stack's %v author %s is missing", e.stackID, e.authorName)
}

// RedeployWhenChanged pull and redeploy the stack when git repo changed
// Stack will always be redeployed if force deployment is set to true
func RedeployWhenChanged(stackID portainer.StackID, deployer StackDeployer, datastore dataservices.DataStore, gitService portainer.GitService) error {
	log.Debug().Int("stack_id", int(stackID)).Msg("redeploying stack")

	stack, err := datastore.Stack().Read(stackID)
	if err != nil {
		return errors.WithMessagef(err, "failed to get the stack %v", stackID)
	}

	if stack.GitConfig == nil {
		return nil // do nothing if it isn't a git-based stack
	}

	endpoint, err := datastore.Endpoint().Endpoint(stack.EndpointID)
	if err != nil {
		return errors.WithMessagef(err, "failed to find the environment %v associated to the stack %v", stack.EndpointID, stack.ID)
	}

	author := stack.UpdatedBy
	if author == "" {
		author = stack.CreatedBy
	}

	user, err := datastore.User().UserByUsername(author)
	if err != nil {
		log.Warn().
			Int("stack_id", int(stackID)).
			Str("author", author).
			Str("stack", stack.Name).
			Int("endpoint_id", int(stack.EndpointID)).
			Msg("cannot auto update a stack, stack author user is missing")

		return &StackAuthorMissingErr{int(stack.ID), author}
	}

	var gitCommitChangedOrForceUpdate bool
	if !stack.FromAppTemplate {
		updated, newHash, err := update.UpdateGitObject(gitService, fmt.Sprintf("stack:%d", stackID), stack.GitConfig, false, false, stack.ProjectPath)
		if err != nil {
			return err
		}

		if updated {
			stack.GitConfig.ConfigHash = newHash
			stack.UpdateDate = time.Now().Unix()
			gitCommitChangedOrForceUpdate = updated
		}
	}

	if !gitCommitChangedOrForceUpdate {
		return nil
	}

	registries, err := getUserRegistries(datastore, user, endpoint.ID)
	if err != nil {
		return err
	}

	switch stack.Type {
	case portainer.DockerComposeStack:

		if stackutils.IsGitStack(stack) {
			err = deployer.DeployRemoteComposeStack(stack, endpoint, registries, true, false)
		} else {
			err = deployer.DeployComposeStack(stack, endpoint, registries, true, false)
		}

		if err != nil {
			return errors.WithMessagef(err, "failed to deploy a docker compose stack %v", stackID)
		}
	case portainer.DockerSwarmStack:
		if stackutils.IsGitStack(stack) {
			err = deployer.DeployRemoteSwarmStack(stack, endpoint, registries, true, true)
		} else {
			err = deployer.DeploySwarmStack(stack, endpoint, registries, true, true)
		}
		if err != nil {
			return errors.WithMessagef(err, "failed to deploy a docker compose stack %v", stackID)
		}
	case portainer.KubernetesStack:
		log.Debug().
			Int("stack_id", int(stackID)).
			Msg("deploying a kube app")

		err := deployer.DeployKubernetesStack(stack, endpoint, user)
		if err != nil {
			return errors.WithMessagef(err, "failed to deploy a kubernetes app stack %v", stackID)
		}
	default:
		return errors.Errorf("cannot update stack, type %v is unsupported", stack.Type)
	}

	if err := datastore.Stack().Update(stack.ID, stack); err != nil {
		return errors.WithMessagef(err, "failed to update the stack %v", stack.ID)
	}

	return nil
}

func getUserRegistries(datastore dataservices.DataStore, user *portainer.User, endpointID portainer.EndpointID) ([]portainer.Registry, error) {
	registries, err := datastore.Registry().ReadAll()
	if err != nil {
		return nil, errors.WithMessage(err, "unable to retrieve registries from the database")
	}

	if user.Role == portainer.AdministratorRole {
		return registries, nil
	}

	userMemberships, err := datastore.TeamMembership().TeamMembershipsByUserID(user.ID)
	if err != nil {
		return nil, errors.WithMessagef(err, "failed to fetch memberships of the stack author [%s]", user.Username)
	}

	filteredRegistries := make([]portainer.Registry, 0, len(registries))
	for _, registry := range registries {
		if security.AuthorizedRegistryAccess(&registry, user, userMemberships, endpointID) {
			filteredRegistries = append(filteredRegistries, registry)
		}
	}

	return filteredRegistries, nil
}
