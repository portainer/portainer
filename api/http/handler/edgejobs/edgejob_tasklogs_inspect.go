package edgejobs

import (
	"net/http"
	"strconv"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

type fileResponse struct {
	FileContent string `json:"FileContent"`
}

// @id EdgeJobTaskLogsInspect
// @summary Fetch the log for a specifc task on an EdgeJob
// @description **Access policy**: administrator
// @tags edge_jobs
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param id path int true "EdgeJob Id"
// @param taskID path int true "Task Id"
// @success 200 {object} fileResponse
// @failure 500
// @failure 400
// @failure 503 "Edge compute features are disabled"
// @router /edge_jobs/{id}/tasks/{taskID}/logs [get]
func (handler *Handler) edgeJobTaskLogsInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	edgeJobID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid Edge job identifier route variable", err)
	}

	taskID, err := request.RetrieveNumericRouteVariableValue(r, "taskID")
	if err != nil {
		return httperror.BadRequest("Invalid Task identifier route variable", err)
	}

	logFileContent, err := handler.FileService.GetEdgeJobTaskLogFileContent(strconv.Itoa(edgeJobID), strconv.Itoa(taskID))
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve log file from disk", err)
	}

	return response.JSON(w, &fileResponse{FileContent: logFileContent})
}
