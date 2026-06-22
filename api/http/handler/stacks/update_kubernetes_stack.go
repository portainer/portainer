package stacks

import (
	"context"
	"net/http"
	"os"
	"strconv"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/source"
	"github.com/portainer/portainer/api/filesystem"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/git/update"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/registryutils"
	k "github.com/portainer/portainer/api/kubernetes"
	"github.com/portainer/portainer/api/stacks/deployments"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"

	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
)

type kubernetesFileStackUpdatePayload struct {
	StackFileContent string
	// Name of the stack
	StackName string
}

type kubernetesGitStackUpdatePayload struct {
	RepositoryReferenceName  string
	RepositoryAuthentication bool
	RepositoryUsername       string
	RepositoryPassword       string
	AutoUpdate               *portainer.AutoUpdateSettings
	TLSSkipVerify            bool
}

func (payload *kubernetesFileStackUpdatePayload) Validate(r *http.Request) error {
	if len(payload.StackFileContent) == 0 {
		return errors.New("Invalid stack file content")
	}

	return nil
}

func (payload *kubernetesGitStackUpdatePayload) Validate(r *http.Request) error {
	if err := update.ValidateAutoUpdateSettings(payload.AutoUpdate); err != nil {
		return err
	}

	return nil
}

func (handler *Handler) updateKubernetesStack(tx dataservices.DataStoreTx, r *http.Request, stack *portainer.Stack, endpoint *portainer.Endpoint, gate *deployGate) *httperror.HandlerError {

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	userContext := source.NewUserContext(securityContext.User, securityContext.UserMemberships)
	if stack.WorkflowID != 0 {
		gitConfig, sourceID, err := loadGitConfigForStack(tx, userContext, stack.WorkflowID, stack.ID)
		if err != nil {
			return httperror.InternalServerError("Unable to load git config for stack", err)
		}
		if gitConfig == nil {
			return httperror.InternalServerError("Stack has no git config in source", errors.New("source has no git config"))
		}

		// Stop the autoupdate job if there is any
		if stack.AutoUpdate != nil {
			deployments.StopAutoupdate(stack.ID, stack.AutoUpdate.JobID, handler.Scheduler)
		}

		var payload kubernetesGitStackUpdatePayload

		if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
			return httperror.BadRequest("Invalid request payload", err)
		}

		gitConfig.ReferenceName = payload.RepositoryReferenceName
		gitConfig.TLSSkipVerify = payload.TLSSkipVerify
		stack.AutoUpdate = payload.AutoUpdate

		if payload.RepositoryAuthentication {
			password := payload.RepositoryPassword
			if password == "" && gitConfig.Authentication != nil {
				password = gitConfig.Authentication.Password
			}

			gitConfig.Authentication = &gittypes.GitAuthentication{
				Username: payload.RepositoryUsername,
				Password: password,
			}

			if _, err := handler.GitService.LatestCommitID(
				context.TODO(),
				gitConfig.URL,
				gitConfig.ReferenceName,
				gitConfig.Authentication.Username,
				gitConfig.Authentication.Password,
				gitConfig.TLSSkipVerify,
			); err != nil {
				return httperror.InternalServerError("Unable to fetch git repository", err)
			}
		} else {
			gitConfig.Authentication = nil
		}

		if payload.AutoUpdate != nil && payload.AutoUpdate.Interval != "" {
			jobID, e := deployments.StartAutoupdate(context.TODO(), stack.ID, stack.AutoUpdate.Interval, handler.Scheduler, handler.StackDeployer, handler.DataStore, handler.GitService)
			if e != nil {
				return e
			}
			stack.AutoUpdate.JobID = jobID
		}

		if err := saveStackGitConfig(tx, userContext, stack.WorkflowID, stack.ID, sourceID, 0, gitConfig); err != nil {
			return httperror.InternalServerError("Unable to update source git config", err)
		}

		return nil
	}

	var payload kubernetesFileStackUpdatePayload

	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return httperror.BadRequest("Failed to retrieve user token data", err)
	}

	tempFileDir, _ := os.MkdirTemp("", "kub_file_content")

	if err := filesystem.WriteToFile(filesystem.JoinPaths(tempFileDir, stack.EntryPoint), []byte(payload.StackFileContent)); err != nil {
		return httperror.InternalServerError("Failed to persist deployment file in a temp directory", err)
	}

	if payload.StackName != stack.Name {
		stack.Name = payload.StackName
		if err := handler.DataStore.Stack().Update(stack.ID, stack); err != nil {
			return httperror.InternalServerError("Failed to update stack name", err)
		}
	}

	// Refresh ECR registry secret if needed
	// RefreshEcrSecret method checks if the namespace has any ECR registry
	// otherwise return nil
	cli, err := handler.KubernetesClientFactory.GetPrivilegedKubeClient(endpoint)
	if err == nil {
		if err := registryutils.RefreshEcrSecret(cli, endpoint, handler.DataStore, stack.Namespace); err != nil {
			log.Warn().Err(err).Msg("failed to refresh ECR registry secret")
		}
	}

	// Use temp dir as the stack project path for deployment
	// so if the deployment failed, the original file won't be over-written
	stack.ProjectPath = tempFileDir

	appLabels := k.KubeAppLabels{
		StackID:   int(stack.ID),
		StackName: stack.Name,
		Owner:     stack.CreatedBy,
		Kind:      "content",
	}

	copyStack := *stack
	user := &portainer.User{ID: tokenData.ID}
	k8sDeploymentConfig := deployments.CreateKubernetesStackDeploymentConfig(&copyStack, handler.KubernetesDeployer, appLabels, user, endpoint)

	stackFolder := strconv.Itoa(int(stack.ID))
	projectPath, err := handler.FileService.UpdateStoreStackFileFromBytes(stackFolder, stack.EntryPoint, []byte(payload.StackFileContent))
	if err != nil {
		if rollbackErr := handler.FileService.RollbackStackFile(stackFolder, stack.EntryPoint); rollbackErr != nil {
			log.Warn().Err(rollbackErr).Msg("rollback stack file error")
		}

		return httperror.InternalServerError("Unable to persist Kubernetes Manifest file on disk", err)
	}
	stack.ProjectPath = projectPath

	postDeploy := func(ctx context.Context, deployErr error) {
		defer func() {
			if err := os.RemoveAll(tempFileDir); err != nil {
				log.Warn().Err(err).Msg("failed to remove temporary stack deployment directory")
			}
		}()

		if deployErr == nil {
			if err := handler.FileService.RemoveStackFileBackup(stackFolder, stack.EntryPoint); err != nil {
				log.Warn().Err(err).Msg("remove stack file backup error")
			}
		}
	}

	go stackDeploy(handler.DataStore, copyStack.ID, k8sDeploymentConfig, gate, postDeploy)

	return nil
}
