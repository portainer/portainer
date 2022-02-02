package openamt

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/portainer/portainer/api/hostmanagement/openamt"
	"io/ioutil"
	"log"
	"net/http"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"

	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/client"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/dataservices/errors"
	"github.com/sirupsen/logrus"
)

type HostInfo struct {
	EndpointID     portainer.EndpointID `json:"EndpointID"`
	RawOutput      string               `json:"RawOutput"`
	AMT            string               `json:"AMT"`
	UUID           string               `json:"UUID"`
	DNSSuffix      string               `json:"DNS Suffix"`
	BuildNumber    string               `json:"Build Number"`
	ControlMode    string               `json:"Control Mode"`
	ControlModeRaw int                  `json:"Control Mode (Raw)"`
}

const (
	// TODO: this should get extracted to some configurable - don't assume Docker Hub is everyone's global namespace, or that they're allowed to pull images from the internet
	rpcGoImageName      = "ptrrd/openamt:rpc-go-json"
	rpcGoContainerName  = "openamt-rpc-go"
	dockerClientTimeout = 5 * time.Minute
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

	amtInfo, output, err := handler.getEndpointAMTInfo(endpoint)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: output, Err: err}
	}

	return response.JSON(w, amtInfo)
}

func (handler *Handler) getEndpointAMTInfo(endpoint *portainer.Endpoint) (*HostInfo, string, error) {
	ctx := context.TODO()

	// pull the image so we can check if there's a new one
	// TODO: these should be able to be over-ridden (don't hardcode the assumption that secure users can access Docker Hub, or that its even the orchestrator's "global namespace")
	cmdLine := []string{"amtinfo", "--json"}
	output, err := handler.PullAndRunContainer(ctx, endpoint, rpcGoImageName, rpcGoContainerName, cmdLine)
	if err != nil {
		return nil, output, err
	}

	amtInfo := HostInfo{}
	_ = json.Unmarshal([]byte(output), &amtInfo)

	amtInfo.EndpointID = endpoint.ID
	amtInfo.RawOutput = output

	return &amtInfo, "", nil
}

func (handler *Handler) PullAndRunContainer(ctx context.Context, endpoint *portainer.Endpoint, imageName, containerName string, cmdLine []string) (output string, err error) {
	// TODO: this should not be Docker specific
	// TODO: extract from this Handler into something global.

	// TODO: start
	//      docker run --rm -it --privileged ptrrd/openamt:rpc-go amtinfo
	//		on the Docker standalone node (one per env :)
	//		and later, on the specified node in the swarm, or kube.
	nodeName := ""
	timeout := dockerClientTimeout
	docker, err := handler.DockerClientFactory.CreateClient(endpoint, nodeName, &timeout)
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
// TODO: the idea being that if we have an internal struct of a parsed compose file, we can also populate that struct programmatically, and run it to get the result I'm getting here.
// TODO: likely an upgrade and abstraction of DeployComposeStack/DeploySwarmStack/DeployKubernetesStack
// pullImage will pull the image to the specified environment
// TODO: add k8s implementation
// TODO: work out registry auth
func pullImage(ctx context.Context, docker *client.Client, imageName string) error {
	out, err := docker.ImagePull(ctx, imageName, types.ImagePullOptions{})
	if err != nil {
		logrus.WithError(err).WithField("imageName", imageName).Error("Could not pull image from registry")
		return err
	}

	defer out.Close()
	outputBytes, err := ioutil.ReadAll(out)
	if err != nil {
		logrus.WithError(err).WithField("imageName", imageName).Error("Could not read image pull output")
		return err
	}

	log.Printf("%s imaged pulled with output:\n%s", imageName, string(outputBytes))

	return nil
}

// TODO: ideally, pullImage and runContainer will become a simple version of the use compose abstraction that can be called from withing Portainer.
// runContainer should be used to run a short command that returns information to stdout
// TODO: add k8s support
func runContainer(ctx context.Context, docker *client.Client, imageName, containerName string, cmdLine []string) (output string, err error) {
	opts := types.ContainerListOptions{All: true}
	opts.Filters = filters.NewArgs()
	opts.Filters.Add("name", containerName)
	existingContainers, err := docker.ContainerList(ctx, opts)
	if err != nil {
		logrus.WithError(err).WithField("imagename", imageName).WithField("containername", containerName).Error("listing existing container")
		return "", err
	}

	if len(existingContainers) > 0 {
		err = docker.ContainerRemove(ctx, existingContainers[0].ID, types.ContainerRemoveOptions{Force: true})
		if err != nil {
			logrus.WithError(err).WithField("imagename", imageName).WithField("containername", containerName).Error("removing existing container")
			return "", err
		}
	}

	created, err := docker.ContainerCreate(
		ctx,
		&container.Config{
			Image:        imageName,
			Cmd:          cmdLine,
			Env:          []string{},
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
		containerName,
	)
	if err != nil {
		logrus.WithError(err).WithField("imagename", imageName).WithField("containername", containerName).Error("creating container")
		return "", err
	}
	err = docker.ContainerStart(ctx, created.ID, types.ContainerStartOptions{})
	if err != nil {
		logrus.WithError(err).WithField("imagename", imageName).WithField("containername", containerName).Error("starting container")
		return "", err
	}

	log.Printf("%s container created and started\n", containerName)

	statusCh, errCh := docker.ContainerWait(ctx, created.ID, container.WaitConditionNotRunning)
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

	out, err := docker.ContainerLogs(ctx, created.ID, types.ContainerLogsOptions{ShowStdout: true})
	if err != nil {
		logrus.WithError(err).WithField("imagename", imageName).WithField("containername", containerName).Error("getting container log")
		return "", err
	}

	err = docker.ContainerRemove(ctx, created.ID, types.ContainerRemoveOptions{})
	if err != nil {
		logrus.WithError(err).WithField("imagename", imageName).WithField("containername", containerName).Error("removing container")
		return "", err
	}

	outputBytes, err := ioutil.ReadAll(out)
	if err != nil {
		logrus.WithError(err).WithField("imagename", imageName).WithField("containername", containerName).Error("read container output")
		return "", err
	}

	log.Printf("%s container finished with output:\n%s", containerName, string(outputBytes))

	return string(outputBytes), nil
}

func (handler *Handler) activateDevice(endpoint *portainer.Endpoint, settings portainer.Settings) error {
	ctx := context.TODO()

	config := settings.OpenAMTConfiguration
	cmdLine := []string{
		"activate",
		"-n",
		"-v",
		"-u", fmt.Sprintf("wss://%s/activate", config.MPSServer),
		"-profile", openamt.DefaultProfileName,
		"-d", config.DomainName,
		"-password", config.MPSPassword,
	}

	_, err := handler.PullAndRunContainer(ctx, endpoint, rpcGoImageName, rpcGoContainerName, cmdLine)
	if err != nil {
		return err
	}

	return nil
}

func (handler *Handler) deactivateDevice(endpoint *portainer.Endpoint, settings portainer.Settings) error {
	ctx := context.TODO()

	config := settings.OpenAMTConfiguration
	cmdLine := []string{
		"deactivate",
		"-n",
		"-v",
		"-u", fmt.Sprintf("wss://%s/activate", config.MPSServer),
		"-password", config.MPSPassword,
	}
	_, err := handler.PullAndRunContainer(ctx, endpoint, rpcGoImageName, rpcGoContainerName, cmdLine)
	if err != nil {
		return err
	}

	return nil
}
