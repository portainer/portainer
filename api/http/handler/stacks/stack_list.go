package stacks

import (
	"net/http"
	"slices"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/source"
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

	var endpoints []portainer.Endpoint
	var stacks []portainer.Stack
	var resourceControls []portainer.ResourceControl

	if err := handler.DataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		endpoints, err = tx.Endpoint().Endpoints()
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve environments from database", err)
		}

		stacks, err = tx.Stack().ReadAll()
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve stacks from the database", err)
		}

		resourceControls, err = tx.ResourceControl().ReadAll()
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve resource controls from the database", err)
		}

		return nil
	}); err != nil {
		return response.TxErrorResponse(err)
	}

	stacks = filterStacks(stacks, &filters, endpoints)

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve info from request context", err)
	}

	stacks = authorization.DecorateStacks(stacks, resourceControls)

	if !securityContext.IsAdmin {
		if filters.IncludeOrphanedStacks {
			return httperror.Forbidden("Permission denied to access orphaned stacks", httperrors.ErrUnauthorized)
		}

		var user *portainer.User
		if err := handler.DataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
			user, err = tx.User().Read(securityContext.UserID)
			return err
		}); err != nil {
			return httperror.InternalServerError("Unable to retrieve user information from the database", err)
		}

		endpointGroups, err := handler.DataStore.EndpointGroup().ReadAll()
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve environment groups from the database", err)
		}

		accessibleEndpointIDs := security.AccessibleEndpointIDs(endpoints, endpointGroups, securityContext)
		userTeamIDs := authorization.TeamIDs(securityContext.UserMemberships)

		stacks = authorization.FilterAuthorizedStacks(stacks, user.ID, userTeamIDs, accessibleEndpointIDs)

		if err := handler.redactWebhooks(securityContext, stacks, endpoints); err != nil {
			return httperror.InternalServerError("Unable to verify user authorizations to manage stacks", err)
		}
	}

	err = handler.DataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
		userContext := source.NewUserContext(securityContext.User, securityContext.UserMemberships)
		for i := range stacks {
			if err := fillStackGitConfig(tx, userContext, &stacks[i]); err != nil {
				return httperror.InternalServerError("Unable to load git config for stack", err)
			}
		}
		return nil
	})

	return response.TxResponse(w, stacks, err)
}

// redactWebhooks clears the webhook of the stacks the user can't manage,
// as anyone holding the webhook can redeploy the stack
func (handler *Handler) redactWebhooks(
	securityContext *security.RestrictedRequestContext,
	stacks []portainer.Stack,
	endpoints []portainer.Endpoint,
) error {
	canManageByEndpoint := make(map[portainer.EndpointID]bool)

	for i := range stacks {
		stack := &stacks[i]
		if stack.AutoUpdate == nil || stack.AutoUpdate.Webhook == "" {
			continue
		}

		canManage, ok := canManageByEndpoint[stack.EndpointID]
		if !ok {
			// an orphaned stack has no environment and keeps canManage false
			endpointIdx := slices.IndexFunc(endpoints, func(e portainer.Endpoint) bool { return e.ID == stack.EndpointID })
			if endpointIdx >= 0 {
				var err error
				if canManage, err = handler.userCanManageStacks(securityContext, &endpoints[endpointIdx]); err != nil {
					return err
				}
			}

			canManageByEndpoint[stack.EndpointID] = canManage
		}

		if !canManage {
			stack.AutoUpdate.Webhook = ""
		}
	}

	return nil
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
