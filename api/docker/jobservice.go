package docker

import (
	"bytes"
	"context"
	"strconv"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/api/types/strslice"
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/archive"
)

type JobService struct {
	DockerClientFactory *ClientFactory
}

func NewJobService(dockerClientFactory *ClientFactory) *JobService {
	return &JobService{
		DockerClientFactory: dockerClientFactory,
	}
}

func (service *JobService) Execute(endpoint *portainer.Endpoint, image string, script []byte) error {
	buffer, createFileErr := archive.TarFileInBuffer(script, "script.sh", 0700)
	if createFileErr != nil {
		return createFileErr
	}

	cli, createClientErr := service.DockerClientFactory.CreateClient(endpoint)
	if createClientErr != nil {
		return createClientErr
	}
	defer cli.Close()

	// containerName := "test"

	// TODO this will run only bash scripts
	cmd := make([]string, 2)
	cmd[0] = "sh"
	cmd[1] = "/tmp/script.sh"

	_, imagePullErr := cli.ImagePull(context.Background(), image, types.ImagePullOptions{})
	if imagePullErr != nil {
		return imagePullErr
	}

	containerConfig := &container.Config{
		AttachStdin:  true,
		AttachStdout: true,
		AttachStderr: true,
		Tty:          true,
		WorkingDir:   "/tmp",
		Image:        image,
		Labels: map[string]string{
			"io.portainer.job.endpoint": strconv.Itoa(int(endpoint.ID)),
		},
		Cmd: strslice.StrSlice(cmd),
	}

	hostConfig := &container.HostConfig{
		Binds:       []string{"/:/host", "/etc:/etc:ro", "/usr:/usr:ro", "/run:/run:ro", "/sbin:/sbin:ro", "/var:/var:ro"},
		NetworkMode: "host",
		Privileged:  true,
	}

	networkConfig := &network.NetworkingConfig{}

	body, containerCreateErr := cli.ContainerCreate(context.Background(), containerConfig, hostConfig, networkConfig, "")
	if containerCreateErr != nil {
		return containerCreateErr
	}

	copyOptions := types.CopyToContainerOptions{}
	copyErr := cli.CopyToContainer(context.Background(), body.ID, "/tmp", bytes.NewReader(buffer), copyOptions)
	if copyErr != nil {
		return copyErr
	}

	startOptions := types.ContainerStartOptions{}
	containerStartErr := cli.ContainerStart(context.Background(), body.ID, startOptions)
	if containerStartErr != nil {
		return containerStartErr
	}

	return nil
}
