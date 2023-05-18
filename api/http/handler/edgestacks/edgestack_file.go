package edgestacks

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
)

type stackFileResponse struct {
	StackFileContent string `json:"StackFileContent"`
}

// @id EdgeStackFile
// @summary Fetches the stack file for an EdgeStack
// @description **Access policy**: administrator
// @tags edge_stacks
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param id path int true "EdgeStack Id"
// @success 200 {object} stackFileResponse
// @failure 500
// @failure 400
// @failure 503 "Edge compute features are disabled"
// @router /edge_stacks/{id}/file [get]
func (handler *Handler) edgeStackFile(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	stackID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid edge stack identifier route variable", err)
	}

	stack, err := handler.DataStore.EdgeStack().EdgeStack(portainer.EdgeStackID(stackID))
	if err != nil {
		return handler.handlerDBErr(err, "Unable to find an edge stack with the specified identifier inside the database")
	}

	fileName := stack.EntryPoint
	if stack.DeploymentType == portainer.EdgeStackDeploymentKubernetes {
		fileName = stack.ManifestPath
	}

	stackFileContent, err := handler.FileService.GetFileContent(stack.ProjectPath, fileName)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve stack file from disk", err)
	}

	return response.JSON(w, &stackFileResponse{StackFileContent: string(stackFileContent)})
}
