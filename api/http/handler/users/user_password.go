package users

import (
	"net/http"

	"github.com/asaskevich/govalidator"
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/request"
	"github.com/portainer/portainer/http/response"
)

type userPasswordPayload struct {
	Password string
}

func (payload *userPasswordPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Password) {
		return portainer.Error("Invalid password")
	}
	return nil
}

type userPasswordResponse struct {
	Valid bool `json:"valid"`
}

// POST request on /api/users/:id/passwd
func (handler *Handler) userPassword(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	userID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid user identifier route variable", err}
	}

	var payload userPasswordPayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	var password = payload.Password

	u, err := handler.UserService.User(portainer.UserID(userID))
	if err == portainer.ErrUserNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a user with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a user with the specified identifier inside the database", err}
	}

	valid := true
	err = handler.CryptoService.CompareHashAndData(u.Password, password)
	if err != nil {
		valid = false
	}

	return response.JSON(w, &userPasswordResponse{Valid: valid})
}
