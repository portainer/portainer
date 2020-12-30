package tags

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
)

// List Tags
// @Summary Fetches the list of tags
// @Description
// @Produce json
// @Success 200 {array} portainer.Tag
// @tags Tags
// @Failure 500
// @Router /tags [get]
func (handler *Handler) tagList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	tags, err := handler.DataStore.Tag().Tags()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve tags from the database", err}
	}

	return response.JSON(w, tags)
}
