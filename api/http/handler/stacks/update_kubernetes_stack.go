package stacks

import (
	"net/http"
	"strconv"

	"github.com/asaskevich/govalidator"
	"github.com/pkg/errors"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	portainer "github.com/portainer/portainer/api"
	gittypes "github.com/portainer/portainer/api/git/types"
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

	stackFolder := strconv.Itoa(int(stack.ID))
	projectPath, err := handler.FileService.StoreStackFileFromBytes(stackFolder, stack.EntryPoint, []byte(payload.StackFileContent))
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to persist Kubernetes manifest file on disk", Err: err}
	}
	stack.ProjectPath = projectPath

	_, err = handler.deployKubernetesStack(r, endpoint, stack, k.KubeAppLabels{
		StackID: int(stack.ID),
		Name:    stack.Name,
		Owner:   stack.CreatedBy,
		Kind:    "content",
	})

	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to deploy Kubernetes stack via file content", Err: err}
	}

	return nil
}
