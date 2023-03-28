package deployments

import (
	"context"
	"fmt"
	"io"
	"math/rand"
	"os"
	"strings"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/swarm"
	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/rs/zerolog/log"

	dockerclient "github.com/docker/docker/client"
)

const (
	defaultUnpackerImage       = "portainer/compose-unpacker:latest"
	composeUnpackerImageEnvVar = "COMPOSE_UNPACKER_IMAGE"
	composePathPrefix          = "portainer-compose-unpacker"
)

type RemoteStackDeployer interface {
	// compose
	DeployRemoteComposeStack(stack *portainer.Stack, endpoint *portainer.Endpoint, registries []portainer.Registry, forcePullImage bool, forceRecreate bool) error
	UndeployRemoteComposeStack(stack *portainer.Stack, endpoint *portainer.Endpoint) error
	StartRemoteComposeStack(stack *portainer.Stack, endpoint *portainer.Endpoint) error
	StopRemoteComposeStack(stack *portainer.Stack, endpoint *portainer.Endpoint) error
	// swarm
	DeployRemoteSwarmStack(stack *portainer.Stack, endpoint *portainer.Endpoint, registries []portainer.Registry, prune bool, pullImage bool) error
	UndeployRemoteSwarmStack(stack *portainer.Stack, endpoint *portainer.Endpoint) error
	StartRemoteSwarmStack(stack *portainer.Stack, endpoint *portainer.Endpoint) error
	StopRemoteSwarmStack(stack *portainer.Stack, endpoint *portainer.Endpoint) error
}

// Deploy a compose stack on remote environment using a https://github.com/portainer/compose-unpacker container
func (d *stackDeployer) DeployRemoteComposeStack(stack *portainer.Stack, endpoint *portainer.Endpoint, registries []portainer.Registry, forcePullImage bool, forceRecreate bool) error {
	d.lock.Lock()
	defer d.lock.Unlock()

	d.swarmStackManager.Login(registries, endpoint)
	defer d.swarmStackManager.Logout(endpoint)
	// --force-recreate doesn't pull updated images
	if forcePullImage {
		err := d.composeStackManager.Pull(context.TODO(), stack, endpoint)
		if err != nil {
			return err
		}
	}

	return d.remoteStack(stack, endpoint, unpackerCmdBuilderOptions{
		stackOperation: OperationDeploy,
		registries:     registries,
	})
}

// Undeploy a compose stack on remote environment using a https://github.com/portainer/compose-unpacker container
func (d *stackDeployer) UndeployRemoteComposeStack(stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	d.lock.Lock()
	defer d.lock.Unlock()

	return d.remoteStack(stack, endpoint, unpackerCmdBuilderOptions{
		stackOperation: OperationUndeploy,
	})
}

// Start a compose stack on remote environment using a https://github.com/portainer/compose-unpacker container
func (d *stackDeployer) StartRemoteComposeStack(stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	return d.remoteStack(stack, endpoint, unpackerCmdBuilderOptions{
		stackOperation: OperationComposeStart,
	})
}

// Stop a compose stack on remote environment using a https://github.com/portainer/compose-unpacker container
func (d *stackDeployer) StopRemoteComposeStack(stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	return d.remoteStack(stack, endpoint, unpackerCmdBuilderOptions{
		stackOperation: OperationComposeStop,
	})
}

// Deploy a swarm stack on remote environment using a https://github.com/portainer/compose-unpacker container
func (d *stackDeployer) DeployRemoteSwarmStack(stack *portainer.Stack, endpoint *portainer.Endpoint, registries []portainer.Registry, prune bool, pullImage bool) error {
	d.lock.Lock()
	defer d.lock.Unlock()

	d.swarmStackManager.Login(registries, endpoint)
	defer d.swarmStackManager.Logout(endpoint)

	return d.remoteStack(stack, endpoint, unpackerCmdBuilderOptions{
		stackOperation: OperationSwarmDeploy,
		pullImage:      pullImage,
		prune:          prune,
		registries:     registries,
	})
}

// Undeploy a swarm stack on remote environment using a https://github.com/portainer/compose-unpacker container
func (d *stackDeployer) UndeployRemoteSwarmStack(stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	d.lock.Lock()
	defer d.lock.Unlock()

	return d.remoteStack(stack, endpoint, unpackerCmdBuilderOptions{
		stackOperation: OperationSwarmUndeploy,
	})
}

// Start a swarm stack on remote environment using a https://github.com/portainer/compose-unpacker container
func (d *stackDeployer) StartRemoteSwarmStack(stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	return d.remoteStack(stack, endpoint, unpackerCmdBuilderOptions{
		stackOperation: OperationSwarmStart,
	})
}

// Stop a swarm stack on remote environment using a https://github.com/portainer/compose-unpacker container
func (d *stackDeployer) StopRemoteSwarmStack(stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	return d.remoteStack(stack, endpoint, unpackerCmdBuilderOptions{
		stackOperation: OperationSwarmStop,
	})
}

// Does all the heavy lifting:
// * connect to env
// * build the args for compose-unpacker
// * deploy compose-unpacker container
// * wait for deployment to end
// * gather deployment logs and bubble them up
func (d *stackDeployer) remoteStack(stack *portainer.Stack, endpoint *portainer.Endpoint, opts unpackerCmdBuilderOptions) error {
	ctx := context.TODO()

	cli, err := d.createDockerClient(ctx, endpoint)
	if err != nil {
		return errors.WithMessage(err, "unable to create docker client")
	}
	defer cli.Close()

	image := getUnpackerImage()

	reader, err := cli.ImagePull(ctx, image, types.ImagePullOptions{})
	if err != nil {
		return errors.Wrap(err, "unable to pull unpacker image")
	}
	defer reader.Close()
	io.Copy(io.Discard, reader)

	info, err := cli.Info(ctx)
	if err != nil {
		return errors.Wrap(err, "unable to get agent info")
	}
	targetSocketBind := getTargetSocketBind(info.OSType)

	composeDestination := filesystem.JoinPaths(stack.ProjectPath, composePathPrefix)

	opts.composeDestination = composeDestination

	cmd := d.buildUnpackerCmdForStack(stack, opts)

	log.Debug().
		Str("image", image).
		Str("cmd", strings.Join(cmd, " ")).
		Msg("running unpacker")

	rand.Seed(time.Now().UnixNano())
	resp, err := cli.ContainerCreate(ctx, &container.Config{
		Image: image,
		Cmd:   cmd,
	}, &container.HostConfig{
		Binds: []string{
			fmt.Sprintf("%s:%s", composeDestination, composeDestination),
			fmt.Sprintf("%s:%s", targetSocketBind, targetSocketBind),
		},
	}, nil, nil, fmt.Sprintf("portainer-unpacker-%d-%s-%d", stack.ID, stack.Name, rand.Intn(100)))

	defer cli.ContainerRemove(ctx, resp.ID, types.ContainerRemoveOptions{})

	if err != nil {
		return errors.Wrap(err, "unable to create unpacker container")
	}

	if err := cli.ContainerStart(ctx, resp.ID, types.ContainerStartOptions{}); err != nil {
		return errors.Wrap(err, "start unpacker container error")
	}

	statusCh, errCh := cli.ContainerWait(ctx, resp.ID, container.WaitConditionNotRunning)
	select {
	case err := <-errCh:
		if err != nil {
			return errors.Wrap(err, "An error occurred while waiting for the deployment of the stack.")
		}
	case <-statusCh:
	}

	out, err := cli.ContainerLogs(ctx, resp.ID, types.ContainerLogsOptions{ShowStdout: true, ShowStderr: true})
	if err != nil {
		log.Error().Err(err).Msg("unable to get logs from unpacker container")
	} else {
		outputBytes, err := io.ReadAll(out)
		if err != nil {
			log.Error().Err(err).Msg("unable to parse logs from unpacker container")
		} else {
			log.Info().
				Str("output", string(outputBytes)).
				Msg("Stack deployment output")
		}
	}

	status, err := cli.ContainerInspect(ctx, resp.ID)
	if err != nil {
		return errors.Wrap(err, "fetch container information error")
	}

	if status.State.ExitCode != 0 {
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

	// only for swarm
	info, err := cli.Info(ctx)
	if err != nil {
		return nil, errors.Wrap(err, "unable to get agent info")
	}

	// if swarm - create client for swarm leader
	if info.Swarm.LocalNodeState == swarm.LocalNodeStateInactive {
		return cli, nil
	}
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

	cli.Close()
	return d.ClientFactory.CreateClient(endpoint, managerNode.Description.Hostname, &timeout)
}

func getUnpackerImage() string {
	image := os.Getenv(composeUnpackerImageEnvVar)
	if image == "" {
		image = defaultUnpackerImage
	}

	return image
}

func getTargetSocketBind(osType string) string {
	targetSocketBind := "//./pipe/docker_engine"
	if strings.EqualFold(osType, "linux") {
		targetSocketBind = "/var/run/docker.sock"
	}
	return targetSocketBind
}
