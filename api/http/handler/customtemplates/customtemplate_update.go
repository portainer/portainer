package customtemplates

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strconv"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/source"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/git"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/gitops/sources"
	"github.com/portainer/portainer/api/gitops/workflows"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/portainer/portainer/pkg/validate"
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
	// SourceID references an existing Source for git credentials/URL.
	// When set, the inline URL and authentication fields are ignored.
	SourceID portainer.SourceID `example:"1"`
	// Deprecated: use SourceID instead. URL of a Git repository hosting the Stack file.
	RepositoryURL string `example:"https://github.com/openfaas/faas"`
	// Reference name of a Git repository hosting the Stack file
	RepositoryReferenceName string `example:"refs/heads/master"`
	// Deprecated: use SourceID instead. Use authentication to clone the Git repository.
	RepositoryAuthentication bool `example:"true"`
	// Deprecated: use SourceID instead. Username used in basic authentication. Required when RepositoryAuthentication is true.
	RepositoryUsername string `example:"myGitUsername"`
	// Deprecated: use SourceID instead. Password used in basic authentication or token used in token authentication. Required when RepositoryAuthentication is true.
	RepositoryPassword string `example:"myGitPassword"`
	// Path to the Stack file inside the Git repository
	ComposeFilePathInRepository string `example:"docker-compose.yml" default:"docker-compose.yml"`
	// Content of stack file
	FileContent string `validate:"required"`
	// Definitions of variables in the stack file
	Variables []portainer.CustomTemplateVariableDefinition
	// Deprecated: use SourceID instead. TLSSkipVerify skips SSL verification when cloning the Git repository.
	TLSSkipVerify bool `example:"false"`
	// IsComposeFormat indicates if the Kubernetes template is created from a Docker Compose file
	IsComposeFormat bool `example:"false"`
	// EdgeTemplate indicates if this template purpose for Edge Stack
	EdgeTemplate bool `example:"false"`
}

func (payload *customTemplateUpdatePayload) Validate(r *http.Request) error {
	if len(payload.Title) == 0 {
		return errors.New("Invalid custom template title")
	}

	if payload.Type != portainer.KubernetesStack && payload.Platform != portainer.CustomTemplatePlatformLinux && payload.Platform != portainer.CustomTemplatePlatformWindows {
		return errors.New("Invalid custom template platform")
	}

	if payload.Type != portainer.KubernetesStack && payload.Type != portainer.DockerSwarmStack && payload.Type != portainer.DockerComposeStack {
		return errors.New("Invalid custom template type")
	}

	if len(payload.Description) == 0 {
		return errors.New("Invalid custom template description")
	}

	if !IsValidNote(payload.Note) {
		return errors.New("Invalid note. <img> tag is not supported")
	}

	if len(payload.FileContent) == 0 && payload.SourceID == 0 {
		if len(payload.RepositoryURL) == 0 {
			return errors.New("Either file content, git repository url, or source ID need to be provided")
		}

		if !validate.IsURL(payload.RepositoryURL) {
			return errors.New("Invalid repository URL. Must correspond to a valid URL format")
		}

		if payload.RepositoryAuthentication && (len(payload.RepositoryUsername) == 0 || len(payload.RepositoryPassword) == 0) {
			return errors.New("Invalid repository credentials. Username and password must be specified when authentication is enabled")
		}

	}

	if len(payload.ComposeFilePathInRepository) == 0 {
		payload.ComposeFilePathInRepository = filesystem.ComposeFileDefaultName
	}

	if err := ValidateVariablesDefinitions(payload.Variables); err != nil {
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
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	duplicates, err := handler.DataStore.CustomTemplate().ReadAll(func(t portainer.CustomTemplate) bool {
		return t.ID != portainer.CustomTemplateID(customTemplateID) && t.Title == payload.Title
	})
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve custom templates from the database", err)
	}

	if len(duplicates) > 0 {
		return httperror.InternalServerError("Template name must be unique", errors.New("Template name must be unique"))
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

	resourceControl, err := handler.DataStore.ResourceControl().ResourceControlByResourceIDAndType(strconv.Itoa(customTemplateID), portainer.CustomTemplateResourceControl)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve a resource control associated to the custom template", err)
	}

	customTemplate.ResourceControl = resourceControl
	if !userCanEditTemplate(customTemplate, securityContext) {
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
	customTemplate.EdgeTemplate = payload.EdgeTemplate

	userContext := source.NewUserContext(securityContext.User, securityContext.UserMemberships)

	if payload.SourceID != 0 || payload.RepositoryURL != "" {
		gitConfig, httpErr := sources.ResolveRepoConfig(handler.DataStore, userContext, sources.RepoConfigInput{
			SourceID:                 payload.SourceID,
			ReferenceName:            payload.RepositoryReferenceName,
			ConfigFilePath:           payload.ComposeFilePathInRepository,
			RepositoryURL:            payload.RepositoryURL,
			TLSSkipVerify:            payload.TLSSkipVerify,
			RepositoryAuthentication: payload.RepositoryAuthentication,
			Username:                 payload.RepositoryUsername,
			Password:                 payload.RepositoryPassword,
		})
		if httpErr != nil {
			return httpErr
		}

		var username, password string
		if gitConfig.Authentication != nil {
			username = gitConfig.Authentication.Username
			password = gitConfig.Authentication.Password
		}

		cleanBackup, err := git.CloneWithBackup(context.TODO(), handler.GitService, handler.FileService, git.CloneOptions{
			ProjectPath:   customTemplate.ProjectPath,
			URL:           gitConfig.URL,
			ReferenceName: gitConfig.ReferenceName,
			Username:      username,
			Password:      password,
			TLSSkipVerify: gitConfig.TLSSkipVerify,
		})
		if err != nil {
			return httperror.InternalServerError("Unable to clone git repository directory", err)
		}

		defer cleanBackup()

		commitHash, err := handler.GitService.LatestCommitID(
			context.TODO(),
			gitConfig.URL,
			gitConfig.ReferenceName,
			username,
			password,
			gitConfig.TLSSkipVerify,
		)
		if err != nil {
			return httperror.InternalServerError("Unable get latest commit id", fmt.Errorf("failed to fetch latest commit id of the template %v: %w", customTemplate.ID, err))
		}

		sourceID := payload.SourceID
		if sourceID == 0 {
			src, err := workflows.FindOrCreateGitSource(handler.DataStore, userContext, &portainer.Source{
				Name: gittypes.RepoName(gitConfig.URL),
				Type: portainer.SourceTypeGit,
				Git: &gittypes.RepoConfig{
					URL:            gitConfig.URL,
					Authentication: gitConfig.Authentication,
					TLSSkipVerify:  gitConfig.TLSSkipVerify,
				},
			})
			if err != nil {
				return httperror.InternalServerError("Unable to find or create git source", err)
			}
			sourceID = src.ID
		}

		customTemplate.Artifact = &portainer.Artifact{
			Files: []portainer.ArtifactFile{{
				SourceID: sourceID,
				Path:     gitConfig.ConfigFilePath,
				Ref:      gitConfig.ReferenceName,
				Hash:     commitHash,
			}},
		}

	} else {
		templateFolder := strconv.Itoa(customTemplateID)
		projectPath, err := handler.FileService.StoreCustomTemplateFileFromBytes(templateFolder, customTemplate.EntryPoint, []byte(payload.FileContent))
		if err != nil {
			return httperror.InternalServerError("Unable to persist updated custom template file on disk", err)
		}

		customTemplate.ProjectPath = projectPath
		customTemplate.Artifact = nil
	}

	err = handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		if err := tx.CustomTemplate().Update(customTemplate.ID, customTemplate); err != nil {
			return httperror.InternalServerError("Unable to persist custom template changes inside the database", err)
		}

		userContext := source.NewUserContext(securityContext.User, securityContext.UserMemberships)
		populateGitConfig(tx, userContext, customTemplate)

		return nil
	})

	return response.TxResponse(w, customTemplate, err)
}
