package deployments

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"os"
	"strings"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/source"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/gitops/workflows"
	"github.com/portainer/portainer/api/logs"
	"github.com/portainer/portainer/pkg/librand"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/api/types/swarm"
	"github.com/docker/docker/api/types/system"
	dockerclient "github.com/docker/docker/client"
	"github.com/docker/docker/pkg/stdcopy"
	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
	"github.com/segmentio/encoding/json"
)

const (
	defaultUnpackerImage       = "portainer/compose-unpacker:" + portainer.APIVersion
	composeUnpackerImageEnvVar = "COMPOSE_UNPACKER_IMAGE"
	composePathPrefix          = "portainer-compose-unpacker"
)

type RemoteStackDeployer interface {
	// compose
	DeployRemoteComposeStack(ctx context.Context, userId portainer.UserID, stack *portainer.Stack, endpoint *portainer.Endpoint, registries []portainer.Registry, prune bool, forcePullImage bool, forceRecreate bool) error
	UndeployRemoteComposeStack(ctx context.Context, userId portainer.UserID, stack *portainer.Stack, endpoint *portainer.Endpoint) error
	StartRemoteComposeStack(ctx context.Context, userId portainer.UserID, stack *portainer.Stack, endpoint *portainer.Endpoint, registries []portainer.Registry) error
	StopRemoteComposeStack(ctx context.Context, userId portainer.UserID, stack *portainer.Stack, endpoint *portainer.Endpoint) error
	// swarm
	DeployRemoteSwarmStack(ctx context.Context, userId portainer.UserID, stack *portainer.Stack, endpoint *portainer.Endpoint, registries []portainer.Registry, prune bool, pullImage bool) error
	UndeployRemoteSwarmStack(ctx context.Context, userId portainer.UserID, stack *portainer.Stack, endpoint *portainer.Endpoint) error
	StartRemoteSwarmStack(ctx context.Context, userId portainer.UserID, stack *portainer.Stack, endpoint *portainer.Endpoint, registries []portainer.Registry) error
	StopRemoteSwarmStack(ctx context.Context, userId portainer.UserID, stack *portainer.Stack, endpoint *portainer.Endpoint) error
}

// Deploy a compose stack on remote environment using a https://github.com/portainer/compose-unpacker container
func (d *stackDeployer) DeployRemoteComposeStack(
	ctx context.Context,
	userId portainer.UserID,
	stack *portainer.Stack,
	endpoint *portainer.Endpoint,
	registries []portainer.Registry,
	prune bool,
	forcePullImage bool,
	forceRecreate bool,
) error {
	d.lock.Lock()
	defer d.lock.Unlock()

	options := portainer.ComposeOptions{Registries: registries}

	// --force-recreate doesn't pull updated images
	if forcePullImage {
		if err := d.composeStackManager.Pull(ctx, stack, endpoint, options); err != nil {
			return err
		}
	}

	return d.remoteStack(
		ctx,
		userId,
		stack,
		endpoint,
		OperationDeploy,
		unpackerCmdBuilderOptions{
			forceRecreate: forceRecreate,
			registries:    registries,
			prune:         prune,
		},
	)
}

// Undeploy a compose stack on remote environment using a https://github.com/portainer/compose-unpacker container
func (d *stackDeployer) UndeployRemoteComposeStack(
	ctx context.Context,
	userId portainer.UserID,
	stack *portainer.Stack,
	endpoint *portainer.Endpoint,
) error {
	d.lock.Lock()
	defer d.lock.Unlock()

	return d.remoteStack(ctx, userId, stack, endpoint, OperationUndeploy, unpackerCmdBuilderOptions{})
}

// Start a compose stack on remote environment using a https://github.com/portainer/compose-unpacker container
func (d *stackDeployer) StartRemoteComposeStack(
	ctx context.Context,
	userId portainer.UserID,
	stack *portainer.Stack,
	endpoint *portainer.Endpoint,
	registries []portainer.Registry,
) error {
	return d.remoteStack(
		ctx,
		userId,
		stack,
		endpoint,
		OperationComposeStart,
		unpackerCmdBuilderOptions{
			registries: registries,
		},
	)
}

// Stop a compose stack on remote environment using a https://github.com/portainer/compose-unpacker container
func (d *stackDeployer) StopRemoteComposeStack(
	ctx context.Context,
	userId portainer.UserID,
	stack *portainer.Stack,
	endpoint *portainer.Endpoint,
) error {
	return d.remoteStack(ctx, userId, stack, endpoint, OperationComposeStop, unpackerCmdBuilderOptions{})
}

// Deploy a swarm stack on remote environment using a https://github.com/portainer/compose-unpacker container
func (d *stackDeployer) DeployRemoteSwarmStack(
	ctx context.Context,
	userId portainer.UserID,
	stack *portainer.Stack,
	endpoint *portainer.Endpoint,
	registries []portainer.Registry,
	prune bool,
	pullImage bool,
) error {
	d.lock.Lock()
	defer d.lock.Unlock()

	return d.remoteStack(ctx, userId, stack, endpoint, OperationSwarmDeploy, unpackerCmdBuilderOptions{
		pullImage:     pullImage,
		prune:         prune,
		forceRecreate: stack.AutoUpdate != nil && stack.AutoUpdate.ForceUpdate,
		registries:    registries,
	})
}

// Undeploy a swarm stack on remote environment using a https://github.com/portainer/compose-unpacker container
func (d *stackDeployer) UndeployRemoteSwarmStack(
	ctx context.Context,
	userId portainer.UserID,
	stack *portainer.Stack,
	endpoint *portainer.Endpoint,
) error {
	d.lock.Lock()
	defer d.lock.Unlock()

	return d.remoteStack(ctx, userId, stack, endpoint, OperationSwarmUndeploy, unpackerCmdBuilderOptions{})
}

// Start a swarm stack on remote environment using a https://github.com/portainer/compose-unpacker container
func (d *stackDeployer) StartRemoteSwarmStack(
	ctx context.Context,
	userId portainer.UserID,
	stack *portainer.Stack,
	endpoint *portainer.Endpoint,
	registries []portainer.Registry,
) error {
	return d.remoteStack(
		ctx,
		userId,
		stack,
		endpoint,
		OperationSwarmStart,
		unpackerCmdBuilderOptions{registries: registries},
	)
}

// Stop a swarm stack on remote environment using a https://github.com/portainer/compose-unpacker container
func (d *stackDeployer) StopRemoteSwarmStack(
	ctx context.Context,
	userId portainer.UserID,
	stack *portainer.Stack,
	endpoint *portainer.Endpoint,
) error {
	return d.remoteStack(
		ctx,
		userId,
		stack,
		endpoint,
		OperationSwarmStop,
		unpackerCmdBuilderOptions{},
	)
}

// Does all the heavy lifting:
// * connect to env
// * build the args for compose-unpacker
// * deploy compose-unpacker container
// * wait for deployment to end
// * gather deployment logs and bubble them up
func (d *stackDeployer) remoteStack(ctx context.Context, userID portainer.UserID, stack *portainer.Stack, endpoint *portainer.Endpoint, operation StackRemoteOperation, opts unpackerCmdBuilderOptions) error {
	if stack.WorkflowID != 0 && opts.gitConfig == nil {
		if err := d.dataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
			user, err := tx.User().Read(userID)
			if err != nil {
				return err
			}

			memberships, err := tx.TeamMembership().TeamMembershipsByUserID(userID)
			if err != nil {
				return err
			}

			userContext := source.NewUserContext(user, memberships)
			src, file, err := workflows.GitSourceAndArtifactForStack(tx, userContext, stack.WorkflowID, stack.ID)
			if err != nil {
				return errors.Wrap(err, "failed to load git config for remote stack")
			}

			if src != nil {
				opts.gitConfig = workflows.MergeSourceAndFile(src, file)
			}
			return nil
		}); err != nil {
			return err
		}
	}

	cli, err := d.createDockerClient(ctx, endpoint)
	if err != nil {
		return errors.WithMessage(err, "unable to create docker client")
	}
	defer logs.CloseAndLogErr(cli)

	unpackerImg := getUnpackerImage()
	log.Debug().Str("unpacker_image", unpackerImg).Msg("Resolved unpacker image")

	reader, err := cli.ImagePull(ctx, unpackerImg, image.PullOptions{})
	if err != nil {
		return errors.Wrap(err, "unable to pull unpacker image")
	}
	defer logs.CloseAndLogErr(reader)
	_, _ = io.Copy(io.Discard, reader)

	info, err := cli.Info(ctx)
	if err != nil {
		return errors.Wrap(err, "unable to get agent info")
	}
	// ensure the targetSocketBindHost is changed to podman for podman environments
	targetSocketBindHost := getTargetSocketBindHost(info.OSType, endpoint.ContainerEngine)
	targetSocketBindContainer := getTargetSocketBindContainer(info.OSType)

	composeDestination := filesystem.JoinPaths(stack.ProjectPath, composePathPrefix)

	opts.composeDestination = composeDestination

	cmd, err := d.buildUnpackerCmdForStack(stack, operation, opts)
	if err != nil {
		return errors.Wrap(err, "unable to build command for unpacker")
	}

	log.Debug().
		Str("image", unpackerImg).
		Str("cmd", strings.Join(cmd, " ")).
		Msg("running unpacker")

	unpackerContainer, err := cli.ContainerCreate(ctx, &container.Config{
		Image: unpackerImg,
		Cmd:   cmd,
	}, &container.HostConfig{
		Binds: []string{
			fmt.Sprintf("%s:%s", composeDestination, composeDestination),
			fmt.Sprintf("%s:%s", targetSocketBindHost, targetSocketBindContainer),
		},
	}, nil, nil, fmt.Sprintf("portainer-unpacker-%d-%s-%d", stack.ID, stack.Name, librand.Intn(100)))
	if err != nil {
		return errors.Wrap(err, "unable to create unpacker container")
	}
	defer func() {
		if err := cli.ContainerRemove(ctx, unpackerContainer.ID, container.RemoveOptions{}); err != nil {
			log.Warn().Err(err).Msg("unable to remove unpacker container")
		}
	}()

	if err := cli.ContainerStart(ctx, unpackerContainer.ID, container.StartOptions{}); err != nil {
		return errors.Wrap(err, "start unpacker container error")
	}

	statusCh, errCh := cli.ContainerWait(ctx, unpackerContainer.ID, container.WaitConditionNotRunning)
	select {
	case err := <-errCh:
		if err != nil {
			return errors.Wrap(err, "An error occurred while waiting for the deployment of the stack.")
		}
	case <-statusCh:
	}

	stdErr := &bytes.Buffer{}

	out, err := cli.ContainerLogs(ctx, unpackerContainer.ID, container.LogsOptions{ShowStdout: true, ShowStderr: true})
	if err != nil {
		log.Error().Err(err).Msg("unable to get logs from unpacker container")
	} else {
		if _, err := stdcopy.StdCopy(io.Discard, stdErr, out); err != nil {
			log.Warn().Err(err).Msg("unable to parse logs from unpacker container")
		} else {
			log.Info().
				Str("output", stdErr.String()).
				Msg("Stack deployment output")
		}
	}

	status, err := cli.ContainerInspect(ctx, unpackerContainer.ID)
	if err != nil {
		return errors.Wrap(err, "fetch container information error")
	}

	if status.State.ExitCode == 0 {
		return nil
	}

	dec := json.NewDecoder(stdErr)
	for {
		errorStruct := struct {
			Level string
			Error string
		}{}

		if err := dec.Decode(&errorStruct); errors.Is(err, io.EOF) {
			break
		} else if err != nil {
			log.Warn().Err(err).Msg("unable to parse logs from unpacker container")

			continue
		}

		if errorStruct.Level == "error" {
			return fmt.Errorf("an error occurred while running unpacker container with exit code %d: %s", status.State.ExitCode, errorStruct.Error)
		}
	}

	return fmt.Errorf("an error occurred while running unpacker container with exit code %d", status.State.ExitCode)
}

// Creates a docker client with 1 hour timeout
func (d *stackDeployer) createDockerClient(ctx context.Context, endpoint *portainer.Endpoint) (*dockerclient.Client, error) {
	timeout := 3600 * time.Second
	cli, err := d.ClientFactory.CreateClient(endpoint, "", &timeout)
	if err != nil {
		return nil, errors.Wrap(err, "unable to create Docker client")
	}

	info, err := cli.Info(ctx)
	if err != nil {
		return nil, errors.Wrap(err, "unable to get agent info")
	}

	if isNotInASwarm(&info) {
		return cli, nil
	}
	defer logs.CloseAndLogErr(cli)

	nodes, err := cli.NodeList(ctx, types.NodeListOptions{})
	if err != nil {
		return nil, errors.Wrap(err, "unable to list nodes")
	}

	if len(nodes) == 0 {
		return nil, errors.New("no nodes available")
	}

	var managerNode swarm.Node
	for _, node := range nodes {
		if node.ManagerStatus != nil && node.ManagerStatus.Leader {
			managerNode = node
			break
		}
	}

	if managerNode.ID == "" {
		return nil, errors.New("no leader node available")
	}

	return d.ClientFactory.CreateClient(endpoint, managerNode.Description.Hostname, &timeout)
}

func getUnpackerImage() string {
	image := os.Getenv(composeUnpackerImageEnvVar)
	if image == "" {
		image = defaultUnpackerImage
	}

	return image
}

func getTargetSocketBindHost(osType string, containerEngine string) string {
	targetSocketBind := "//./pipe/docker_engine"
	if strings.EqualFold(osType, "linux") {
		if containerEngine == portainer.ContainerEnginePodman {
			targetSocketBind = "/run/podman/podman.sock"
		} else {
			targetSocketBind = "/var/run/docker.sock"
		}
	}

	return targetSocketBind
}

func getTargetSocketBindContainer(osType string) string {
	targetSocketBind := "//./pipe/docker_engine"
	if strings.EqualFold(osType, "linux") {
		targetSocketBind = "/var/run/docker.sock"
	}

	return targetSocketBind
}

// Per https://stackoverflow.com/a/50590287 and Docker's LocalNodeState possible values
// `LocalNodeStateInactive` means the node is not in a swarm cluster
func isNotInASwarm(info *system.Info) bool {
	return info.Swarm.LocalNodeState == swarm.LocalNodeStateInactive
}
