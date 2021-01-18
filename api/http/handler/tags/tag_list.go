package tags

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
)

// @id TagList
// @summary List tags
// @description List tags.
// @description **Access policy**: administrator
// @tags tags
// @security jwt
// @produce json
// @success 200 {array} portainer.Tag "Success"
// @failure 500 "Server error"
// @router /tags [get]
func (handler *Handler) tagList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	tags, err := handler.DataStore.Tag().Tags()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve tags from the database", err}
	}

	return response.JSON(w, tags)
}
