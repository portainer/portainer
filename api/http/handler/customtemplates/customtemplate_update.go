package customtemplates

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/git"
	gittypes "github.com/portainer/portainer/api/git/types"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"

	"github.com/asaskevich/govalidator"
)

type customTemplateUpdatePayload struct {
	// URL of the template's logo
	Logo string `example:"https://portainer.io/img/logo.svg"`
	// Title of the template
	Title string `example:"Nginx" validate:"required"`
	// Description of the template
	Description string `example:"High performance web server" validate:"required"`
	// A note that will be displayed in the UI. Supports HTML content
	Note string `example:"This is my <b>custom</b> template"`
	// Platform associated to the template.
	// Valid values are: 1 - 'linux', 2 - 'windows'
	// Required for Docker stacks
	Platform portainer.CustomTemplatePlatform `example:"1" enums:"1,2"`
	// Type of created stack (1 - swarm, 2 - compose, 3 - kubernetes)
	Type portainer.StackType `example:"1" enums:"1,2,3" validate:"required"`
	// URL of a Git repository hosting the Stack file
	RepositoryURL string `example:"https://github.com/openfaas/faas" validate:"required"`
	// Reference name of a Git repository hosting the Stack file
	RepositoryReferenceName string `example:"refs/heads/master"`
	// Use basic authentication to clone the Git repository
	RepositoryAuthentication bool `example:"true"`
	// Username used in basic authentication. Required when RepositoryAuthentication is true
	// and RepositoryGitCredentialID is 0
	RepositoryUsername string `example:"myGitUsername"`
	// Password used in basic authentication. Required when RepositoryAuthentication is true
	// and RepositoryGitCredentialID is 0
	RepositoryPassword string `example:"myGitPassword"`
	// GitCredentialID used to identify the bound git credential. Required when RepositoryAuthentication
	// is true and RepositoryUsername/RepositoryPassword are not provided
	RepositoryGitCredentialID int `example:"0"`
	// Path to the Stack file inside the Git repository
	ComposeFilePathInRepository string `example:"docker-compose.yml" default:"docker-compose.yml"`
	// Content of stack file
	FileContent string `validate:"required"`
	// Definitions of variables in the stack file
	Variables []portainer.CustomTemplateVariableDefinition
	// TLSSkipVerify skips SSL verification when cloning the Git repository
	TLSSkipVerify bool `example:"false"`
	// IsComposeFormat indicates if the Kubernetes template is created from a Docker Compose file
	IsComposeFormat bool `example:"false"`
}

func (payload *customTemplateUpdatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Title) {
		return errors.New("Invalid custom template title")
	}
	if govalidator.IsNull(payload.FileContent) && govalidator.IsNull(payload.RepositoryURL) {
		return errors.New("Either file content or git repository url need to be provided")
	}
	if payload.Type != portainer.KubernetesStack && payload.Platform != portainer.CustomTemplatePlatformLinux && payload.Platform != portainer.CustomTemplatePlatformWindows {
		return errors.New("Invalid custom template platform")
	}
	if payload.Type != portainer.KubernetesStack && payload.Type != portainer.DockerSwarmStack && payload.Type != portainer.DockerComposeStack {
		return errors.New("Invalid custom template type")
	}
	if govalidator.IsNull(payload.Description) {
		return errors.New("Invalid custom template description")
	}
	if !isValidNote(payload.Note) {
		return errors.New("Invalid note. <img> tag is not supported")
	}

	if payload.RepositoryAuthentication && (govalidator.IsNull(payload.RepositoryUsername) || govalidator.IsNull(payload.RepositoryPassword)) {
		return errors.New("Invalid repository credentials. Username and password must be specified when authentication is enabled")
	}
	if govalidator.IsNull(payload.ComposeFilePathInRepository) {
		payload.ComposeFilePathInRepository = filesystem.ComposeFileDefaultName
	}

	err := validateVariablesDefinitions(payload.Variables)
	if err != nil {
		return err
	}

	return nil
}

// @id CustomTemplateUpdate
// @summary Update a template
// @description Update a template.
// @description **Access policy**: authenticated
// @tags custom_templates
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Template identifier"
// @param body body customTemplateUpdatePayload true "Template details"
// @success 200 {object} portainer.CustomTemplate "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied to access template"
// @failure 404 "Template not found"
// @failure 500 "Server error"
// @router /custom_templates/{id} [put]
func (handler *Handler) customTemplateUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	customTemplateID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid Custom template identifier route variable", err)
	}

	var payload customTemplateUpdatePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	customTemplates, err := handler.DataStore.CustomTemplate().ReadAll()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve custom templates from the database", err)
	}

	for _, existingTemplate := range customTemplates {
		if existingTemplate.ID != portainer.CustomTemplateID(customTemplateID) && existingTemplate.Title == payload.Title {
			return httperror.InternalServerError("Template name must be unique", errors.New("Template name must be unique"))
		}
	}

	customTemplate, err := handler.DataStore.CustomTemplate().Read(portainer.CustomTemplateID(customTemplateID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find a custom template with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find a custom template with the specified identifier inside the database", err)
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	access := userCanEditTemplate(customTemplate, securityContext)
	if !access {
		return httperror.Forbidden("Access denied to resource", httperrors.ErrResourceAccessDenied)
	}

	customTemplate.Title = payload.Title
	customTemplate.Logo = payload.Logo
	customTemplate.Description = payload.Description
	customTemplate.Note = payload.Note
	customTemplate.Platform = payload.Platform
	customTemplate.Type = payload.Type
	customTemplate.Variables = payload.Variables
	customTemplate.IsComposeFormat = payload.IsComposeFormat

	if payload.RepositoryURL != "" {
		if !govalidator.IsURL(payload.RepositoryURL) {
			return httperror.BadRequest("Invalid repository URL. Must correspond to a valid URL format", err)
		}

		gitConfig := &gittypes.RepoConfig{
			URL:            payload.RepositoryURL,
			ReferenceName:  payload.RepositoryReferenceName,
			ConfigFilePath: payload.ComposeFilePathInRepository,
			TLSSkipVerify:  payload.TLSSkipVerify,
		}

		repositoryUsername := ""
		repositoryPassword := ""
		if payload.RepositoryAuthentication {
			repositoryUsername = payload.RepositoryUsername
			repositoryPassword = payload.RepositoryPassword
			gitConfig.Authentication = &gittypes.GitAuthentication{
				Username: payload.RepositoryUsername,
				Password: payload.RepositoryPassword,
			}
		}

		cleanBackup, err := git.CloneWithBackup(handler.GitService, handler.FileService, git.CloneOptions{
			ProjectPath:   customTemplate.ProjectPath,
			URL:           gitConfig.URL,
			ReferenceName: gitConfig.ReferenceName,
			Username:      repositoryUsername,
			Password:      repositoryPassword,
			TLSSkipVerify: gitConfig.TLSSkipVerify,
		})
		if err != nil {
			return httperror.InternalServerError("Unable to clone git repository directory", err)
		}

		defer cleanBackup()

		commitHash, err := handler.GitService.LatestCommitID(gitConfig.URL, gitConfig.ReferenceName, repositoryUsername, repositoryPassword, gitConfig.TLSSkipVerify)
		if err != nil {
			return httperror.InternalServerError("Unable get latest commit id", fmt.Errorf("failed to fetch latest commit id of the template %v: %w", customTemplate.ID, err))
		}

		gitConfig.ConfigHash = commitHash
		customTemplate.GitConfig = gitConfig
	} else {
		templateFolder := strconv.Itoa(customTemplateID)
		_, err = handler.FileService.StoreCustomTemplateFileFromBytes(templateFolder, customTemplate.EntryPoint, []byte(payload.FileContent))
		if err != nil {
			return httperror.InternalServerError("Unable to persist updated custom template file on disk", err)
		}
	}

	err = handler.DataStore.CustomTemplate().Update(customTemplate.ID, customTemplate)
	if err != nil {
		return httperror.InternalServerError("Unable to persist custom template changes inside the database", err)
	}

	return response.JSON(w, customTemplate)
}
