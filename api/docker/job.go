package docker

import (
	"bytes"
	"context"
	"io"
	"io/ioutil"
	"strconv"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/api/types/strslice"
	"github.com/docker/docker/client"
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/archive"
)

// JobService represents a service that handles the execution of jobs
type JobService struct {
	DockerClientFactory *ClientFactory
}

// NewJobService returns a pointer to a new job service
func NewJobService(dockerClientFactory *ClientFactory) *JobService {
	return &JobService{
		DockerClientFactory: dockerClientFactory,
	}
}

// Execute will execute a script on the endpoint host with the supplied image as a container
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

	err = pullImage(cli, image)
	if err != nil {
		return err
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
		Cmd: strslice.StrSlice([]string{"sh", "/tmp/script.sh"}),
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

func pullImage(cli *client.Client, image string) error {
	imageReadCloser, err := cli.ImagePull(context.Background(), image, types.ImagePullOptions{})
	if err != nil {
		return err
	}
	defer imageReadCloser.Close()

	_, err = io.Copy(ioutil.Discard, imageReadCloser)
	if err != nil {
		return err
	}

	return nil
}
