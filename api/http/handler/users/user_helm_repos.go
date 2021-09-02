package users

import (
	"net/http"
	"strings"

	"github.com/pkg/errors"

	"github.com/portainer/libhelm"
	errs "github.com/portainer/portainer/api/http/errors"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
)

type addHelmRepoUrlPayload struct {
	URL string `json:"url"`
}

func (p *addHelmRepoUrlPayload) Validate(_ *http.Request) error {
	return libhelm.ValidateHelmRepositoryURL(p.URL)
}

// @id UserHelmRepositoryCreate
// @summary Create a user helm repository
// @description Create a user helm repository.
// @description **Access policy**: authenticated
// @tags users
// @security jwt
// @accept json
// @produce json
// @param id path int true "User identifier"
// @success 200 {object} portainer.HelmUserRepository "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 500 "Server error"
// @router /users/{id}/helm-repositories [post]
func (handler *Handler) userCreateHelmRepo(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	uid, err := request.RetrieveNumericRouteVariableValue(r, "id")
	userID := portainer.UserID(uid)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid user identifier route variable", err}
	}

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve user authentication token", err}
	}

	if tokenData.Role != portainer.AdministratorRole && tokenData.ID != userID {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to save a user Helm repository URL", errs.ErrUnauthorized}
	}

	p := new(addHelmRepoUrlPayload)
	err = request.DecodeAndValidateJSONPayload(r, p)
	if err != nil {
		return &httperror.HandlerError{
			StatusCode: http.StatusBadRequest,
			Message:    "Invalid Helm repository URL",
			Err:        err,
		}
	}

	records, err := handler.DataStore.HelmUserRepository().HelmUserRepositoryByUserID(userID)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to access the DataStore", err}
	}

	// check if repo already exists - by doing case insensitive, suffix trimmed comparison
	for _, record := range records {
		if strings.EqualFold(strings.TrimSuffix(record.URL, "/"), strings.TrimSuffix(p.URL, "/")) {
			errMsg := "Helm repo already registered for user"
			return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: errMsg, Err: errors.New(errMsg)}
		}
	}

	record := portainer.HelmUserRepository{
		UserID: userID,
		URL:    p.URL,
	}

	err = handler.DataStore.HelmUserRepository().CreateHelmUserRepository(&record)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to save a user Helm repository URL", err}
	}

	return response.JSON(w, record)
}

// @id UserHelmRepositoriesInspect
// @summary Inspect a user helm repositories
// @description Inspect a user helm repositories.
// @description **Access policy**: authenticated
// @tags users
// @security jwt
// @produce json
// @param id path int true "User identifier"
// @success 200 {object} []portainer.HelmUserRepository "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied"
// @failure 500 "Server error"
// @router /users/{id}/helm-repositories [get]
func (handler *Handler) userGetHelmRepos(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	userID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid user identifier route variable", err}
	}

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve user authentication token", err}
	}

	if tokenData.Role != portainer.AdministratorRole && tokenData.ID != portainer.UserID(userID) {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to get user Helm repositories", errs.ErrUnauthorized}
	}

	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve settings from the database", err}
	}

	userRepos, err := handler.DataStore.HelmUserRepository().HelmUserRepositoryByUserID(portainer.UserID(userID))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to get user Helm repositories", err}
	}

	resp := struct {
		GlobalRepo string                         `json:"GlobalRepo"`
		UserRepos  []portainer.HelmUserRepository `json:"UserRepos"`
	}{
		GlobalRepo: settings.HelmRepositoryURL,
		UserRepos:  userRepos,
	}

	return response.JSON(w, resp)
}
