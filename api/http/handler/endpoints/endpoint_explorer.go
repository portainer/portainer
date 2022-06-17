package endpoints

import (
	"bytes"
	"context"
	"fmt"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/client"
	"github.com/docker/docker/pkg/stdcopy"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	log "github.com/sirupsen/logrus"
	"io/ioutil"
	"net/http"
	"os/exec"
	"strings"
	"time"
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

var jsonEntry = []byte(`
{"result":[{"name":"bin -\u003e usr/bin","rights":"-rwxrwxrwx","size":"7","date":"2021-11-11 10:55:00","type":"file"},{"name":"boot","rights":"drwxr-xr-x","size":"4096","date":"2022-05-27 06:03:00","type":"dir"},{"name":"cdrom","rights":"drwxrwxr-x","size":"4096","date":"2021-11-11 10:55:00","type":"dir"},{"name":"data","rights":"drwxr-xr-x","size":"4096","date":"2022-01-20 08:19:00","type":"dir"},{"name":"dev","rights":"drwxr-xr-x","size":"4820","date":"2022-06-02 16:57:00","type":"dir"},{"name":"etc","rights":"drwxr-xr-x","size":"12288","date":"2022-06-03 06:49:00","type":"dir"},{"name":"home","rights":"drwxr-xr-x","size":"4096","date":"2021-11-19 10:27:00","type":"dir"},{"name":"lib -\u003e usr/lib","rights":"-rwxrwxrwx","size":"7","date":"2021-11-11 10:55:00","type":"file"},{"name":"lib32 -\u003e usr/lib32","rights":"-rwxrwxrwx","size":"9","date":"2021-11-11 10:55:00","type":"file"},{"name":"lib64 -\u003e usr/lib64","rights":"-rwxrwxrwx","size":"9","date":"2021-11-11 10:55:00","type":"file"},{"name":"libx32 -\u003e usr/libx32","rights":"-rwxrwxrwx","size":"10","date":"2021-11-11 10:55:00","type":"file"},{"name":"lost+found","rights":"drwx------","size":"16384","date":"2021-11-11 10:55:00","type":"dir"},{"name":"media","rights":"drwxr-xr-x","size":"4096","date":"2021-11-11 14:19:00","type":"dir"},{"name":"mnt","rights":"drwxr-xr-x","size":"4096","date":"2021-11-12 10:39:00","type":"dir"},{"name":"opt","rights":"drwxr-xr-x","size":"4096","date":"2022-05-30 17:33:00","type":"dir"},{"name":"proc","rights":"dr-xr-xr-x","size":"0","date":"2022-05-25 08:44:00","type":"dir"},{"name":"root","rights":"drwx------","size":"4096","date":"2022-06-02 17:33:00","type":"dir"},{"name":"run","rights":"drwxr-xr-x","size":"1360","date":"2022-06-07 10:47:00","type":"dir"},{"name":"sbin -\u003e usr/sbin","rights":"-rwxrwxrwx","size":"8","date":"2021-11-11 10:55:00","type":"file"},{"name":"snap","rights":"drwxr-xr-x","size":"4096","date":"2021-11-25 00:32:00","type":"dir"},{"name":"srv","rights":"drwxr-xr-x","size":"4096","date":"2020-04-23 15:32:00","type":"dir"},{"name":"sys","rights":"dr-xr-xr-x","size":"0","date":"2022-05-25 08:44:00","type":"dir"},{"name":"tmp","rights":"drwxrwxrw-","size":"12288","date":"2022-06-07 10:47:00","type":"dir"},{"name":"usr","rights":"drwxr-xr-x","size":"4096","date":"2020-04-23 15:34:00","type":"dir"},{"name":"var","rights":"drwxr-xr-x","size":"4096","date":"2020-04-23 15:42:00","type":"dir"}]}
`)

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

/*
docker exec 4ef06f706a584656e6d15df9f0c2674903595a3289ecc882a5b8e21485f6cfbc  ls --time-style=long-iso -1 -q -l --hide-control-chars /
*/
func dockerCliExec(endpoint *portainer.Endpoint, execID string) (data interface{}, err error) {
	//httpClient := client.NewHTTPClient()

	path := "/"
	param := "ls --time-style=long-iso -1 -q -l --hide-control-chars " + normalizePath(path) + " | awk '{n=split($0,array,\" \")} { for (i = 1; i <= 7; i++) {printf \"%s|\",array[i]}} { for (i = 8; i <= n; i++) {printf \"%s \",array[i]};print \"\"}'"

	cmd := exec.Command("docker", "exec", execID, param)

	out, err := cmd.Output()
	if err != nil {
		log.Fatalf("failed to list containers: %s", err)
	}

	return parseLsOutput(string(out)), err
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
