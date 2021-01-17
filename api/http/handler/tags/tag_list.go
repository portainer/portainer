package tags

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
)

// List Tags
// @summary Fetches the list of tags
// @description
// @security jwt
// @produce json
// @success 200 {array} portainer.Tag
// @tags tags
// @failure 500
// @router /tags [get]
func (handler *Handler) tagList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	tags, err := handler.DataStore.Tag().Tags()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve tags from the database", err}
	}

	return response.JSON(w, tags)
}
