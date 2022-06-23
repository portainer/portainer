package endpoints

import (
	"archive/tar"
	"bytes"
	"compress/gzip"
	"context"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
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

// @id endpointExplorer
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
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid environment identifier route variable", Err: err}
	}
	containerId, err := request.RetrieveRouteVariableValue(r, "containerId")
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid environment containerId", Err: err}
	}
	path, err := request.RetrieveMultiPartFormValue(r, "path", false)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid environment path", Err: err}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{StatusCode: http.StatusNotFound, Message: "Unable to find an environment with the specified identifier inside the database", Err: err}
	} else if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to find an environment with the specified identifier inside the database", Err: err}
	}
	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusForbidden, Message: "Permission denied to access environment", Err: err}
	}

	timeout := dockerClientTimeout
	docker, err := handler.DockerClientFactory.CreateClient(endpoint, containerId, &timeout)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to create Docker Client connection", Err: err}
	}
	defer docker.Close()

	cmdLine := []string{"ls", "--time-style=long-iso", "-1", "-q", "-l", "--hide-control-chars"}
	cmdLine = append(cmdLine, normalizePath(path))

	resp, err := containerRunCmd(docker, containerId, cmdLine)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "containerRunCmd error.", Err: err}
	}

	data := parseLsOutput(string(resp))
	return response.JSON(w, data)
}

// @id endpointExplorerCreate
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
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid environment identifier route variable", Err: err}
	}

	containerId, err := request.RetrieveRouteVariableValue(r, "containerId")
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid environment containerId", Err: err}
	}

	path, err := request.RetrieveMultiPartFormValue(r, "path", false)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid environment path", Err: err}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{StatusCode: http.StatusNotFound, Message: "Unable to find an environment with the specified identifier inside the database", Err: err}
	} else if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to find an environment with the specified identifier inside the database", Err: err}
	}

	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusForbidden, Message: "Permission denied to access environment", Err: err}
	}

	timeout := dockerClientTimeout
	docker, err := handler.DockerClientFactory.CreateClient(endpoint, containerId, &timeout)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to create Docker Client connection", Err: err}
	}
	defer docker.Close()

	cmdLine := []string{"mkdir"}
	cmdLine = append(cmdLine, normalizePath(path))

	_, err = containerRunCmd(docker, containerId, cmdLine)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "containerRunCmd error.", Err: err}
	}

	var resp = make(map[string]interface{}, 2)
	resp["result"] = "ok"
	resp["path"] = path

	return response.JSON(w, resp)
}

// @id endpointExplorerRemove
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
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid environment identifier route variable", Err: err}
	}

	containerId, err := request.RetrieveRouteVariableValue(r, "containerId")
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid environment containerId", Err: err}
	}

	path, err := request.RetrieveMultiPartFormValue(r, "path", false)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid environment path", Err: err}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{StatusCode: http.StatusNotFound, Message: "Unable to find an environment with the specified identifier inside the database", Err: err}
	} else if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to find an environment with the specified identifier inside the database", Err: err}
	}

	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusForbidden, Message: "Permission denied to access environment", Err: err}
	}

	timeout := dockerClientTimeout
	docker, err := handler.DockerClientFactory.CreateClient(endpoint, containerId, &timeout)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to create Docker Client connection", Err: err}
	}
	defer docker.Close()

	cmdLine := []string{"rm", "--interactive=never", "-r"}
	cmdLine = append(cmdLine, normalizePath(path))
	resp, err := containerRunCmd(docker, containerId, cmdLine)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "containerRunCmd error.", Err: err}
	}

	data := string(resp)
	return response.JSON(w, data)
}

func (Handler *Handler) DeleteTarFile(filename string) error {
	return os.RemoveAll(filename)
}

func (handler *Handler) cleanUp(projectPath string) error {
	err := handler.FileService.RemoveDirectory(projectPath)
	if err != nil {
		log.Printf("http error: Unable to cleanup stack creation (err=%s)\n", err)
	}
	return nil
}

// @id endpointExplorerUpload
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
// @router /endpoints/{id}/explorer/{containerId}/upload [post]
func (handler *Handler) endpointExplorerUpload(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid environment identifier route variable", Err: err}
	}

	containerId, err := request.RetrieveRouteVariableValue(r, "containerId")
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid environment containerId", Err: err}
	}

	reader, err := r.MultipartReader()
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid environment", Err: err}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return &httperror.HandlerError{StatusCode: http.StatusNotFound, Message: "Unable to find an environment with the specified identifier inside the database", Err: err}
	} else if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to find an environment with the specified identifier inside the database", Err: err}
	}

	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusForbidden, Message: "Permission denied to access environment", Err: err}
	}

	timeout := dockerClientTimeout
	docker, err := handler.DockerClientFactory.CreateClient(endpoint, containerId, &timeout)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to create Docker Client connection", Err: err}
	}
	defer docker.Close()

	projectPath, err := handler.FileService.GetTemporaryPath()
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to create temporary folder", Err: err}
	}
	defer handler.cleanUp(projectPath)

	destination := ""
	idx := 0
	var files []*os.File

	for {
		part, err := reader.NextPart()
		if err == io.EOF {
			break
		}

		if part.FormName() == "destination" {
			buf := new(bytes.Buffer)
			_, err := buf.ReadFrom(part)
			if err != nil {
				return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid environment", Err: err}
			}
			destination = buf.String()
		}
		if part.FileName() == "" {
			continue
		}
		if len(destination) == 0 {
			continue
		}
		fmt.Println("part.FileName = " + part.FileName() + "  destination=" + destination)

		absPath := projectPath + string(os.PathSeparator) + part.FileName()
		err = handler.FileService.StoreDockerContainerTempFile(absPath, part)
		if err != nil {
			return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "store temp file failed.", Err: err}
		}

		srcFile, err := os.Open(absPath)
		if err != nil {
			return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "store temp file failed.", Err: err}
		}
		defer srcFile.Close()
		files = append(files, srcFile)

		idx++
	}

	dest := filepath.Join(projectPath, "../") + string(os.PathSeparator) + filepath.Base(projectPath) + ".tar.gz"
	fmt.Println("gen tar file: " + dest)
	if err = Compress(files, dest); err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "store gzip files failed.", Err: err}
	}

	srcFile, err := os.Open(dest)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "store temp file failed.", Err: err}
	}
	defer func() {
		srcFile.Close()
		handler.DeleteTarFile(dest)
	}()

	ctx := context.TODO()
	if err = docker.CopyToContainer(ctx, containerId, destination, srcFile, types.CopyToContainerOptions{}); err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "CopyToContainer failed.", Err: err}
	}

	var resp = make(map[string]interface{}, 2)
	resp["result"] = "ok"
	resp["message"] = strconv.Itoa(idx) + " files uploaded successfully"
	return response.JSON(w, resp)
}

func Compress(files []*os.File, dest string) error {
	d, _ := os.Create(dest)
	defer d.Close()

	gw := gzip.NewWriter(d)
	defer gw.Close()

	tw := tar.NewWriter(gw)
	defer tw.Close()

	for _, file := range files {
		err := compress(file, "", tw)
		if err != nil {
			return err
		}
	}
	return nil
}

func compress(file *os.File, prefix string, tw *tar.Writer) error {
	info, err := file.Stat()
	if err != nil {
		return err
	}
	if info.IsDir() {
		prefix = prefix + "/" + info.Name()
		fileInfos, err := file.Readdir(-1)
		if err != nil {
			return err
		}
		for _, fi := range fileInfos {
			f, err := os.Open(file.Name() + "/" + fi.Name())
			if err != nil {
				return err
			}
			err = compress(f, prefix, tw)
			if err != nil {
				return err
			}
		}
	} else {
		header, err := tar.FileInfoHeader(info, "")
		header.Name = prefix + "/" + header.Name
		if err != nil {
			return err
		}
		err = tw.WriteHeader(header)
		if err != nil {
			return err
		}
		_, err = io.Copy(tw, file)
		file.Close()
		if err != nil {
			return err
		}
	}
	return nil
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

	resp, err := docker.ContainerExecAttach(ctx, execId.ID, types.ExecStartCheck{})

	var outBuf, errBuf bytes.Buffer
	outputDone := make(chan error)

	go func() {
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

	for _, line := range lines {
		if len(line) == 0 {
			continue
		}
		if strings.HasPrefix(line, "total") {
			continue
		}
		if strings.HasPrefix(line, "总用量") {
			continue
		}

		tokens := strings.Fields(line)
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
