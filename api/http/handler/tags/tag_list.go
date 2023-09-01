package tags

import (
	"net/http"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id TagList
// @summary List tags
// @description List tags.
// @description **Access policy**: authenticated
// @tags tags
// @security ApiKeyAuth
// @security jwt
// @produce json
// @success 200 {array} portainer.Tag "Success"
// @failure 500 "Server error"
// @router /tags [get]
func (handler *Handler) tagList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	tags, err := handler.DataStore.Tag().ReadAll()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve tags from the database", err)
	}

	return response.JSON(w, tags)
}
