package openamt

import (
	"context"
	"io"
	"io/ioutil"
	"log"
	"net/http"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/client"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"
	"github.com/sirupsen/logrus"
)

type OpenAMTHostInfo struct {
	Endpoint portainer.EndpointID
	Text     string
}

const (
	// TODO: this should get extracted to some configurable - don't assume Docker Hub is everyone's global namespace, or that they're allowed to pull images from the internet
	rpcGoImageName     = "ptrrd/openamt:rpc-go"
	rpcGoContainerName = "openamt-rpc-go"
)

// @id OpenAMTHostInfo
// @summary Request OpenAMT info from a node
// @description Request OpenAMT info from a node
// @description **Access policy**: administrator
// @tags intel
// @security jwt
// @produce json
// @success 200 "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied to access settings"
// @failure 500 "Server error"
// @router /open_amt/{id}/info [get]
func (handler *Handler) openAMTHostInfo(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid environment identifier route variable", err}
	}

	logrus.WithField("endpointID", endpointID).Info("OpenAMTHostInfo")

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err == bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{StatusCode: http.StatusNotFound, Message: "Unable to find an endpoint with the specified identifier inside the database", Err: err}
	} else if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to find an endpoint with the specified identifier inside the database", Err: err}
	}

	ctx := context.TODO()
	// pull the image so we can check if there's a new one
	// TODO: these should be able to be over-ridden (don't hardcode the assumption that secure users can access Docker Hub, or that its even the orchestrator's "global namespace")
	cmdLine := []string{"amtinfo", "--json"}
	output, err := handler.PullAndRunContainer(ctx, endpoint, rpcGoImageName, rpcGoContainerName, cmdLine)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: output, Err: err}
	}

	amtInfo := OpenAMTHostInfo{
		Endpoint: portainer.EndpointID(endpointID),
		Text:     output,
	}
	return response.JSON(w, amtInfo)
}

func (handler *Handler) PullAndRunContainer(ctx context.Context, endpoint *portainer.Endpoint, imageName, containerName string, cmdLine []string) (output string, err error) {
	// TODO: this should not be Docker specific
	// TODO: extract from this Handler into something global.

	// TODO: start
	//      docker run --rm -it --privileged ptrrd/openamt:rpc-go amtinfo
	//		on the Docker standalone node (one per env :)
	//		and later, on the specified node in the swarm, or kube.
	nodeName := ""
	docker, err := handler.DockerClientFactory.CreateClient(endpoint, nodeName)
	if err != nil {
		return "Unable to create Docker Client connection", err
	}
	defer docker.Close()

	if err := pullImage(ctx, docker, imageName); err != nil {
		return "Could not pull image from registry", err
	}

	output, err = runContainer(ctx, docker, imageName, containerName, cmdLine)
	if err != nil {
		return "Could not run container", err
	}
	return output, nil
}

// TODO: ideally, pullImage and runContainer will become a simple version of the use compose abstraction that can be called from withing Portainer.
// TODO: the idea being that if we have an internal struct of a parsed compose file, we can also populate that struct programatically, and run it to get the result I'm getting here.
// TODO: likeley an upgrade and abstraction of DeployComposeStack/DeploySwarmStack/DeployKubernetesStack
// pullImage will pull the image to the specified environment
// TODO: add k8s implementation
// TODO: work out registry auth
func pullImage(ctx context.Context, docker *client.Client, imageName string) error {
	r, err := docker.ImagePull(ctx, imageName, types.ImagePullOptions{})
	if err != nil {
		logrus.WithError(err).WithField("imageName", imageName).Error("Could not pull image from registry")
		return err
	}
	// yeah, swiped this, need to figure out a good way to wait til its done...
	b := make([]byte, 8)
	for {
		_, err := r.Read(b)
		// TODO: should convert json text to a struct and show just the text messages
		//if n > 0 {
		//fmt.Printf(string(b))
		//}
		if err == io.EOF {
			break
		}
	}
	r.Close()

	return nil
}

// TODO: ideally, pullImage and runContainer will become a simple version of the use compose abstraction that can be called from withing Portainer.
// runContainer should be used to run a short command that returns information to stdout
// TODO: add k8s support
func runContainer(ctx context.Context, docker *client.Client, imageName, containerName string, cmdLine []string) (output string, err error) {
	envs := []string{}
	create, err := docker.ContainerCreate(
		ctx,
		&container.Config{
			Image:        imageName,
			Cmd:          cmdLine,
			Env:          envs,
			Tty:          true,
			OpenStdin:    true,
			AttachStdout: true,
			AttachStderr: true,
		},
		&container.HostConfig{
			Privileged: true,
		},
		&network.NetworkingConfig{},
		nil,
		containerName)
	if err != nil {
		logrus.WithError(err).WithField("imagename", imageName).WithField("containername", containerName).Error("creating container")
		return "", err
	}
	err = docker.ContainerStart(ctx, create.ID, types.ContainerStartOptions{})
	if err != nil {
		logrus.WithError(err).WithField("imagename", imageName).WithField("containername", containerName).Error("starting container")
		return "", err
	}

	log.Printf("%s container created and started\n", containerName)

	statusCh, errCh := docker.ContainerWait(ctx, create.ID, container.WaitConditionNotRunning)
	var statusCode int64
	select {
	case err := <-errCh:
		if err != nil {
			logrus.WithError(err).WithField("imagename", imageName).WithField("containername", containerName).Error("starting container")
			return "", err
		}
	case status := <-statusCh:
		statusCode = status.StatusCode
	}
	logrus.WithField("status", statusCode).Debug("container wait status")

	out, err := docker.ContainerLogs(ctx, create.ID, types.ContainerLogsOptions{ShowStdout: true})
	if err != nil {
		logrus.WithError(err).WithField("imagename", imageName).WithField("containername", containerName).Error("getting container log")
		return "", err
	}

	err = docker.ContainerRemove(ctx, create.ID, types.ContainerRemoveOptions{})
	if err != nil {
		logrus.WithError(err).WithField("imagename", imageName).WithField("containername", containerName).Error("removing container")
		return "", err
	}

	outputBytes, err := ioutil.ReadAll(out)
	if err != nil {
		logrus.WithError(err).WithField("imagename", imageName).WithField("containername", containerName).Error("read container output")
		return "", err
	}
	return string(outputBytes), nil
}
