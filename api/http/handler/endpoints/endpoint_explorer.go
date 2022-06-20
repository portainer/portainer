package endpoints

import (
	"bytes"
	"context"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/client"
	"github.com/docker/docker/pkg/stdcopy"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
)

const dockerClientTimeout = 5 * time.Minute

type ListDirResp struct {
	Result []ListDirEntry `json:"result" binding:"Required"`
}

type ListDirEntry struct {
	Name   string `json:"name" binding:"Required"`
	Rights string `json:"rights" binding:"Required"`
	Size   string `json:"size" binding:"Required"`
	Date   string `json:"date" binding:"Required"`
	Type   string `json:"type" binding:"Required"`
}

// @id EndpointExplorer
// @summary Inspect an environment(endpoint)
// @description Retrieve details about an environment(endpoint).
// @description **Access policy**: restricted
// @tags endpoints
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @success 200 {object} portainer.Endpoint "Success"
// @failure 400 "Invalid request"
// @failure 404 "Environment(Endpoint) not found"
// @failure 500 "Server error"
// @router /endpoints/{id}/explorer/{containerId}/list [post]
func (handler *Handler) endpointExplorer(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid environment identifier route variable", err}
	}

	containerId, err := request.RetrieveRouteVariableValue(r, "containerId")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid environment containerId", err}
	}

	path, err := request.RetrieveMultiPartFormValue(r, "path", false)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid environment path", err}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an environment with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an environment with the specified identifier inside the database", err}
	}

	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to access environment", err}
	}

	//"4ef06f706a584656e6d15df9f0c2674903595a3289ecc882a5b8e21485f6cfbc"
	timeout := dockerClientTimeout
	docker, err := handler.DockerClientFactory.CreateClient(endpoint, containerId, &timeout)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to create Docker Client connection", err}
	}
	defer docker.Close()

	cmdLine := []string{"ls", "--time-style=long-iso", "-1", "-q", "-l", "--hide-control-chars"}
	cmdLine = append(cmdLine, normalizePath(path))

	resp, err := containerRunCmd(docker, containerId, cmdLine)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "containerRunCmd error.", err}
	}

	data := parseLsOutput(string(resp))
	return response.JSON(w, data)
}

// @id EndpointExplorerCreate
// @summary Inspect an environment(endpoint)
// @description Retrieve details about an environment(endpoint).
// @description **Access policy**: restricted
// @tags endpoints
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @success 200 {object} portainer.Endpoint "Success"
// @failure 400 "Invalid request"
// @failure 404 "Environment(Endpoint) not found"
// @failure 500 "Server error"
// @router /endpoints/{id}/explorer/{containerId}/create [post]
func (handler *Handler) endpointExplorerCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid environment identifier route variable", err}
	}

	containerId, err := request.RetrieveRouteVariableValue(r, "containerId")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid environment containerId", err}
	}

	path, err := request.RetrieveMultiPartFormValue(r, "path", false)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid environment path", err}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an environment with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an environment with the specified identifier inside the database", err}
	}

	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to access environment", err}
	}

	//"4ef06f706a584656e6d15df9f0c2674903595a3289ecc882a5b8e21485f6cfbc"
	timeout := dockerClientTimeout
	docker, err := handler.DockerClientFactory.CreateClient(endpoint, containerId, &timeout)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to create Docker Client connection", err}
	}
	defer docker.Close()

	cmdLine := []string{"mkdir"}
	cmdLine = append(cmdLine, normalizePath(path))

	_, err = containerRunCmd(docker, containerId, cmdLine)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "containerRunCmd error.", err}
	}

	var resp = make(map[string]interface{}, 2)
	resp["result"] = "ok"
	resp["path"] = path

	return response.JSON(w, resp)
}

// @id EndpointExplorerCreate
// @summary Inspect an environment(endpoint)
// @description Retrieve details about an environment(endpoint).
// @description **Access policy**: restricted
// @tags endpoints
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @success 200 {object} portainer.Endpoint "Success"
// @failure 400 "Invalid request"
// @failure 404 "Environment(Endpoint) not found"
// @failure 500 "Server error"
// @router /endpoints/{id}/explorer/{containerId}/remove [post]
func (handler *Handler) endpointExplorerRemove(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid environment identifier route variable", err}
	}

	containerId, err := request.RetrieveRouteVariableValue(r, "containerId")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid environment containerId", err}
	}

	path, err := request.RetrieveMultiPartFormValue(r, "path", false)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid environment path", err}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an environment with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an environment with the specified identifier inside the database", err}
	}

	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to access environment", err}
	}

	//"4ef06f706a584656e6d15df9f0c2674903595a3289ecc882a5b8e21485f6cfbc"
	timeout := dockerClientTimeout
	docker, err := handler.DockerClientFactory.CreateClient(endpoint, containerId, &timeout)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to create Docker Client connection", err}
	}
	defer docker.Close()

	cmdLine := []string{"rm", "--interactive=never", "-r"}
	cmdLine = append(cmdLine, normalizePath(path))

	resp, err := containerRunCmd(docker, containerId, cmdLine)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "containerRunCmd error.", err}
	}

	data := string(resp)
	return response.JSON(w, data)
}

func containerRunCmd(docker *client.Client, containerId string, cmd []string) ([]byte, error) {
	ctx := context.TODO()
	cfg := types.ExecConfig{
		AttachStderr: true,
		AttachStdout: true,
		AttachStdin:  false,
		Detach:       false,
		Tty:          false,
		Cmd:          cmd,
	}
	execId, err := docker.ContainerExecCreate(ctx, containerId, cfg)
	if err != nil {
		return nil, err
	}

	fmt.Println("execId = " + execId.ID)
	resp, err := docker.ContainerExecAttach(ctx, execId.ID, types.ExecStartCheck{})

	//var outBuf bytes.Buffer
	var outBuf, errBuf bytes.Buffer
	outputDone := make(chan error)

	go func() {
		// StdCopy demultiplexes the stream into two buffers
		_, err = stdcopy.StdCopy(&outBuf, &errBuf, resp.Reader)
		outputDone <- err
	}()

	select {
	case err := <-outputDone:
		if err != nil {
			return outBuf.Bytes(), err
		}
		break
	case <-ctx.Done():
		return outBuf.Bytes(), ctx.Err()
	}

	stdout, err := ioutil.ReadAll(&outBuf)
	if err != nil {
		return outBuf.Bytes(), err
	}
	stderr, err := ioutil.ReadAll(&errBuf)
	if err != nil {
		fmt.Println("stderr = ", stderr)
		return outBuf.Bytes(), err
	}

	info, err := docker.ContainerExecInspect(ctx, execId.ID)
	if err != nil {
		return outBuf.Bytes(), err
	}

	if info.ExitCode != 0 {
		return outBuf.Bytes(), fmt.Errorf("`%s` exited with code %d", cmd, info.ExitCode)
	}
	return stdout, nil
}

func normalizePath(path string) string {
	if !strings.HasPrefix(path, "/") {
		return "/" + path
	}
	return path
}

func parseLsOutput(lsout string) []ListDirEntry {
	lines := strings.Split(lsout, "\n")
	var results []ListDirEntry

	for idx, line := range lines {
		if len(line) == 0 {
			continue
		}
		if strings.HasPrefix(line, "total") {
			continue
		}

		if strings.HasPrefix(line, "总用量") {
			continue
		}

		// our Dirty LS Fix with AWK return line as follow:
		// drwxr-xr-x|2|root|root|4096|2016-07-13|17:47|bin
		//tmpTokens := strings.SplitN(line, "|", 8)
		//var tokens []string
		//for _, token := range tmpTokens {
		//	tokens = append(tokens, strings.TrimSpace(token))
		//}

		tokens := strings.Fields(line)

		fmt.Println(idx, line)

		// fmt.Println(tokens)
		if len(tokens) >= 8 {
			ftype := "file"
			if strings.HasPrefix(tokens[0], "d") {
				ftype = "dir"
			}

			rights := tokens[0]
			if strings.HasPrefix(rights, "l") {
				rights = strings.Replace(rights, "l", "-", 1)
			}
			if strings.HasSuffix(rights, "t") {
				rights = strings.Replace(rights, "t", "-", 1)
			}

			results = append(results, ListDirEntry{Name: tokens[7], Rights: rights, Size: tokens[4], Date: tokens[5] + " " + tokens[6] + ":00", Type: ftype})
		}
	}
	return results
}
