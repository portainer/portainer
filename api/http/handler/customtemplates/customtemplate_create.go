package customtemplates

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
)

// Create a custom template
// @Summary Create a custom template
// @Description
// @Tags CustomTemplates
// @Security ApiKeyAuth
// @Accept json
// @Produce json
// @Param method query string true "method for creating template" Enums(string, file, repository)
// @Success 204
// @Failure 400,404,500
// @Router /custom_templates [post]
func (handler *Handler) customTemplateCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	method, err := request.RetrieveQueryParameter(r, "method", false)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: method", err}
	}

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve user details from authentication token", err}
	}

	customTemplate, err := handler.createCustomTemplate(method, r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to create custom template", err}
	}

	customTemplate.CreatedByUserID = tokenData.ID

	customTemplates, err := handler.DataStore.CustomTemplate().CustomTemplates()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve custom templates from the database", err}
	}

	for _, existingTemplate := range customTemplates {
		if existingTemplate.Title == customTemplate.Title {
			return &httperror.HandlerError{http.StatusInternalServerError, "Template name must be unique", errors.New("Template name must be unique")}
		}
	}

	err = handler.DataStore.CustomTemplate().CreateCustomTemplate(customTemplate)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to create custom template", err}
	}

	resourceControl := authorization.NewPrivateResourceControl(strconv.Itoa(int(customTemplate.ID)), portainer.CustomTemplateResourceControl, tokenData.ID)

	err = handler.DataStore.ResourceControl().CreateResourceControl(resourceControl)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist resource control inside the database", err}
	}

	customTemplate.ResourceControl = resourceControl

	return response.JSON(w, customTemplate)
}

func (handler *Handler) createCustomTemplate(method string, r *http.Request) (*portainer.CustomTemplate, error) {
	switch method {
	case "string":
		return handler.createCustomTemplateFromFileContent(r)
	case "repository":
		return handler.createCustomTemplateFromGitRepository(r)
	case "file":
		return handler.createCustomTemplateFromFileUpload(r)
	}
	return nil, errors.New("Invalid value for query parameter: method. Value must be one of: string, repository or file")
}

type customTemplateFromFileContentPayload struct {
	Logo        string
	Title       string
	FileContent string
	Description string
	Note        string
	Platform    portainer.CustomTemplatePlatform
	Type        portainer.StackType
}

func (payload *customTemplateFromFileContentPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Title) {
		return errors.New("Invalid custom template title")
	}
	if govalidator.IsNull(payload.Description) {
		return errors.New("Invalid custom template description")
	}
	if govalidator.IsNull(payload.FileContent) {
		return errors.New("Invalid file content")
	}
	if payload.Platform != portainer.CustomTemplatePlatformLinux && payload.Platform != portainer.CustomTemplatePlatformWindows {
		return errors.New("Invalid custom template platform")
	}
	if payload.Type != portainer.DockerSwarmStack && payload.Type != portainer.DockerComposeStack {
		return errors.New("Invalid custom template type")
	}
	return nil
}

func (handler *Handler) createCustomTemplateFromFileContent(r *http.Request) (*portainer.CustomTemplate, error) {
	var payload customTemplateFromFileContentPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return nil, err
	}

	customTemplateID := handler.DataStore.CustomTemplate().GetNextIdentifier()
	customTemplate := &portainer.CustomTemplate{
		ID:          portainer.CustomTemplateID(customTemplateID),
		Title:       payload.Title,
		EntryPoint:  filesystem.ComposeFileDefaultName,
		Description: payload.Description,
		Note:        payload.Note,
		Platform:    (payload.Platform),
		Type:        (payload.Type),
		Logo:        payload.Logo,
	}

	templateFolder := strconv.Itoa(customTemplateID)
	projectPath, err := handler.FileService.StoreCustomTemplateFileFromBytes(templateFolder, customTemplate.EntryPoint, []byte(payload.FileContent))
	if err != nil {
		return nil, err
	}
	customTemplate.ProjectPath = projectPath

	return customTemplate, nil
}

type customTemplateFromGitRepositoryPayload struct {
	Logo                        string
	Title                       string
	Description                 string
	Note                        string
	Platform                    portainer.CustomTemplatePlatform
	Type                        portainer.StackType
	RepositoryURL               string
	RepositoryReferenceName     string
	RepositoryAuthentication    bool
	RepositoryUsername          string
	RepositoryPassword          string
	ComposeFilePathInRepository string
}

func (payload *customTemplateFromGitRepositoryPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Title) {
		return errors.New("Invalid custom template title")
	}
	if govalidator.IsNull(payload.Description) {
		return errors.New("Invalid custom template description")
	}
	if govalidator.IsNull(payload.RepositoryURL) || !govalidator.IsURL(payload.RepositoryURL) {
		return errors.New("Invalid repository URL. Must correspond to a valid URL format")
	}
	if payload.RepositoryAuthentication && (govalidator.IsNull(payload.RepositoryUsername) || govalidator.IsNull(payload.RepositoryPassword)) {
		return errors.New("Invalid repository credentials. Username and password must be specified when authentication is enabled")
	}
	if govalidator.IsNull(payload.ComposeFilePathInRepository) {
		payload.ComposeFilePathInRepository = filesystem.ComposeFileDefaultName
	}
	if payload.Platform != portainer.CustomTemplatePlatformLinux && payload.Platform != portainer.CustomTemplatePlatformWindows {
		return errors.New("Invalid custom template platform")
	}
	if payload.Type != portainer.DockerSwarmStack && payload.Type != portainer.DockerComposeStack {
		return errors.New("Invalid custom template type")
	}
	return nil
}

func (handler *Handler) createCustomTemplateFromGitRepository(r *http.Request) (*portainer.CustomTemplate, error) {
	var payload customTemplateFromGitRepositoryPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return nil, err
	}

	customTemplateID := handler.DataStore.CustomTemplate().GetNextIdentifier()
	customTemplate := &portainer.CustomTemplate{
		ID:          portainer.CustomTemplateID(customTemplateID),
		Title:       payload.Title,
		EntryPoint:  payload.ComposeFilePathInRepository,
		Description: payload.Description,
		Note:        payload.Note,
		Platform:    payload.Platform,
		Type:        payload.Type,
		Logo:        payload.Logo,
	}

	projectPath := handler.FileService.GetCustomTemplateProjectPath(strconv.Itoa(customTemplateID))
	customTemplate.ProjectPath = projectPath

	gitCloneParams := &cloneRepositoryParameters{
		url:            payload.RepositoryURL,
		referenceName:  payload.RepositoryReferenceName,
		path:           projectPath,
		authentication: payload.RepositoryAuthentication,
		username:       payload.RepositoryUsername,
		password:       payload.RepositoryPassword,
	}

	err = handler.cloneGitRepository(gitCloneParams)
	if err != nil {
		return nil, err
	}

	return customTemplate, nil
}

type customTemplateFromFileUploadPayload struct {
	Logo        string
	Title       string
	Description string
	Note        string
	Platform    portainer.CustomTemplatePlatform
	Type        portainer.StackType
	FileContent []byte
}

func (payload *customTemplateFromFileUploadPayload) Validate(r *http.Request) error {
	title, err := request.RetrieveMultiPartFormValue(r, "Title", false)
	if err != nil {
		return errors.New("Invalid custom template title")
	}
	payload.Title = title

	description, err := request.RetrieveMultiPartFormValue(r, "Description", false)
	if err != nil {
		return errors.New("Invalid custom template description")
	}

	payload.Description = description

	note, _ := request.RetrieveMultiPartFormValue(r, "Note", true)
	payload.Note = note

	platform, _ := request.RetrieveNumericMultiPartFormValue(r, "Platform", true)
	templatePlatform := portainer.CustomTemplatePlatform(platform)
	if templatePlatform != portainer.CustomTemplatePlatformLinux && templatePlatform != portainer.CustomTemplatePlatformWindows {
		return errors.New("Invalid custom template platform")
	}
	payload.Platform = templatePlatform

	typeNumeral, _ := request.RetrieveNumericMultiPartFormValue(r, "Type", true)
	templateType := portainer.StackType(typeNumeral)
	if templateType != portainer.DockerComposeStack && templateType != portainer.DockerSwarmStack {
		return errors.New("Invalid custom template type")
	}
	payload.Type = templateType

	composeFileContent, _, err := request.RetrieveMultiPartFormFile(r, "File")
	if err != nil {
		return errors.New("Invalid Compose file. Ensure that the Compose file is uploaded correctly")
	}
	payload.FileContent = composeFileContent

	return nil
}

func (handler *Handler) createCustomTemplateFromFileUpload(r *http.Request) (*portainer.CustomTemplate, error) {
	payload := &customTemplateFromFileUploadPayload{}
	err := payload.Validate(r)
	if err != nil {
		return nil, err
	}

	customTemplateID := handler.DataStore.CustomTemplate().GetNextIdentifier()
	customTemplate := &portainer.CustomTemplate{
		ID:          portainer.CustomTemplateID(customTemplateID),
		Title:       payload.Title,
		Description: payload.Description,
		Note:        payload.Note,
		Platform:    payload.Platform,
		Type:        payload.Type,
		Logo:        payload.Logo,
		EntryPoint:  filesystem.ComposeFileDefaultName,
	}

	templateFolder := strconv.Itoa(customTemplateID)
	projectPath, err := handler.FileService.StoreCustomTemplateFileFromBytes(templateFolder, customTemplate.EntryPoint, []byte(payload.FileContent))
	if err != nil {
		return nil, err
	}
	customTemplate.ProjectPath = projectPath

	return customTemplate, nil
}
