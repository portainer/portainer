package deployments

import (
	"cmp"
	"crypto/tls"
	"fmt"
	"strconv"
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
	"golang.org/x/sync/singleflight"
)

type StackAuthorMissingErr struct {
	stackID    int
	authorName string
}

func (e *StackAuthorMissingErr) Error() string {
	return fmt.Sprintf("stack's %v author %s is missing", e.stackID, e.authorName)
}

var singleflightGroup = &singleflight.Group{}

// RedeployWhenChanged pull and redeploy the stack when git repo changed
// Stack will always be redeployed if force deployment is set to true
func RedeployWhenChanged(stackID portainer.StackID, deployer StackDeployer, datastore dataservices.DataStore, gitService portainer.GitService) error {
	stack, err := datastore.Stack().Read(stackID)
	if dataservices.IsErrObjectNotFound(err) {
		return scheduler.NewPermanentError(errors.WithMessagef(err, "failed to get the stack %v", stackID))
	} else if err != nil {
		return errors.WithMessagef(err, "failed to get the stack %v", stackID)
	}

	// Webhook
	if stack.AutoUpdate != nil && stack.AutoUpdate.Webhook != "" {
		return redeployWhenChanged(stack, deployer, datastore, gitService, true)
	}

	// Polling
	_, err, _ = singleflightGroup.Do(strconv.Itoa(int(stackID)), func() (any, error) {
		return nil, redeployWhenChanged(stack, deployer, datastore, gitService, false)
	})

	return err
}

func redeployWhenChanged(stack *portainer.Stack, deployer StackDeployer, datastore dataservices.DataStore, gitService portainer.GitService, webhook bool) error {
	log.Debug().Int("stack_id", int(stack.ID)).Msg("redeploying stack")

	if stack.GitConfig == nil {
		return nil // do nothing if it isn't a git-based stack
	}

	endpoint, err := datastore.Endpoint().Endpoint(stack.EndpointID)
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

	author := cmp.Or(stack.UpdatedBy, stack.CreatedBy)

	user, err := datastore.User().UserByUsername(author)
	if err != nil {
		log.Warn().
			Int("stack_id", int(stack.ID)).
			Str("stack", stack.Name).
			Str("author", author).
			Int("endpoint_id", int(stack.EndpointID)).
			Msg("cannot auto update a stack, stack author user is missing")

		return &StackAuthorMissingErr{int(stack.ID), author}
	}

	if !isEnvironmentOnline(endpoint) {
		return nil
	}

	if webhook {
		go func() {
			if err := redeployWhenChangedSecondStage(stack, deployer, datastore, gitService, user, endpoint); err != nil {
				log.Error().Err(err).
					Int("stack_id", int(stack.ID)).
					Str("stack", stack.Name).
					Str("author", author).
					Int("endpoint_id", int(stack.EndpointID)).
					Msg("webhook failed to redeploy a stack")
			}
		}()

		return nil
	}

	return redeployWhenChangedSecondStage(stack, deployer, datastore, gitService, user, endpoint)
}

func redeployWhenChangedSecondStage(
	stack *portainer.Stack,
	deployer StackDeployer,
	datastore dataservices.DataStore,
	gitService portainer.GitService,
	user *portainer.User,
	endpoint *portainer.Endpoint,
) error {
	var gitCommitChangedOrForceUpdate bool

	if !stack.FromAppTemplate {
		updated, newHash, err := update.UpdateGitObject(gitService, fmt.Sprintf("stack:%d", stack.ID), stack.GitConfig, false, false, stack.ProjectPath)
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
	if dataservices.IsErrObjectNotFound(err) {
		return scheduler.NewPermanentError(err)
	} else if err != nil {
		return err
	}

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
		log.Debug().Int("stack_id", int(stack.ID)).Msg("deploying a kube app")

		if err := deployer.DeployKubernetesStack(stack, endpoint, user); err != nil {
			return errors.WithMessagef(err, "failed to deploy a kubernetes app stack %v", stack.ID)
		}
	default:
		return errors.Errorf("cannot update stack, type %v is unsupported", stack.Type)
	}

	stack.Status = portainer.StackStatusActive

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
