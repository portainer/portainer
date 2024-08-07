package deployments

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/registryutils"
)

type StackRemoteOperation string

const (
	OperationDeploy        StackRemoteOperation = "compose-deploy"
	OperationUndeploy      StackRemoteOperation = "compose-undeploy"
	OperationComposeStart  StackRemoteOperation = "compose-start"
	OperationComposeStop   StackRemoteOperation = "compose-stop"
	OperationSwarmDeploy   StackRemoteOperation = "swarm-deploy"
	OperationSwarmUndeploy StackRemoteOperation = "swarm-undeploy"
	OperationSwarmStart    StackRemoteOperation = "swarm-start"
	OperationSwarmStop     StackRemoteOperation = "swarm-stop"
)

const (
	UnpackerCmdDeploy        = "deploy"
	UnpackerCmdUndeploy      = "undeploy"
	UnpackerCmdSwarmDeploy   = "swarm-deploy"
	UnpackerCmdSwarmUndeploy = "swarm-undeploy"
)

type unpackerCmdBuilderOptions struct {
	pullImage          bool
	prune              bool
	forceRecreate      bool
	composeDestination string
	registries         []portainer.Registry
}

type buildCmdFunc func(stack *portainer.Stack, opts unpackerCmdBuilderOptions, registries []string, env []string) []string

var funcmap = map[StackRemoteOperation]buildCmdFunc{
	OperationDeploy:        buildDeployCmd,
	OperationUndeploy:      buildUndeployCmd,
	OperationComposeStart:  buildComposeStartCmd,
	OperationComposeStop:   buildComposeStopCmd,
	OperationSwarmDeploy:   buildSwarmDeployCmd,
	OperationSwarmUndeploy: buildSwarmUndeployCmd,
	OperationSwarmStart:    buildSwarmStartCmd,
	OperationSwarmStop:     buildSwarmStopCmd,
}

// build the unpacker cmd for stack based on stackOperation
func (d *stackDeployer) buildUnpackerCmdForStack(stack *portainer.Stack, operation StackRemoteOperation, opts unpackerCmdBuilderOptions) ([]string, error) {
	fn := funcmap[operation]
	if fn == nil {
		return nil, fmt.Errorf("unknown stack operation %s", operation)
	}

	registriesStrings := generateRegistriesStrings(opts.registries, d.dataStore)
	envStrings := getEnv(stack.Env)

	return fn(stack, opts, registriesStrings, envStrings), nil
}

// deploy [-u username -p password] [--skip-tls-verify] [--force-recreate] [-k] [--env KEY1=VALUE1 --env KEY2=VALUE2] <git-repo-url> <ref> <project-name> <destination> <compose-file-path> [<more-file-paths>...]
func buildDeployCmd(stack *portainer.Stack, opts unpackerCmdBuilderOptions, registries []string, env []string) []string {
	cmd := []string{UnpackerCmdDeploy}
	cmd = appendGitAuthIfNeeded(cmd, stack)
	cmd = appendSkipTLSVerifyIfNeeded(cmd, stack)
	cmd = appendForceRecreateIfNeeded(cmd, opts.forceRecreate)
	cmd = append(cmd, env...)
	cmd = append(cmd, registries...)
	cmd = append(cmd,
		stack.GitConfig.URL,
		stack.GitConfig.ReferenceName,
		stack.Name,
		opts.composeDestination,
		stack.EntryPoint,
	)

	return append(cmd, stack.AdditionalFiles...)
}

// undeploy [-u username -p password] [-k] <git-repo-url> <project-name> <destination> <compose-file-path> [<more-file-paths>...]
func buildUndeployCmd(stack *portainer.Stack, opts unpackerCmdBuilderOptions, registries []string, env []string) []string {
	cmd := []string{UnpackerCmdUndeploy}
	cmd = appendGitAuthIfNeeded(cmd, stack)
	cmd = append(cmd, stack.GitConfig.URL,
		stack.Name,
		opts.composeDestination,
		stack.EntryPoint,
	)

	return append(cmd, stack.AdditionalFiles...)
}

// deploy [-u username -p password] [--skip-tls-verify] [-k] [--env KEY1=VALUE1 --env KEY2=VALUE2] <git-repo-url> <project-name> <destination> <compose-file-path> [<more-file-paths>...]
func buildComposeStartCmd(stack *portainer.Stack, opts unpackerCmdBuilderOptions, registries []string, env []string) []string {
	cmd := []string{UnpackerCmdDeploy}
	cmd = appendGitAuthIfNeeded(cmd, stack)
	cmd = appendSkipTLSVerifyIfNeeded(cmd, stack)
	cmd = append(cmd, "-k")
	cmd = append(cmd, env...)
	cmd = append(cmd, registries...)
	cmd = append(cmd, stack.GitConfig.URL,
		stack.GitConfig.ReferenceName,
		stack.Name,
		opts.composeDestination,
		stack.EntryPoint,
	)

	return append(cmd, stack.AdditionalFiles...)
}

// undeploy [-u username -p password] [-k] <git-repo-url> <project-name> <destination> <compose-file-path> [<more-file-paths>...]
func buildComposeStopCmd(stack *portainer.Stack, opts unpackerCmdBuilderOptions, registries []string, env []string) []string {
	cmd := []string{UnpackerCmdUndeploy}
	cmd = appendGitAuthIfNeeded(cmd, stack)
	cmd = append(cmd,
		"-k",
		stack.GitConfig.URL,
		stack.Name,
		opts.composeDestination,
		stack.EntryPoint,
	)

	return append(cmd, stack.AdditionalFiles...)
}

// swarm-deploy [-u username -p password] [--skip-tls-verify] [--force-recreate] [-f] [-r] [-k] [--env KEY1=VALUE1 --env KEY2=VALUE2] <git-repo-url> <git-ref> <project-name> <destination> <compose-file-path> [<more-file-paths>...]
func buildSwarmDeployCmd(stack *portainer.Stack, opts unpackerCmdBuilderOptions, registries []string, env []string) []string {
	cmd := []string{UnpackerCmdSwarmDeploy}
	cmd = appendGitAuthIfNeeded(cmd, stack)
	cmd = appendSkipTLSVerifyIfNeeded(cmd, stack)
	cmd = appendForceRecreateIfNeeded(cmd, opts.forceRecreate)
	if opts.pullImage {
		cmd = append(cmd, "-f")
	}

	if opts.prune {
		cmd = append(cmd, "-r")
	}

	cmd = append(cmd, env...)
	cmd = append(cmd, registries...)
	cmd = append(cmd, stack.GitConfig.URL,
		stack.GitConfig.ReferenceName,
		stack.Name,
		opts.composeDestination,
		stack.EntryPoint,
	)

	return append(cmd, stack.AdditionalFiles...)
}

// swarm-undeploy [-k] <project-name> <destination>
func buildSwarmUndeployCmd(stack *portainer.Stack, opts unpackerCmdBuilderOptions, registries []string, env []string) []string {
	return []string{UnpackerCmdSwarmUndeploy, stack.Name, opts.composeDestination}
}

// swarm-deploy [-u username -p password] [-f] [-r] [-k] [--skip-tls-verify] [--env KEY1=VALUE1 --env KEY2=VALUE2] <git-repo-url> <project-name> <destination> <compose-file-path> [<more-file-paths>...]
func buildSwarmStartCmd(stack *portainer.Stack, opts unpackerCmdBuilderOptions, registries []string, env []string) []string {
	cmd := []string{UnpackerCmdSwarmDeploy, "-f", "-r", "-k"}
	cmd = appendSkipTLSVerifyIfNeeded(cmd, stack)
	cmd = append(cmd, getEnv(stack.Env)...)
	cmd = append(cmd, registries...)
	cmd = append(cmd, stack.GitConfig.URL,
		stack.GitConfig.ReferenceName,
		stack.Name,
		opts.composeDestination,
		stack.EntryPoint,
	)

	return append(cmd, stack.AdditionalFiles...)
}

// swarm-undeploy [-k] <project-name> <destination>
func buildSwarmStopCmd(stack *portainer.Stack, opts unpackerCmdBuilderOptions, registries []string, env []string) []string {
	return []string{UnpackerCmdSwarmUndeploy, "-k", stack.Name, opts.composeDestination}
}

func appendGitAuthIfNeeded(cmd []string, stack *portainer.Stack) []string {
	if stack.GitConfig.Authentication == nil || stack.GitConfig.Authentication.Password == "" {
		return cmd
	}

	return append(cmd, "-u", stack.GitConfig.Authentication.Username, "-p", stack.GitConfig.Authentication.Password)
}

func appendSkipTLSVerifyIfNeeded(cmd []string, stack *portainer.Stack) []string {
	if !stack.GitConfig.TLSSkipVerify {
		return cmd
	}

	return append(cmd, "--skip-tls-verify")
}

func appendForceRecreateIfNeeded(cmd []string, forceRecreate bool) []string {
	if forceRecreate {
		cmd = append(cmd, "--force-recreate")
	}
	return cmd
}

func generateRegistriesStrings(registries []portainer.Registry, dataStore dataservices.DataStore) []string {
	cmds := []string{}

	for _, registry := range registries {
		if registry.Authentication {
			if err := registryutils.EnsureRegTokenValid(dataStore, &registry); err != nil {
				continue
			}

			username, password, err := registryutils.GetRegEffectiveCredential(&registry)
			if err != nil {
				continue
			}

			cmds = append(cmds, fmt.Sprintf("--registry=%s:%s:%s", username, password, registry.URL))
		}
	}

	return cmds
}

func getEnv(env []portainer.Pair) []string {
	if len(env) == 0 {
		return nil
	}

	cmd := []string{}
	for _, pair := range env {
		cmd = append(cmd, fmt.Sprintf(`--env=%s=%s`, pair.Name, pair.Value))
	}

	return cmd
}
