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
)

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

	err = handler.DataStore.CustomTemplate().CreateCustomTemplate(customTemplate)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to create custom template", err}
	}

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
	Name        string
	FileContent string
}

func (payload *customTemplateFromFileContentPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return portainer.Error("Invalid custom template name")
	}
	if govalidator.IsNull(payload.FileContent) {
		return portainer.Error("Invalid file content")
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
		ID:         portainer.CustomTemplateID(customTemplateID),
		Name:       payload.Name,
		EntryPoint: filesystem.ComposeFileDefaultName,
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
	Name                        string
	RepositoryURL               string
	RepositoryReferenceName     string
	RepositoryAuthentication    bool
	RepositoryUsername          string
	RepositoryPassword          string
	ComposeFilePathInRepository string
}

func (payload *customTemplateFromGitRepositoryPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return portainer.Error("Invalid stack name")
	}
	if govalidator.IsNull(payload.RepositoryURL) || !govalidator.IsURL(payload.RepositoryURL) {
		return portainer.Error("Invalid repository URL. Must correspond to a valid URL format")
	}
	if payload.RepositoryAuthentication && (govalidator.IsNull(payload.RepositoryUsername) || govalidator.IsNull(payload.RepositoryPassword)) {
		return portainer.Error("Invalid repository credentials. Username and password must be specified when authentication is enabled")
	}
	if govalidator.IsNull(payload.ComposeFilePathInRepository) {
		payload.ComposeFilePathInRepository = filesystem.ComposeFileDefaultName
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
		ID:         portainer.CustomTemplateID(customTemplateID),
		Name:       payload.Name,
		EntryPoint: payload.ComposeFilePathInRepository,
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
	Name        string
	FileContent []byte
}

func (payload *customTemplateFromFileUploadPayload) Validate(r *http.Request) error {
	name, err := request.RetrieveMultiPartFormValue(r, "Name", false)
	if err != nil {
		return portainer.Error("Invalid custom template name")
	}
	payload.Name = name

	composeFileContent, _, err := request.RetrieveMultiPartFormFile(r, "file")
	if err != nil {
		return portainer.Error("Invalid Compose file. Ensure that the Compose file is uploaded correctly")
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
		ID:         portainer.CustomTemplateID(customTemplateID),
		Name:       payload.Name,
		EntryPoint: filesystem.ComposeFileDefaultName,
	}

	templateFolder := strconv.Itoa(customTemplateID)
	projectPath, err := handler.FileService.StoreCustomTemplateFileFromBytes(templateFolder, customTemplate.EntryPoint, []byte(payload.FileContent))
	if err != nil {
		return nil, err
	}
	customTemplate.ProjectPath = projectPath

	return customTemplate, nil
}
