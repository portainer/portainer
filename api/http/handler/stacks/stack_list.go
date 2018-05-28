package stacks

import (
	"net/http"

	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/proxy"
	"github.com/portainer/portainer/http/request"
	"github.com/portainer/portainer/http/response"
	"github.com/portainer/portainer/http/security"
)

type stackListOperationFilters struct {
	SwarmID    string `json:"SwarmID"`
	EndpointID int    `json:"EndpointID"`
}

// GET request on /api/stacks?(filters=<filters>)
func (handler *StackHandler) stackList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var filters stackListOperationFilters
	err := request.RetrieveJSONQueryParameter(r, "filters", &filters, true)
	if err != nil {
		return &httperror.HandlerError{err, "Invalid query parameter: filters", http.StatusBadRequest}
	}

	stacks, err := handler.StackService.Stacks()
	if err != nil {
		return &httperror.HandlerError{err, "Unable to retrieve stacks from the database", http.StatusInternalServerError}
	}
	stacks = filterStacks(stacks, &filters)

	resourceControls, err := handler.ResourceControlService.ResourceControls()
	if err != nil {
		return &httperror.HandlerError{err, "Unable to retrieve resource controls from the database", http.StatusInternalServerError}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{err, "Unable to retrieve info from request context", http.StatusInternalServerError}
	}

	filteredStacks := proxy.FilterStacks(stacks, resourceControls, securityContext.IsAdmin,
		securityContext.UserID, securityContext.UserMemberships)

	return response.WriteJSONResponse(w, filteredStacks)
}

func filterStacks(stacks []portainer.Stack, filters *stackListOperationFilters) []portainer.Stack {
	if filters == nil {
		return stacks
	}

	filteredStacks := make([]portainer.Stack, 0, len(stacks))
	for _, stack := range stacks {
		if stack.EndpointID == portainer.EndpointID(filters.EndpointID) || stack.SwarmID == filters.SwarmID {
			filteredStacks = append(filteredStacks, stack)
		}
	}

	return filteredStacks
}
