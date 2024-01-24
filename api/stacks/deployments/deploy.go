package deployments

import (
	"crypto/tls"
	"fmt"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/agent"
	"github.com/portainer/portainer/api/crypto"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/git/update"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/scheduler"
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

var errDoNothing = errors.New("do nothing")

// RedeployWhenChanged pull and redeploy the stack when git repo changed
// Stack will always be redeployed if force deployment is set to true
func RedeployWhenChanged(stackID portainer.StackID, deployer StackDeployer, datastore dataservices.DataStore, gitService portainer.GitService) error {
	log.Debug().Int("stack_id", int(stackID)).Msg("redeploying stack")

	var stack *portainer.Stack
	var endpoint *portainer.Endpoint
	var user *portainer.User
	var registries []portainer.Registry

	err := datastore.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error

		stack, err = tx.Stack().Read(stackID)
		if dataservices.IsErrObjectNotFound(err) {
			return scheduler.NewPermanentError(errors.WithMessagef(err, "failed to get the stack %v", stackID))
		} else if err != nil {
			return errors.WithMessagef(err, "failed to get the stack %v", stackID)
		}

		if stack.GitConfig == nil {
			return errDoNothing // do nothing if it isn't a git-based stack
		}

		endpoint, err = tx.Endpoint().Endpoint(stack.EndpointID)
		if dataservices.IsErrObjectNotFound(err) {
			return scheduler.NewPermanentError(
				errors.WithMessagef(err,
					"failed to find the environment %v associated to the stack %v",
					stack.EndpointID,
					stack.ID,
				),
			)
		} else if err != nil {
			return errors.WithMessagef(err, "failed to find the environment %v associated to the stack %v", stack.EndpointID, stack.ID)
		}

		user, err = validateAuthor(tx, stack)
		if err != nil {
			return err
		}

		registries, err = getUserRegistries(tx, user, endpoint.ID)
		if dataservices.IsErrObjectNotFound(err) {
			return scheduler.NewPermanentError(err)
		}

		return err
	})
	if errors.Is(err, errDoNothing) {
		return nil
	} else if err != nil {
		return err
	}

	if !isEnvironmentOnline(endpoint) {
		return nil
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

	if err := deployStack(deployer, stack, endpoint, user, registries); err != nil {
		return err
	}

	err = datastore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		latestStack, err := tx.Stack().Read(stack.ID)
		if err != nil {
			return err
		}

		if gitCommitChangedOrForceUpdate {
			if latestStack.GitConfig != nil && stack.GitConfig != nil {
				latestStack.GitConfig.ConfigHash = stack.GitConfig.ConfigHash
			}

			latestStack.UpdateDate = time.Now().Unix()
		}

		latestStack.Status = portainer.StackStatusActive

		return tx.Stack().Update(stack.ID, latestStack)
	})
	if err != nil {
		return errors.WithMessagef(err, "failed to update the stack %v", stack.ID)
	}

	return nil
}

func validateAuthor(tx dataservices.DataStoreTx, stack *portainer.Stack) (*portainer.User, error) {
	author := stack.UpdatedBy
	if author == "" {
		author = stack.CreatedBy
	}

	user, err := tx.User().UserByUsername(author)
	if err != nil {
		log.Warn().
			Int("stack_id", int(stack.ID)).
			Str("author", author).
			Str("stack", stack.Name).
			Int("endpoint_id", int(stack.EndpointID)).
			Msg("cannot auto update a stack, stack author user is missing")

		return nil, &StackAuthorMissingErr{int(stack.ID), author}
	}

	return user, nil
}

func getUserRegistries(tx dataservices.DataStoreTx, user *portainer.User, endpointID portainer.EndpointID) ([]portainer.Registry, error) {
	registries, err := tx.Registry().ReadAll()
	if err != nil {
		return nil, errors.WithMessage(err, "unable to retrieve registries from the database")
	}

	if user.Role == portainer.AdministratorRole {
		return registries, nil
	}

	userMemberships, err := tx.TeamMembership().TeamMembershipsByUserID(user.ID)
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

func isEnvironmentOnline(endpoint *portainer.Endpoint) bool {
	if endpoint.Type != portainer.AgentOnDockerEnvironment &&
		endpoint.Type != portainer.AgentOnKubernetesEnvironment {
		return true
	}

	var err error
	var tlsConfig *tls.Config
	if endpoint.TLSConfig.TLS {
		tlsConfig, err = crypto.CreateTLSConfigurationFromDisk(endpoint.TLSConfig.TLSCACertPath, endpoint.TLSConfig.TLSCertPath, endpoint.TLSConfig.TLSKeyPath, endpoint.TLSConfig.TLSSkipVerify)
		if err != nil {
			return false
		}
	}

	_, _, err = agent.GetAgentVersionAndPlatform(endpoint.URL, tlsConfig)
	return err == nil
}

func deployStack(
	deployer StackDeployer,
	stack *portainer.Stack,
	endpoint *portainer.Endpoint,
	user *portainer.User,
	registries []portainer.Registry,
) error {
	var err error

	switch stack.Type {
	case portainer.DockerComposeStack:
		if stackutils.IsRelativePathStack(stack) {
			err = deployer.DeployRemoteComposeStack(stack, endpoint, registries, true, false)
		} else {
			err = deployer.DeployComposeStack(stack, endpoint, registries, true, false)
		}

		if err != nil {
			return errors.WithMessagef(err, "failed to deploy a docker compose stack %v", stack.ID)
		}
	case portainer.DockerSwarmStack:
		if stackutils.IsRelativePathStack(stack) {
			err = deployer.DeployRemoteSwarmStack(stack, endpoint, registries, true, true)
		} else {
			err = deployer.DeploySwarmStack(stack, endpoint, registries, true, true)
		}
		if err != nil {
			return errors.WithMessagef(err, "failed to deploy a docker compose stack %v", stack.ID)
		}
	case portainer.KubernetesStack:
		log.Debug().
			Int("stack_id", int(stack.ID)).
			Msg("deploying a kube app")

		err := deployer.DeployKubernetesStack(stack, endpoint, user)
		if err != nil {
			return errors.WithMessagef(err, "failed to deploy a kubernetes app stack %v", stack.ID)
		}
	default:
		return errors.Errorf("cannot update stack, type %v is unsupported", stack.Type)
	}

	return nil
}
