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

	registriesStrings := getRegistry(opts.registries, d.dataStore)
	envStrings := getEnv(stack.Env)

	return fn(stack, opts, registriesStrings, envStrings), nil
}

// deploy [-u username -p password] [--skip-tls-verify] [--env KEY1=VALUE1 --env KEY2=VALUE2] <git-repo-url> <ref> <project-name> <destination> <compose-file-path> [<more-file-paths>...]
func buildDeployCmd(stack *portainer.Stack, opts unpackerCmdBuilderOptions, registries []string, env []string) []string {
	cmd := []string{}
	cmd = append(cmd, UnpackerCmdDeploy)
	cmd = appendGitAuthIfNeeded(cmd, stack)
	cmd = appendSkipTLSVerifyIfNeeded(cmd, stack)
	cmd = append(cmd, env...)
	cmd = append(cmd, registries...)
	cmd = append(cmd, stack.GitConfig.URL)
	cmd = append(cmd, stack.GitConfig.ReferenceName)
	cmd = append(cmd, stack.Name)
	cmd = append(cmd, opts.composeDestination)
	cmd = append(cmd, stack.EntryPoint)
	cmd = appendAdditionalFiles(cmd, stack.AdditionalFiles)
	return cmd
}

// undeploy [-u username -p password] [-k] <git-repo-url> <project-name> <destination> <compose-file-path> [<more-file-paths>...]
func buildUndeployCmd(stack *portainer.Stack, opts unpackerCmdBuilderOptions, registries []string, env []string) []string {
	cmd := []string{}
	cmd = append(cmd, UnpackerCmdUndeploy)
	cmd = appendGitAuthIfNeeded(cmd, stack)
	cmd = append(cmd, stack.GitConfig.URL)
	cmd = append(cmd, stack.Name)
	cmd = append(cmd, opts.composeDestination)
	cmd = append(cmd, stack.EntryPoint)
	cmd = appendAdditionalFiles(cmd, stack.AdditionalFiles)
	return cmd
}

// deploy [-u username -p password] [--skip-tls-verify] [-k] [--env KEY1=VALUE1 --env KEY2=VALUE2] <git-repo-url> <project-name> <destination> <compose-file-path> [<more-file-paths>...]
func buildComposeStartCmd(stack *portainer.Stack, opts unpackerCmdBuilderOptions, registries []string, env []string) []string {
	cmd := []string{}
	cmd = append(cmd, UnpackerCmdDeploy)
	cmd = appendGitAuthIfNeeded(cmd, stack)
	cmd = appendSkipTLSVerifyIfNeeded(cmd, stack)
	cmd = append(cmd, "-k")
	cmd = append(cmd, env...)
	cmd = append(cmd, stack.GitConfig.URL)
	cmd = append(cmd, stack.GitConfig.ReferenceName)
	cmd = append(cmd, stack.Name)
	cmd = append(cmd, opts.composeDestination)
	cmd = append(cmd, stack.EntryPoint)
	cmd = appendAdditionalFiles(cmd, stack.AdditionalFiles)
	return cmd
}

// undeploy [-u username -p password] [-k] <git-repo-url> <project-name> <destination> <compose-file-path> [<more-file-paths>...]
func buildComposeStopCmd(stack *portainer.Stack, opts unpackerCmdBuilderOptions, registries []string, env []string) []string {
	cmd := []string{}
	cmd = append(cmd, UnpackerCmdUndeploy)
	cmd = appendGitAuthIfNeeded(cmd, stack)
	cmd = append(cmd, "-k")
	cmd = append(cmd, stack.GitConfig.URL)
	cmd = append(cmd, stack.Name)
	cmd = append(cmd, opts.composeDestination)
	cmd = append(cmd, stack.EntryPoint)
	cmd = appendAdditionalFiles(cmd, stack.AdditionalFiles)
	return cmd
}

// swarm-deploy [-u username -p password] [--skip-tls-verify] [-f] [-r] [--env KEY1=VALUE1 --env KEY2=VALUE2] <git-repo-url> <git-ref> <project-name> <destination> <compose-file-path> [<more-file-paths>...]
func buildSwarmDeployCmd(stack *portainer.Stack, opts unpackerCmdBuilderOptions, registries []string, env []string) []string {
	cmd := []string{}
	cmd = append(cmd, UnpackerCmdSwarmDeploy)
	cmd = appendGitAuthIfNeeded(cmd, stack)
	cmd = appendSkipTLSVerifyIfNeeded(cmd, stack)
	if opts.pullImage {
		cmd = append(cmd, "-f")
	}

	if opts.prune {
		cmd = append(cmd, "-r")
	}
	cmd = append(cmd, env...)
	cmd = append(cmd, registries...)
	cmd = append(cmd, stack.GitConfig.URL)
	cmd = append(cmd, stack.GitConfig.ReferenceName)
	cmd = append(cmd, stack.Name)
	cmd = append(cmd, opts.composeDestination)
	cmd = append(cmd, stack.EntryPoint)
	cmd = appendAdditionalFiles(cmd, stack.AdditionalFiles)
	return cmd
}

// swarm-undeploy [-k] <project-name> <destination>
func buildSwarmUndeployCmd(stack *portainer.Stack, opts unpackerCmdBuilderOptions, registries []string, env []string) []string {
	cmd := []string{}
	cmd = append(cmd, UnpackerCmdSwarmUndeploy)
	cmd = append(cmd, stack.Name)
	cmd = append(cmd, opts.composeDestination)
	return cmd
}

// swarm-deploy [-u username -p password] [-f] [-r] [-k] [--skip-tls-verify] [--env KEY1=VALUE1 --env KEY2=VALUE2] <git-repo-url> <project-name> <destination> <compose-file-path> [<more-file-paths>...]
func buildSwarmStartCmd(stack *portainer.Stack, opts unpackerCmdBuilderOptions, registries []string, env []string) []string {
	cmd := []string{}
	cmd = append(cmd, UnpackerCmdSwarmDeploy, "-f", "-r", "-k")
	cmd = appendSkipTLSVerifyIfNeeded(cmd, stack)
	cmd = append(cmd, getEnv(stack.Env)...)
	cmd = append(cmd, stack.GitConfig.URL)
	cmd = append(cmd, stack.GitConfig.ReferenceName)
	cmd = append(cmd, stack.Name)
	cmd = append(cmd, opts.composeDestination)
	cmd = append(cmd, stack.EntryPoint)
	cmd = appendAdditionalFiles(cmd, stack.AdditionalFiles)
	return cmd
}

// swarm-undeploy [-k] <project-name> <destination>
func buildSwarmStopCmd(stack *portainer.Stack, opts unpackerCmdBuilderOptions, registries []string, env []string) []string {
	cmd := []string{}
	cmd = append(cmd, UnpackerCmdSwarmUndeploy, "-k")
	cmd = append(cmd, stack.Name)
	cmd = append(cmd, opts.composeDestination)
	return cmd
}

func appendGitAuthIfNeeded(cmd []string, stack *portainer.Stack) []string {
	if stack.GitConfig.Authentication != nil && len(stack.GitConfig.Authentication.Password) != 0 {
		cmd = append(cmd, "-u", stack.GitConfig.Authentication.Username, "-p", stack.GitConfig.Authentication.Password)
	}
	return cmd
}

func appendSkipTLSVerifyIfNeeded(cmd []string, stack *portainer.Stack) []string {
	if stack.GitConfig.TLSSkipVerify {
		cmd = append(cmd, "--skip-tls-verify")
	}
	return cmd
}

func appendAdditionalFiles(cmd []string, files []string) []string {
	for i := 0; i < len(files); i++ {
		cmd = append(cmd, files[i])
	}
	return cmd
}

func getRegistry(registries []portainer.Registry, dataStore dataservices.DataStore) []string {
	cmds := []string{}

	for _, registry := range registries {
		if registry.Authentication {
			err := registryutils.EnsureRegTokenValid(dataStore, &registry)
			if err == nil {
				username, password, err := registryutils.GetRegEffectiveCredential(&registry)
				if err == nil {
					cmd := fmt.Sprintf("--registry=%s:%s:%s", username, password, registry.URL)
					cmds = append(cmds, cmd)
				}
			}
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
