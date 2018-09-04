package tags

import (
	"net/http"

	"github.com/asaskevich/govalidator"
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/request"
	"github.com/portainer/portainer/http/response"
)

type tagCreatePayload struct {
	Name string
}

func (payload *tagCreatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return portainer.Error("Invalid tag name")
	}
	return nil
}

// POST request on /api/tags
func (handler *Handler) tagCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload tagCreatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	tags, err := handler.TagService.Tags()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve tags from the database", err}
	}

	for _, tag := range tags {
		if tag.Name == payload.Name {
			return &httperror.HandlerError{http.StatusConflict, "This name is already associated to a tag", portainer.ErrTagAlreadyExists}
		}
	}

	tag := &portainer.Tag{
		Name: payload.Name,
	}

	err = handler.TagService.CreateTag(tag)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the tag inside the database", err}
	}

	return response.JSON(w, tag)
}
