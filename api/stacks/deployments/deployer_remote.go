package deployments

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"math/rand"
	"os"
	"strings"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"

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
	DeployRemoteComposeStack(stack *portainer.Stack, endpoint *portainer.Endpoint, registries []portainer.Registry, forcePullImage bool, forceRecreate bool) error
	UndeployRemoteComposeStack(stack *portainer.Stack, endpoint *portainer.Endpoint) error
	StartRemoteComposeStack(stack *portainer.Stack, endpoint *portainer.Endpoint, registries []portainer.Registry) error
	StopRemoteComposeStack(stack *portainer.Stack, endpoint *portainer.Endpoint) error
	// swarm
	DeployRemoteSwarmStack(stack *portainer.Stack, endpoint *portainer.Endpoint, registries []portainer.Registry, prune bool, pullImage bool) error
	UndeployRemoteSwarmStack(stack *portainer.Stack, endpoint *portainer.Endpoint) error
	StartRemoteSwarmStack(stack *portainer.Stack, endpoint *portainer.Endpoint, registries []portainer.Registry) error
	StopRemoteSwarmStack(stack *portainer.Stack, endpoint *portainer.Endpoint) error
}

// Deploy a compose stack on remote environment using a https://github.com/portainer/compose-unpacker container
func (d *stackDeployer) DeployRemoteComposeStack(
	stack *portainer.Stack,
	endpoint *portainer.Endpoint,
	registries []portainer.Registry,
	forcePullImage bool,
	forceRecreate bool,
) error {
	d.lock.Lock()
	defer d.lock.Unlock()

	d.swarmStackManager.Login(registries, endpoint)
	defer d.swarmStackManager.Logout(endpoint)

	// --force-recreate doesn't pull updated images
	if forcePullImage {
		if err := d.composeStackManager.Pull(context.TODO(), stack, endpoint, portainer.ComposeOptions{}); err != nil {
			return err
		}
	}

	return d.remoteStack(
		stack,
		endpoint,
		OperationDeploy,
		unpackerCmdBuilderOptions{
			forceRecreate: forceRecreate,
			registries:    registries,
		},
	)
}

// Undeploy a compose stack on remote environment using a https://github.com/portainer/compose-unpacker container
func (d *stackDeployer) UndeployRemoteComposeStack(stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	d.lock.Lock()
	defer d.lock.Unlock()

	return d.remoteStack(stack, endpoint, OperationUndeploy, unpackerCmdBuilderOptions{})
}

// Start a compose stack on remote environment using a https://github.com/portainer/compose-unpacker container
func (d *stackDeployer) StartRemoteComposeStack(
	stack *portainer.Stack,
	endpoint *portainer.Endpoint,
	registries []portainer.Registry,
) error {
	return d.remoteStack(
		stack,
		endpoint,
		OperationComposeStart,
		unpackerCmdBuilderOptions{
			registries: registries,
		},
	)
}

// Stop a compose stack on remote environment using a https://github.com/portainer/compose-unpacker container
func (d *stackDeployer) StopRemoteComposeStack(stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	return d.remoteStack(stack, endpoint, OperationComposeStop, unpackerCmdBuilderOptions{})
}

// Deploy a swarm stack on remote environment using a https://github.com/portainer/compose-unpacker container
func (d *stackDeployer) DeployRemoteSwarmStack(
	stack *portainer.Stack,
	endpoint *portainer.Endpoint,
	registries []portainer.Registry,
	prune bool,
	pullImage bool,
) error {
	d.lock.Lock()
	defer d.lock.Unlock()

	d.swarmStackManager.Login(registries, endpoint)
	defer d.swarmStackManager.Logout(endpoint)

	return d.remoteStack(stack, endpoint, OperationSwarmDeploy, unpackerCmdBuilderOptions{
		pullImage:     pullImage,
		prune:         prune,
		forceRecreate: stack.AutoUpdate != nil && stack.AutoUpdate.ForceUpdate,
		registries:    registries,
	})
}

// Undeploy a swarm stack on remote environment using a https://github.com/portainer/compose-unpacker container
func (d *stackDeployer) UndeployRemoteSwarmStack(stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	d.lock.Lock()
	defer d.lock.Unlock()

	return d.remoteStack(stack, endpoint, OperationSwarmUndeploy, unpackerCmdBuilderOptions{})
}

// Start a swarm stack on remote environment using a https://github.com/portainer/compose-unpacker container
func (d *stackDeployer) StartRemoteSwarmStack(
	stack *portainer.Stack,
	endpoint *portainer.Endpoint,
	registries []portainer.Registry,
) error {
	return d.remoteStack(
		stack,
		endpoint,
		OperationSwarmStart,
		unpackerCmdBuilderOptions{
			registries: registries,
		},
	)
}

// Stop a swarm stack on remote environment using a https://github.com/portainer/compose-unpacker container
func (d *stackDeployer) StopRemoteSwarmStack(stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	return d.remoteStack(stack, endpoint, OperationSwarmStop, unpackerCmdBuilderOptions{})
}

// Does all the heavy lifting:
// * connect to env
// * build the args for compose-unpacker
// * deploy compose-unpacker container
// * wait for deployment to end
// * gather deployment logs and bubble them up
func (d *stackDeployer) remoteStack(stack *portainer.Stack, endpoint *portainer.Endpoint, operation StackRemoteOperation, opts unpackerCmdBuilderOptions) error {
	ctx := context.TODO()

	cli, err := d.createDockerClient(ctx, endpoint)
	if err != nil {
		return errors.WithMessage(err, "unable to create docker client")
	}
	defer cli.Close()

	unpackerImg := getUnpackerImage()

	reader, err := cli.ImagePull(ctx, unpackerImg, image.PullOptions{})
	if err != nil {
		return errors.Wrap(err, "unable to pull unpacker image")
	}
	defer reader.Close()
	io.Copy(io.Discard, reader)

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
	}, nil, nil, fmt.Sprintf("portainer-unpacker-%d-%s-%d", stack.ID, stack.Name, rand.Intn(100)))

	if err != nil {
		return errors.Wrap(err, "unable to create unpacker container")
	}
	defer cli.ContainerRemove(ctx, unpackerContainer.ID, container.RemoveOptions{})

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
		_, err = stdcopy.StdCopy(io.Discard, stdErr, out)
		if err != nil {
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

	if status.State.ExitCode != 0 {
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

	return nil
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
	defer cli.Close()

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
