package scenes

import (
	"errors"
	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"net/http"
)

type sceneCreatePayload struct {
	Name        string `example:"my-scenes" validate:"required"`
	Description string `example:"Scene description"`
}

func (payload *sceneCreatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return errors.New("Invalid scenes name")
	}
	return nil
}

// @summary Create a Scene
// @description Create a new Scene.
// @description **Access policy**: administrator
// @tags scenes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param body body sceneCreatePayload true "Scene details"
// @success 200 {object} portainer.Scene "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /scenes [post]
func (handler *Handler) sceneCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload sceneCreatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	scene := &portainer.Scene{
		Name:        payload.Name,
		Description: payload.Description,
	}

	err = handler.DataStore.Scene().Create(scene)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the scenes inside the database", err}
	}

	return response.JSON(w, scene)
}
