package stacks

import (
	"fmt"
	"strings"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"

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

	stack, err := datastore.Stack().Stack(stackID)
	if err != nil {
		return errors.WithMessagef(err, "failed to get the stack %v", stackID)
	}

	if stack.GitConfig == nil {
		return nil // do nothing if it isn't a git-based stack
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
			Msg("cannot autoupdate a stack, stack author user is missing")

		return &StackAuthorMissingErr{int(stack.ID), author}
	}

	username, password := "", ""
	if stack.GitConfig.Authentication != nil {
		username, password = stack.GitConfig.Authentication.Username, stack.GitConfig.Authentication.Password
	}

	newHash, err := gitService.LatestCommitID(stack.GitConfig.URL, stack.GitConfig.ReferenceName, username, password)
	if err != nil {
		return errors.WithMessagef(err, "failed to fetch latest commit id of the stack %v", stack.ID)
	}

	if strings.EqualFold(newHash, string(stack.GitConfig.ConfigHash)) {
		return nil
	}

	cloneParams := &cloneRepositoryParameters{
		url:   stack.GitConfig.URL,
		ref:   stack.GitConfig.ReferenceName,
		toDir: stack.ProjectPath,
	}
	if stack.GitConfig.Authentication != nil {
		cloneParams.auth = &gitAuth{
			username: username,
			password: password,
		}
	}

	if err := cloneGitRepository(gitService, cloneParams); err != nil {
		return errors.WithMessagef(err, "failed to do a fresh clone of the stack %v", stack.ID)
	}

	endpoint, err := datastore.Endpoint().Endpoint(stack.EndpointID)
	if err != nil {
		return errors.WithMessagef(err, "failed to find the environment %v associated to the stack %v", stack.EndpointID, stack.ID)
	}

	registries, err := getUserRegistries(datastore, user, endpoint.ID)
	if err != nil {
		return err
	}

	switch stack.Type {
	case portainer.DockerComposeStack:
		err := deployer.DeployComposeStack(stack, endpoint, registries, true, false)
		if err != nil {
			return errors.WithMessagef(err, "failed to deploy a docker compose stack %v", stackID)
		}
	case portainer.DockerSwarmStack:
		err := deployer.DeploySwarmStack(stack, endpoint, registries, true, true)
		if err != nil {
			return errors.WithMessagef(err, "failed to deploy a docker compose stack %v", stackID)
		}
	case portainer.KubernetesStack:
		log.Debug().
			Int("stack_id", int(stackID)).
			Msg("deploying a kube app")

		err := deployer.DeployKubernetesStack(stack, endpoint, user)
		if err != nil {
			return errors.WithMessagef(err, "failed to deploy a kubternetes app stack %v", stackID)
		}
	default:
		return errors.Errorf("cannot update stack, type %v is unsupported", stack.Type)
	}

	stack.UpdateDate = time.Now().Unix()
	stack.GitConfig.ConfigHash = newHash
	if err := datastore.Stack().UpdateStack(stack.ID, stack); err != nil {
		return errors.WithMessagef(err, "failed to update the stack %v", stack.ID)
	}

	return nil
}

func getUserRegistries(datastore dataservices.DataStore, user *portainer.User, endpointID portainer.EndpointID) ([]portainer.Registry, error) {
	registries, err := datastore.Registry().Registries()
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

type cloneRepositoryParameters struct {
	url   string
	ref   string
	toDir string
	auth  *gitAuth
}

type gitAuth struct {
	username string
	password string
}

func cloneGitRepository(gitService portainer.GitService, cloneParams *cloneRepositoryParameters) error {
	if cloneParams.auth != nil {
		return gitService.CloneRepository(cloneParams.toDir, cloneParams.url, cloneParams.ref, cloneParams.auth.username, cloneParams.auth.password)
	}
	return gitService.CloneRepository(cloneParams.toDir, cloneParams.url, cloneParams.ref, "", "")
}
