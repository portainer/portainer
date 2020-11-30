package endpoints

import (
	"errors"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
)

func (handler *Handler) endpointDeleteTokens(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	permissionDeniedErr := "Permission denied to delete endpoint tokens"
	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, permissionDeniedErr, err}
	}

	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid endpoint identifier route variable", err}
	}

	if tokenData.Role != portainer.AdministratorRole {
		// check if the user has configmap W access in the endpoint
		endpointRole, err := handler.AuthorizationService.GetUserEndpointRole(int(tokenData.ID), endpointID)
		if err != nil {
			return &httperror.HandlerError{http.StatusForbidden, permissionDeniedErr, err}
		} else if !endpointRole.Authorizations[portainer.OperationK8sConfigurationsW] {
			err = errors.New(permissionDeniedErr)
			return &httperror.HandlerError{http.StatusForbidden, permissionDeniedErr, err}
		}
		// will deny if user can not access all namespaces
		if !endpointRole.Authorizations[portainer.OperationK8sAccessAllNamespaces] {
			err = errors.New(permissionDeniedErr)
			return &httperror.HandlerError{http.StatusForbidden, permissionDeniedErr, err}
		}
	}
	
	handler.AuthorizationService.TriggerUsersAuthUpdate()

	return response.Empty(w)
}