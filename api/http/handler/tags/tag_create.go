package tags

import (
	"errors"
	"net/http"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
)

type tagCreatePayload struct {
	Name string
}

func (payload *tagCreatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return errors.New("Invalid tag name")
	}
	return nil
}

// tagCreate godoc
// @Summary Create a tag
// @Description
// @Produce json
// @param body body tagCreatePayload true "tag info"
// @Success 200 {array} portainer.Tag
// @tags Tags
// @Failure 500
// @Router /tags [post]
func (handler *Handler) tagCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload tagCreatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	tags, err := handler.DataStore.Tag().Tags()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve tags from the database", err}
	}

	for _, tag := range tags {
		if tag.Name == payload.Name {
			return &httperror.HandlerError{http.StatusConflict, "This name is already associated to a tag", errors.New("A tag already exists with this name")}
		}
	}

	tag := &portainer.Tag{
		Name:           payload.Name,
		EndpointGroups: map[portainer.EndpointGroupID]bool{},
		Endpoints:      map[portainer.EndpointID]bool{},
	}

	err = handler.DataStore.Tag().CreateTag(tag)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the tag inside the database", err}
	}

	return response.JSON(w, tag)
}
