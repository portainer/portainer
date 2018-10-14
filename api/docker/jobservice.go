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
	buffer, err := archive.TarFileInBuffer(script, "script.sh", 0700)
	if err != nil {
		return err
	}

	cli, err := service.DockerClientFactory.CreateClient(endpoint)
	if err != nil {
		return err
	}
	defer cli.Close()

	// containerName := "test"

	// TODO this will run bash scripts
	cmd := make([]string, 2)
	cmd[0] = "bash"
	cmd[1] = "/tmp/script.sh"

	// TODO pull image

	containerConfig := &container.Config{
		AttachStdin:  true,
		AttachStdout: true,
		AttachStderr: true,
		Tty:          true,
		WorkingDir:   "/tmp",
		Image:        image,
		// TODO: can be useful to specify an id there? task exec id?
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

	body, err := cli.ContainerCreate(context.Background(), containerConfig, hostConfig, networkConfig, "")
	if err != nil {
		return err
	}

	copyOptions := types.CopyToContainerOptions{}
	err = cli.CopyToContainer(context.Background(), body.ID, "/tmp", bytes.NewReader(buffer), copyOptions)
	if err != nil {
		return err
	}

	startOptions := types.ContainerStartOptions{}
	err = cli.ContainerStart(context.Background(), body.ID, startOptions)
	if err != nil {
		return err
	}

	return nil
}
