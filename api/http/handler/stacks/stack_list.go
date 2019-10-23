package stacks

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
)

type stackListOperationFilters struct {
	SwarmID    string `json:"SwarmID"`
	EndpointID int    `json:"EndpointID"`
}

// GET request on /api/stacks?(filters=<filters>)
func (handler *Handler) stackList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var filters stackListOperationFilters
	err := request.RetrieveJSONQueryParameter(r, "filters", &filters, true)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: filters", err}
	}

	stacks, err := handler.StackService.Stacks()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve stacks from the database", err}
	}
	stacks = filterStacks(stacks, &filters)

	resourceControls, err := handler.ResourceControlService.ResourceControls()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve resource controls from the database", err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	stacks = portainer.DecorateStacks(stacks, resourceControls)

	if !securityContext.IsAdmin {
		userTeamIDs := make([]portainer.TeamID, 0)
		for _, membership := range securityContext.UserMemberships {
			userTeamIDs = append(userTeamIDs, membership.TeamID)
		}

		stacks = portainer.FilterAuthorizedStacks(stacks, securityContext.UserID, userTeamIDs)
	}

	return response.JSON(w, stacks)
}

func filterStacks(stacks []portainer.Stack, filters *stackListOperationFilters) []portainer.Stack {
	if filters.EndpointID == 0 && filters.SwarmID == "" {
		return stacks
	}

	filteredStacks := make([]portainer.Stack, 0, len(stacks))
	for _, stack := range stacks {
		if stack.Type == portainer.DockerComposeStack && stack.EndpointID == portainer.EndpointID(filters.EndpointID) {
			filteredStacks = append(filteredStacks, stack)
		}
		if stack.Type == portainer.DockerSwarmStack && stack.SwarmID == filters.SwarmID {
			filteredStacks = append(filteredStacks, stack)
		}
	}

	return filteredStacks
}
