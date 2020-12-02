package endpoints

import (
	"net/http"
	"fmt"
	"errors"
	"strings"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"
	"github.com/portainer/portainer/api/http/security"
)

type resourcePoolUpdatePayload struct {
	UsersToAdd     []int
	TeamsToAdd     []int
	UsersToRemove  []int
	TeamsToRemove  []int
}

func (payload *resourcePoolUpdatePayload) Validate(r *http.Request) error {
	return nil
}

// PUT request on /api/endpoints/:id/pools/:rpn/access
func (handler *Handler) endpointPoolsAccessUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid endpoint identifier route variable", err}
	}

	resourcePoolName, err := request.RetrieveRouteVariableValue(r, "rpn")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid resource pool identifier route variable", err}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err == bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint with the specified identifier inside the database", err}
	}

	permissionDeniedErr := "Permission denied to access endpoint"
	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, permissionDeniedErr, err}
	}

	if tokenData.Role != portainer.AdministratorRole {
		// check if the user has Configuration RW access in the endpoint
		endpointRole, err := handler.AuthorizationService.GetUserEndpointRole(int(tokenData.ID), int(endpoint.ID))
		if err != nil {
			return &httperror.HandlerError{http.StatusForbidden, permissionDeniedErr, err}
		} else if !endpointRole.Authorizations[portainer.OperationK8sConfigurationsW] {
			err = errors.New(permissionDeniedErr)
			return &httperror.HandlerError{http.StatusForbidden, permissionDeniedErr, err}
		}
		// will deny if user cannot access all namespaces
		if !endpointRole.Authorizations[portainer.OperationK8sAccessAllNamespaces] {
			err = errors.New(permissionDeniedErr)
			return &httperror.HandlerError{http.StatusForbidden, permissionDeniedErr, err}
		}
	}

	var payload resourcePoolUpdatePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	errs := []string{}

	// for users been added, we just refresh his token cache
	// frontend will handle the configmap update
	if payload.UsersToAdd != nil && len(payload.UsersToAdd) > 0 {
		for _, userID := range payload.UsersToAdd {
			// make sure the user has a role in the current endpoint, thus is managed
			// by the current endpoint admin
			role, err := handler.AuthorizationService.GetUserEndpointRole(userID, endpointID)
			if err != nil {
				errs = append(errs, fmt.Errorf("Unable to get user endpoint access %d @ %d: %w", userID, endpointID, err).Error())
			} else if role != nil {
				handler.AuthorizationService.TriggerUserAuthUpdate(userID)
			} else {
				errs = append(errs, fmt.Errorf("Access of user %d cannot be updated by the current user @ %d: %w", userID, endpointID, err).Error())
			}
		}
	}

	// for users been removed, we refresh his token cache and remove his role bindings
	// in the namespaces of the specified endpoint. frontend will handle the configmap update
	if payload.UsersToRemove != nil && len(payload.UsersToRemove) > 0 {
		kcl, err := handler.K8sClientFactory.GetKubeClient(endpoint)
		if err != nil {
			errs = append(errs, fmt.Errorf("Unable to get k8s endpoint access @ %d: %w", endpointID, err).Error())
		} else {
			for _, userID := range payload.UsersToRemove {
				// make sure the user has a role in the current endpoint, thus is managed
				// by the current endpoint admin
				role, err := handler.AuthorizationService.GetUserEndpointRole(userID, endpointID)
				if err != nil {
					errs = append(errs, fmt.Errorf("Unable to get user endpoint access %d @ %d: %w", userID, endpointID, err).Error())
				} else if role != nil {
					err := kcl.RemoveUserNamespaceBindings(userID, resourcePoolName)
					handler.AuthorizationService.TriggerUserAuthUpdate(userID)
					if err != nil {
						errs = append(errs, fmt.Errorf("Unable to remove user resource pool bindings %d @ %d: %w", userID, endpointID, err).Error())
					}
				} else {
					errs = append(errs, fmt.Errorf("Access of user %d cannot be updated by the current user @ %d: %w", userID, endpointID, err).Error())
				}
			}
		}
	}

	if (payload.TeamsToAdd != nil && len(payload.TeamsToAdd) > 0) || 
		(payload.TeamsToRemove != nil && len(payload.TeamsToRemove) > 0) {
		handler.AuthorizationService.TriggerEndpointAuthUpdate(endpointID)
	}

	if len(errs) > 0 {
		err = fmt.Errorf(strings.Join(errs, "\n"))
		return &httperror.HandlerError{http.StatusInternalServerError, "There are 1 or more errors when updating resource pool access", err}
	}

	return response.Empty(w)
}
