package docker

import (
	"context"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	dockerclient "github.com/portainer/portainer/api/docker/client"
	"github.com/portainer/portainer/api/docker/images"

	"github.com/Masterminds/semver"
	"github.com/docker/docker/api/types"
	dockercontainer "github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/network"
	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
)

type ContainerService struct {
	factory   *dockerclient.ClientFactory
	dataStore dataservices.DataStore
	sr        *serviceRestore
}

func NewContainerService(factory *dockerclient.ClientFactory, dataStore dataservices.DataStore) *ContainerService {
	return &ContainerService{
		factory:   factory,
		dataStore: dataStore,
		sr:        &serviceRestore{},
	}
}

// applyVersionConstraint uses the version to apply a transformation function to
// the value when the constraint is satisfied
func applyVersionConstraint[T any](currentVersion, versionConstraint string, value T, transform func(T) T) (T, error) {
	newValue := value

	constraint, err := semver.NewConstraint(versionConstraint)
	if err != nil {
		return newValue, errors.New("invalid version constraint specified")
	}

	currentVer, err := semver.NewVersion(currentVersion)
	if err != nil {
		log.Warn().Err(err).Msg("Unable to parse the Docker client version")

		return newValue, nil
	}

	if satisfiesConstraint, _ := constraint.Validate(currentVer); satisfiesConstraint {
		newValue = transform(value)
	}

	return newValue, nil
}

func clearMacAddrs(n network.NetworkingConfig) network.NetworkingConfig {
	netConfig := network.NetworkingConfig{
		EndpointsConfig: make(map[string]*network.EndpointSettings),
	}

	for k := range n.EndpointsConfig {
		endpointConfig := n.EndpointsConfig[k].Copy()
		endpointConfig.MacAddress = ""
		netConfig.EndpointsConfig[k] = endpointConfig
	}

	return netConfig
}

// Recreate a container
func (c *ContainerService) Recreate(ctx context.Context, endpoint *portainer.Endpoint, containerId string, forcePullImage bool, imageTag, nodeName string) (*types.ContainerJSON, error) {
	cli, err := c.factory.CreateClient(endpoint, nodeName, nil)
	if err != nil {
		return nil, errors.Wrap(err, "create client error")
	}
	defer cli.Close()

	log.Debug().Str("container_id", containerId).Msg("starting to fetch container information")

	container, _, err := cli.ContainerInspectWithRaw(ctx, containerId, true)
	if err != nil {
		return nil, errors.Wrap(err, "fetch container information error")
	}

	log.Debug().Str("image", container.Config.Image).Msg("starting to parse image")
	img, err := images.ParseImage(images.ParseImageOptions{
		Name: container.Config.Image,
	})
	if err != nil {
		return nil, errors.Wrap(err, "parse image error")
	}

	if imageTag != "" {
		if err := img.WithTag(imageTag); err != nil {
			return nil, errors.Wrapf(err, "set image tag error %s", imageTag)
		}

		log.Debug().Str("image", container.Config.Image).Msg("new image with tag")

		container.Config.Image = img.FullName()
	}

	// 1. pull image if you need force pull
	if forcePullImage {
		puller := images.NewPuller(cli, images.NewRegistryClient(c.dataStore), c.dataStore)
		if err := puller.Pull(ctx, img); err != nil {
			return nil, errors.Wrapf(err, "pull image error %s", img.FullName())
		}
	}

	// 2. stop the current container
	log.Debug().Str("container_id", containerId).Msg("starting to stop the container")
	if err := cli.ContainerStop(ctx, containerId, dockercontainer.StopOptions{}); err != nil {
		return nil, errors.Wrap(err, "stop container error")
	}

	// 3. rename the current container
	log.Debug().Str("container_id", containerId).Msg("starting to rename the container")
	if err := cli.ContainerRename(ctx, containerId, container.Name+"-old"); err != nil {
		return nil, errors.Wrap(err, "rename container error")
	}

	initialNetwork := network.NetworkingConfig{
		EndpointsConfig: make(map[string]*network.EndpointSettings),
	}

	// 4. disconnect all networks from the current container
	for name, network := range container.NetworkSettings.Networks {
		// This allows new container to use the same IP address if specified
		if err := cli.NetworkDisconnect(ctx, network.NetworkID, containerId, true); err != nil {
			return nil, errors.Wrap(err, "disconnect network from old container error")
		}

		// 5. get the first network attached to the current container
		if len(initialNetwork.EndpointsConfig) == 0 {
			// Retrieve the first network that is linked to the present container, which
			// will be utilized when creating the container.
			initialNetwork.EndpointsConfig[name] = network
		}
	}
	c.sr.enable()
	defer c.sr.close()
	defer c.sr.restore()

	c.sr.push(func() {
		log.Debug().Str("container_id", containerId).Str("container", container.Name).Msg("restoring the container")
		cli.ContainerRename(ctx, containerId, container.Name)

		for _, network := range container.NetworkSettings.Networks {
			cli.NetworkConnect(ctx, network.NetworkID, containerId, network)
		}

		cli.ContainerStart(ctx, containerId, dockercontainer.StartOptions{})
	})

	log.Debug().Str("container", strings.Split(container.Name, "/")[1]).Msg("starting to create a new container")

	// 6. create a new container
	// when a container is created without a network, docker connected it by default to the
	// bridge network with a random IP, also it can only connect to one network on creation.
	// to retain the same network settings we have to connect on creation to one of the old
	// container's networks, and connect to the other networks after creation.
	// see: https://portainer.atlassian.net/browse/EE-5448

	// Docker API < 1.44 does not support specifying MAC addresses
	// https://github.com/moby/moby/blob/6aea26b431ea152a8b085e453da06ea403f89886/client/container_create.go#L44-L46
	initialNetwork, err = applyVersionConstraint(cli.ClientVersion(), "< 1.44", initialNetwork, clearMacAddrs)
	if err != nil {
		return nil, err
	}

	create, err := cli.ContainerCreate(ctx, container.Config, container.HostConfig, &initialNetwork, nil, container.Name)

	c.sr.push(func() {
		log.Debug().Str("container_id", create.ID).Msg("removing the new container")
		cli.ContainerStop(ctx, create.ID, dockercontainer.StopOptions{})
		cli.ContainerRemove(ctx, create.ID, dockercontainer.RemoveOptions{})
	})

	if err != nil {
		return nil, errors.Wrap(err, "create container error")
	}

	newContainerId := create.ID

	// 7. connect to networks
	// docker can connect to only one network at creation, so we need to connect to networks after creation
	// see https://github.com/moby/moby/issues/17750
	log.Debug().Str("container_id", newContainerId).Msg("connecting networks to container")
	networks := container.NetworkSettings.Networks
	for key, network := range networks {
		if _, ok := initialNetwork.EndpointsConfig[key]; ok {
			// skip the network that is used during container creation
			continue
		}

		if err := cli.NetworkConnect(ctx, network.NetworkID, newContainerId, network); err != nil {
			return nil, errors.Wrap(err, "connect container network error")
		}
	}

	// 8. start the new container
	log.Debug().Str("container_id", newContainerId).Msg("starting the new container")
	if err := cli.ContainerStart(ctx, newContainerId, dockercontainer.StartOptions{}); err != nil {
		return nil, errors.Wrap(err, "start container error")
	}

	// 9. delete the old container
	log.Debug().Str("container_id", containerId).Msg("starting to remove the old container")
	_ = cli.ContainerRemove(ctx, containerId, dockercontainer.RemoveOptions{})

	c.sr.disable()

	newContainer, _, err := cli.ContainerInspectWithRaw(ctx, newContainerId, true)
	if err != nil {
		return nil, errors.Wrap(err, "fetch container information error")
	}

	return &newContainer, nil
}

type serviceRestore struct {
	restoreC chan struct{}
	fs       []func()
}

func (sr *serviceRestore) enable() {
	sr.restoreC = make(chan struct{}, 1)
	sr.fs = make([]func(), 0)
	sr.restoreC <- struct{}{}
}

func (sr *serviceRestore) disable() {
	select {
	case <-sr.restoreC:
	default:
	}
}

func (sr *serviceRestore) push(f func()) {
	sr.fs = append(sr.fs, f)
}

func (sr *serviceRestore) restore() {
	select {
	case <-sr.restoreC:
		l := len(sr.fs)
		if l > 0 {
			for i := l - 1; i >= 0; i-- {
				sr.fs[i]()
			}
		}
	default:
	}
}

func (sr *serviceRestore) close() {
	if sr == nil || sr.restoreC == nil {
		return
	}

	select {
	case <-sr.restoreC:
	default:
	}

	close(sr.restoreC)
}
