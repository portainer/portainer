package stacks

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"strconv"

	"github.com/asaskevich/govalidator"
	"github.com/pkg/errors"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/http/security"
	k "github.com/portainer/portainer/api/kubernetes"
)

type kubernetesFileStackUpdatePayload struct {
	StackFileContent string
}

type kubernetesGitStackUpdatePayload struct {
	RepositoryReferenceName  string
	RepositoryAuthentication bool
	RepositoryUsername       string
	RepositoryPassword       string
	AutoUpdate               *portainer.StackAutoUpdate
}

func (payload *kubernetesFileStackUpdatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.StackFileContent) {
		return errors.New("Invalid stack file content")
	}
	return nil
}

func (payload *kubernetesGitStackUpdatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.RepositoryReferenceName) {
		payload.RepositoryReferenceName = defaultGitReferenceName
	}
	if err := validateStackAutoUpdate(payload.AutoUpdate); err != nil {
		return err
	}
	return nil
}

func (handler *Handler) updateKubernetesStack(r *http.Request, stack *portainer.Stack, endpoint *portainer.Endpoint) *httperror.HandlerError {

	if stack.GitConfig != nil {
		//stop the autoupdate job if there is any
		if stack.AutoUpdate != nil {
			stopAutoupdate(stack.ID, stack.AutoUpdate.JobID, *handler.Scheduler)
		}

		var payload kubernetesGitStackUpdatePayload

		if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
			return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid request payload", Err: err}
		}

		stack.GitConfig.ReferenceName = payload.RepositoryReferenceName
		stack.AutoUpdate = payload.AutoUpdate

		if payload.RepositoryAuthentication {
			password := payload.RepositoryPassword
			if password == "" && stack.GitConfig != nil && stack.GitConfig.Authentication != nil {
				password = stack.GitConfig.Authentication.Password
			}
			stack.GitConfig.Authentication = &gittypes.GitAuthentication{
				Username: payload.RepositoryUsername,
				Password: password,
			}
			_, err := handler.GitService.LatestCommitID(stack.GitConfig.URL, stack.GitConfig.ReferenceName, stack.GitConfig.Authentication.Username, stack.GitConfig.Authentication.Password)
			if err != nil {
				return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to fetch git repository", Err: err}
			}
		} else {
			stack.GitConfig.Authentication = nil
		}

		if payload.AutoUpdate != nil && payload.AutoUpdate.Interval != "" {
			jobID, e := startAutoupdate(stack.ID, stack.AutoUpdate.Interval, handler.Scheduler, handler.StackDeployer, handler.DataStore, handler.GitService)
			if e != nil {
				return e
			}
			stack.AutoUpdate.JobID = jobID
		}

		return nil
	}

	var payload kubernetesFileStackUpdatePayload

	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid request payload", Err: err}
	}

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Failed to retrieve user token data", Err: err}
	}

	tempFileDir, _ := ioutil.TempDir("", "kub_file_content")
	defer os.RemoveAll(tempFileDir)

	if err := filesystem.WriteToFile(filesystem.JoinPaths(tempFileDir, stack.EntryPoint), []byte(payload.StackFileContent)); err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Failed to persist deployment file in a temp directory", Err: err}
	}

	//use temp dir as the stack project path for deployment
	//so if the deployment failed, the original file won't be over-written
	stack.ProjectPath = tempFileDir

	_, err = handler.deployKubernetesStack(tokenData.ID, endpoint, stack, k.KubeAppLabels{
		StackID:   int(stack.ID),
		StackName: stack.Name,
		Owner:     stack.CreatedBy,
		Kind:      "content",
	})

	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to deploy Kubernetes stack via file content", Err: err}
	}

	stackFolder := strconv.Itoa(int(stack.ID))
	projectPath, err := handler.FileService.StoreStackFileFromBytes(stackFolder, stack.EntryPoint, []byte(payload.StackFileContent))
	if err != nil {
		fileType := "Manifest"
		if stack.IsComposeFormat {
			fileType = "Compose"
		}
		errMsg := fmt.Sprintf("Unable to persist Kubernetes %s file on disk", fileType)
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: errMsg, Err: err}
	}
	stack.ProjectPath = projectPath

	return nil
}
