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
	return nil
}

func (handler *Handler) updateKubernetesStack(r *http.Request, stack *portainer.Stack, endpoint *portainer.Endpoint) *httperror.HandlerError {

	if stack.GitConfig != nil {
		var payload kubernetesGitStackUpdatePayload

		if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
			return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid request payload", Err: err}
		}

		stack.GitConfig.ReferenceName = payload.RepositoryReferenceName
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
		return nil
	}

	var payload kubernetesFileStackUpdatePayload

	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid request payload", Err: err}
	}

	_, err = handler.deployKubernetesStack(r, endpoint, payload.StackFileContent, stack.IsComposeFormat, stack.Namespace, k.KubeAppLabels{
		StackID: int(stack.ID),
		Name:    stack.Name,
		Owner:   stack.CreatedBy,
		Kind:    "content",
	})

	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to deploy Kubernetes stack via file content", Err: err}
	}

	stackFolder := strconv.Itoa(int(stack.ID))
	_, err = handler.FileService.StoreStackFileFromBytes(stackFolder, stack.EntryPoint, []byte(payload.StackFileContent))
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to persist Kubernetes manifest file on disk", Err: err}
	}

	return nil
}
