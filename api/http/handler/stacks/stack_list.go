package stacks

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

type stackListOperationFilters struct {
	SwarmID               string `json:"SwarmID"`
	EndpointID            int    `json:"EndpointID"`
	IncludeOrphanedStacks bool   `json:"IncludeOrphanedStacks"`
}

// @id StackList
// @summary List stacks
// @description List all stacks based on the current user authorizations.
// @description Will return all stacks if using an administrator account otherwise it
// @description will only return the list of stacks the user have access to.
// @description Limited stacks will not be returned by this endpoint.
// @description **Access policy**: authenticated
// @tags stacks
// @security ApiKeyAuth
// @security jwt
// @param filters query string false "Filters to process on the stack list. Encoded as JSON (a map[string]string). For example, {'SwarmID': 'jpofkc0i9uo9wtx1zesuk649w'} will only return stacks that are part of the specified Swarm cluster. Available filters: EndpointID, SwarmID."
// @success 200 {array} portainer.Stack "Success"
// @success 204 "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /stacks [get]
func (handler *Handler) stackList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var filters stackListOperationFilters
	err := request.RetrieveJSONQueryParameter(r, "filters", &filters, true)
	if err != nil {
		return httperror.BadRequest("Invalid query parameter: filters", err)
	}

	endpoints, err := handler.DataStore.Endpoint().Endpoints()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve environments from database", err)
	}

	stacks, err := handler.DataStore.Stack().ReadAll()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve stacks from the database", err)
	}
	stacks = filterStacks(stacks, &filters, endpoints)

	resourceControls, err := handler.DataStore.ResourceControl().ReadAll()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve resource controls from the database", err)
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	stacks = authorization.DecorateStacks(stacks, resourceControls)

	if !securityContext.IsAdmin {
		if filters.IncludeOrphanedStacks {
			return httperror.Forbidden("Permission denied to access orphaned stacks", httperrors.ErrUnauthorized)
		}

		user, err := handler.DataStore.User().Read(securityContext.UserID)
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve user information from the database", err)
		}

		userTeamIDs := make([]portainer.TeamID, 0)
		for _, membership := range securityContext.UserMemberships {
			userTeamIDs = append(userTeamIDs, membership.TeamID)
		}

		stacks = authorization.FilterAuthorizedStacks(stacks, user, userTeamIDs)
	}

	for _, stack := range stacks {
		if stack.GitConfig != nil && stack.GitConfig.Authentication != nil && stack.GitConfig.Authentication.Password != "" {
			// sanitize password in the http response to minimise possible security leaks
			stack.GitConfig.Authentication.Password = ""
		}
	}

	return response.JSON(w, stacks)
}

// filterStacks refines a collection of Stack instances using specified criteria.
// This function examines the provided filters: EndpointID, SwarmID, and IncludeOrphanedStacks.
// - If both EndpointID is zero and SwarmID is an empty string, the function directly returns the original stack list without any modifications.
// - If either filter is specified, it proceeds to selectively include stacks that match the criteria.

// Key Points on Business Logic:
// 1. Determining Inclusion of Orphaned Stacks:
//    - The decision to include orphaned stacks is influenced by the user's role and usually set by the client (UI).
//    - Administrators or environment administrators can include orphaned stacks by setting IncludeOrphanedStacks to true, reflecting their broader access rights.
//    - For non-administrative users, this is typically set to false, limiting their visibility to only stacks within their purview.

// 2. Inclusion Criteria for Orphaned Stacks:
//    - When IncludeOrphanedStacks is true and an EndpointID is specified (not zero), the function selects:
//      a) Stacks linked to the specified EndpointID.
//      b) Orphaned stacks that don't have a naming conflict with any stack associated with the EndpointID.
//    - This approach is designed to avoid name conflicts within Docker Compose, which restricts the creation of multiple stacks with the same name.

// 3. Type Matching for Orphaned Stacks:
//    - The function ensures that orphaned stacks are compatible with the environment's stack type (compose or swarm).
//    - It filters out orphaned swarm stacks in Docker standalone environments
//    - It filters out orphaned standalone stack in Docker swarm environments
//    - This ensures that re-association respects the constraints of the environment and stack type.

// The outcome is a new list of stacks that align with these filtering and business logic criteria.
func filterStacks(stacks []portainer.Stack, filters *stackListOperationFilters, endpoints []portainer.Endpoint) []portainer.Stack {
	if filters.EndpointID == 0 && filters.SwarmID == "" {
		return stacks
	}

	filteredStacks := make([]portainer.Stack, 0, len(stacks))
	uniqueStackNames := make(map[string]struct{})
	for _, stack := range stacks {
		if stack.Type == portainer.DockerComposeStack && stack.EndpointID == portainer.EndpointID(filters.EndpointID) {
			filteredStacks = append(filteredStacks, stack)
			uniqueStackNames[stack.Name] = struct{}{}
		}
		if stack.Type == portainer.DockerSwarmStack && stack.SwarmID == filters.SwarmID {
			filteredStacks = append(filteredStacks, stack)
			uniqueStackNames[stack.Name] = struct{}{}
		}
	}

	for _, stack := range stacks {
		if filters.IncludeOrphanedStacks && isOrphanedStack(stack, endpoints) {
			if (stack.Type == portainer.DockerComposeStack && filters.SwarmID == "") || (stack.Type == portainer.DockerSwarmStack && filters.SwarmID != "") {
				if _, exists := uniqueStackNames[stack.Name]; !exists {
					filteredStacks = append(filteredStacks, stack)
				}
			}
		}
	}

	return filteredStacks
}

func isOrphanedStack(stack portainer.Stack, endpoints []portainer.Endpoint) bool {
	for _, endpoint := range endpoints {
		if stack.EndpointID == endpoint.ID {
			return false
		}
	}

	return true
}
