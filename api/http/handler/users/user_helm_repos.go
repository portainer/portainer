package users

import (
	"net/http"
	"strings"

	portainer "github.com/portainer/portainer/api"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/pkg/libhelm"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"

	"github.com/pkg/errors"
)

type helmUserRepositoryResponse struct {
	GlobalRepository string                         `json:"GlobalRepository"`
	UserRepositories []portainer.HelmUserRepository `json:"UserRepositories"`
}

type addHelmRepoUrlPayload struct {
	URL string `json:"url"`
}

func (p *addHelmRepoUrlPayload) Validate(_ *http.Request) error {
	return libhelm.ValidateHelmRepositoryURL(p.URL, nil)
}

// @id HelmUserRepositoryCreate
// @summary Create a user helm repository
// @description Create a user helm repository.
// @description **Access policy**: authenticated
// @tags helm
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "User identifier"
// @param payload body addHelmRepoUrlPayload true "Helm Repository"
// @success 200 {object} portainer.HelmUserRepository "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 500 "Server error"
// @router /users/{id}/helm/repositories [post]
func (handler *Handler) userCreateHelmRepo(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	userIDEndpoint, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid user identifier route variable", err)
	}

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve user authentication token", err)
	}

	userID := portainer.UserID(userIDEndpoint)
	if tokenData.ID != userID {
		return httperror.Forbidden("Couldn't create Helm repositories for another user", httperrors.ErrUnauthorized)
	}

	p := new(addHelmRepoUrlPayload)
	err = request.DecodeAndValidateJSONPayload(r, p)
	if err != nil {
		return httperror.BadRequest("Invalid Helm repository URL", err)
	}

	// lowercase, remove trailing slash
	p.URL = strings.TrimSuffix(strings.ToLower(p.URL), "/")

	records, err := handler.DataStore.HelmUserRepository().HelmUserRepositoryByUserID(userID)
	if err != nil {
		return httperror.InternalServerError("Unable to access the DataStore", err)
	}

	// check if repo already exists - by doing case insensitive comparison
	for _, record := range records {
		if strings.EqualFold(record.URL, p.URL) {
			errMsg := "Helm repo already registered for user"
			return httperror.BadRequest(errMsg, errors.New(errMsg))
		}
	}

	record := portainer.HelmUserRepository{
		UserID: userID,
		URL:    p.URL,
	}

	err = handler.DataStore.HelmUserRepository().Create(&record)
	if err != nil {
		return httperror.InternalServerError("Unable to save a user Helm repository URL", err)
	}

	return response.JSON(w, record)
}

// @id HelmUserRepositoriesList
// @summary List a users helm repositories
// @description Inspect a user helm repositories.
// @description **Access policy**: authenticated
// @tags helm
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param id path int true "User identifier"
// @success 200 {object} helmUserRepositoryResponse "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 500 "Server error"
// @router /users/{id}/helm/repositories [get]
func (handler *Handler) userGetHelmRepos(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	userIDEndpoint, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid user identifier route variable", err)
	}

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve user authentication token", err)
	}

	userID := portainer.UserID(userIDEndpoint)
	if tokenData.ID != userID {
		return httperror.Forbidden("Couldn't create Helm repositories for another user", httperrors.ErrUnauthorized)
	}

	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve settings from the database", err)
	}

	userRepos, err := handler.DataStore.HelmUserRepository().HelmUserRepositoryByUserID(userID)
	if err != nil {
		return httperror.InternalServerError("Unable to get user Helm repositories", err)
	}

	resp := helmUserRepositoryResponse{
		GlobalRepository: settings.HelmRepositoryURL,
		UserRepositories: userRepos,
	}

	return response.JSON(w, resp)
}

// @id HelmUserRepositoryDelete
// @summary Delete a users helm repositoryies
// @description **Access policy**: authenticated
// @tags helm
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param id path int true "User identifier"
// @param repositoryID path int true "Repository identifier"
// @success 204 "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 500 "Server error"
// @router /users/{id}/helm/repositories/{repositoryID} [delete]
func (handler *Handler) userDeleteHelmRepo(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	userIDEndpoint, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid user identifier route variable", err)
	}

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve user authentication token", err)
	}

	userID := portainer.UserID(userIDEndpoint)
	if tokenData.ID != userID {
		return httperror.Forbidden("Couldn't create Helm repositories for another user", httperrors.ErrUnauthorized)
	}

	repositoryID, err := request.RetrieveNumericRouteVariableValue(r, "repositoryID")
	if err != nil {
		return httperror.BadRequest("Invalid user identifier route variable", err)
	}

	userRepos, err := handler.DataStore.HelmUserRepository().HelmUserRepositoryByUserID(userID)
	if err != nil {
		return httperror.InternalServerError("Unable to get user Helm repositories", err)
	}

	for _, repo := range userRepos {
		if repo.ID == portainer.HelmUserRepositoryID(repositoryID) && repo.UserID == userID {
			err = handler.DataStore.HelmUserRepository().Delete(portainer.HelmUserRepositoryID(repositoryID))
			if err != nil {
				return httperror.InternalServerError("Unable to delete user Helm repository", err)
			}
		}
	}

	return response.JSON(w, nil)
}
