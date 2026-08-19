package edgejobs

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

type edgeJobFileResponse struct {
	FileContent string `json:"FileContent"`
}

// @id EdgeJobFile
// @summary Fetch a file of an EdgeJob
// @description **Access policy**: administrator
// @tags edge_jobs
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param id path int true "EdgeJob Id"
// @success 200 {object} edgeJobFileResponse
// @failure 500
// @failure 400
// @failure 503 "Edge compute features are disabled"
// @router /edge_jobs/{id}/file [get]
func (handler *Handler) edgeJobFile(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	edgeJobID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid Edge job identifier route variable", err)
	}

	edgeJob, err := handler.DataStore.EdgeJob().Read(portainer.EdgeJobID(edgeJobID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find an Edge job with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find an Edge job with the specified identifier inside the database", err)
	}

	edgeJobFileContent, err := handler.FileService.GetFileContent(edgeJob.ScriptPath, "")
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve Edge job script file from disk", err)
	}

	return response.JSON(w, &edgeJobFileResponse{FileContent: string(edgeJobFileContent)})
}
