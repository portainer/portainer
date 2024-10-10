package customtemplates

import (
	"net/http"
	"os"
	"sync"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/stacks/stackutils"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"

	"github.com/rs/zerolog/log"
)

// @id CustomTemplateGitFetch
// @summary Fetch the latest config file content based on custom template's git repository configuration
// @description Retrieve details about a template created from git repository method.
// @description **Access policy**: authenticated
// @tags custom_templates
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param id path int true "Template identifier"
// @success 200 {object} fileResponse "Success"
// @failure 400 "Invalid request"
// @failure 404 "Custom template not found"
// @failure 500 "Server error"
// @router /custom_templates/{id}/git_fetch [put]
func (handler *Handler) customTemplateGitFetch(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	customTemplateID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid Custom template identifier route variable", err)
	}

	customTemplate, err := handler.DataStore.CustomTemplate().Read(portainer.CustomTemplateID(customTemplateID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find a custom template with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find a custom template with the specified identifier inside the database", err)
	}

	if customTemplate.GitConfig == nil {
		return httperror.BadRequest("Git configuration does not exist in this custom template", err)
	}

	// If multiple users are trying to fetch the same custom template simultaneously, a lock needs to be added
	mu, ok := handler.gitFetchMutexs[portainer.TemplateID(customTemplateID)]
	if !ok {
		mu = &sync.Mutex{}
		handler.gitFetchMutexs[portainer.TemplateID(customTemplateID)] = mu
	}
	mu.Lock()
	defer mu.Unlock()

	// back up the current custom template folder
	backupPath, err := backupCustomTemplate(customTemplate.ProjectPath)
	if err != nil {
		return httperror.InternalServerError("Failed to backup the custom template folder", err)
	}

	// remove backup custom template folder
	defer cleanUpBackupCustomTemplate(backupPath)

	commitHash, err := stackutils.DownloadGitRepository(*customTemplate.GitConfig, handler.GitService, func() string {
		return customTemplate.ProjectPath
	})
	if err != nil {
		log.Warn().Err(err).Msg("failed to download git repository")

		if rbErr := rollbackCustomTemplate(backupPath, customTemplate.ProjectPath); rbErr != nil {
			return httperror.InternalServerError("Failed to rollback the custom template folder", rbErr)
		}

		return httperror.InternalServerError("Failed to download git repository", err)
	}

	if customTemplate.GitConfig.ConfigHash != commitHash {
		customTemplate.GitConfig.ConfigHash = commitHash

		if err := handler.DataStore.CustomTemplate().Update(customTemplate.ID, customTemplate); err != nil {
			return httperror.InternalServerError("Unable to persist custom template changes inside the database", err)
		}
	}

	fileContent, err := handler.FileService.GetFileContent(customTemplate.ProjectPath, customTemplate.GitConfig.ConfigFilePath)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve custom template file from disk", err)
	}

	return response.JSON(w, &fileResponse{FileContent: string(fileContent)})
}

func backupCustomTemplate(projectPath string) (string, error) {
	stat, err := os.Stat(projectPath)
	if err != nil {
		return "", err
	}

	backupPath := projectPath + "-backup"
	if err := os.Rename(projectPath, backupPath); err != nil {
		return "", err
	}

	return backupPath, os.Mkdir(projectPath, stat.Mode())
}

func rollbackCustomTemplate(backupPath, projectPath string) error {
	if err := os.RemoveAll(projectPath); err != nil {
		return err
	}

	return os.Rename(backupPath, projectPath)
}

func cleanUpBackupCustomTemplate(backupPath string) error {
	return os.RemoveAll(backupPath)
}
