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
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/archive"
)

// JobService represents a service that handles the execution of jobs
type JobService struct {
	dockerClientFactory *ClientFactory
}

// NewJobService returns a pointer to a new job service
func NewJobService(dockerClientFactory *ClientFactory) *JobService {
	return &JobService{
		dockerClientFactory: dockerClientFactory,
	}
}

// ExecuteScript will leverage a privileged container to execute a script against the specified endpoint/nodename.
// It will copy the script content specified as a parameter inside a container based on the specified image and execute it.
func (service *JobService) ExecuteScript(endpoint *portainer.Endpoint, nodeName, image string, script []byte, schedule *portainer.Schedule) error {
	buffer, err := archive.TarFileInBuffer(script, "script.sh", 0700)
	if err != nil {
		return err
	}

	cli, err := service.dockerClientFactory.CreateClient(endpoint, nodeName)
	if err != nil {
		return err
	}
	defer cli.Close()

	_, err = cli.Ping(context.Background())
	if err != nil {
		return portainer.ErrUnableToPingEndpoint
	}

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

	if schedule != nil {
		containerConfig.Labels["io.portainer.schedule.id"] = strconv.Itoa(int(schedule.ID))
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

	if schedule != nil {
		err = cli.ContainerRename(context.Background(), body.ID, schedule.Name+"_"+body.ID)
		if err != nil {
			return err
		}
	}

	copyOptions := types.CopyToContainerOptions{}
	err = cli.CopyToContainer(context.Background(), body.ID, "/tmp", bytes.NewReader(buffer), copyOptions)
	if err != nil {
		return err
	}

	startOptions := types.ContainerStartOptions{}
	return cli.ContainerStart(context.Background(), body.ID, startOptions)
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
