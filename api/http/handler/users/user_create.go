package users

import (
	"net/http"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
)

type userCreatePayload struct {
	Username string
	Password string
	Role     int
}

func (payload *userCreatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Username) || govalidator.Contains(payload.Username, " ") {
		return portainer.Error("Invalid username. Must not contain any whitespace")
	}

	if payload.Role != 1 && payload.Role != 2 {
		return portainer.Error("Invalid role value. Value must be one of: 1 (administrator) or 2 (regular user)")
	}
	return nil
}

// POST request on /api/users
func (handler *Handler) userCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload userCreatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	if !securityContext.IsAdmin && !securityContext.IsTeamLeader {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to create user", portainer.ErrResourceAccessDenied}
	}

	if securityContext.IsTeamLeader && payload.Role == 1 {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to create administrator user", portainer.ErrResourceAccessDenied}
	}

	user, err := handler.UserService.UserByUsername(payload.Username)
	if err != nil && err != portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve users from the database", err}
	}
	if user != nil {
		return &httperror.HandlerError{http.StatusConflict, "Another user with the same username already exists", portainer.ErrUserAlreadyExists}
	}

	// TODO: externalize default authorization list?
	user = &portainer.User{
		Username: payload.Username,
		Role:     portainer.UserRole(payload.Role),
		PortainerAuthorizations: map[portainer.Authorization]bool{
			portainer.OperationPortainerDockerHubInspect: true,
			// portainer.OperationPortainerDockerHubUpdate:           true,
			// portainer.OperationPortainerEndpointGroupCreate:       true,
			portainer.OperationPortainerEndpointGroupList: true,
			// portainer.OperationPortainerEndpointGroupDelete:       true,
			// portainer.OperationPortainerEndpointGroupInspect:      true,
			// portainer.OperationPortainerEndpointGroupUpdate:       true,
			// portainer.OperationPortainerEndpointGroupAccess:       true,
			portainer.OperationPortainerEndpointList:    true,
			portainer.OperationPortainerEndpointInspect: true,
			// portainer.OperationPortainerEndpointCreate:            true,
			// portainer.OperationPortainerEndpointExtensionAdd:      true,
			// portainer.OperationPortainerEndpointJob:               true,
			// portainer.OperationPortainerEndpointSnapshots:         true,
			// portainer.OperationPortainerEndpointSnapshot:          true,
			// portainer.OperationPortainerEndpointUpdate:            true,
			// portainer.OperationPortainerEndpointUpdateAccess:      true,
			// portainer.OperationPortainerEndpointDelete:            true,
			portainer.OperationPortainerEndpointExtensionRemove: true,
			portainer.OperationPortainerExtensionList:           true,
			// portainer.OperationPortainerExtensionInspect:          true,
			// portainer.OperationPortainerExtensionCreate:           true,
			// portainer.OperationPortainerExtensionUpdate:           true,
			// portainer.OperationPortainerExtensionDelete:           true,
			portainer.OperationPortainerMOTD:         true,
			portainer.OperationPortainerRegistryList: true,
			// portainer.OperationPortainerRegistryInspect:           true,
			// portainer.OperationPortainerRegistryCreate:            true,
			// portainer.OperationPortainerRegistryConfigure:         true,
			// portainer.OperationPortainerRegistryUpdate:            true,
			// portainer.OperationPortainerRegistryUpdateAccess:      true,
			// portainer.OperationPortainerRegistryDelete:            true,
			// portainer.OperationPortainerResourceControlCreate:     true,
			// portainer.OperationPortainerResourceControlUpdate:     true,
			// portainer.OperationPortainerResourceControlDelete:     true,
			// portainer.OperationPortainerRoleList:                  true,
			// portainer.OperationPortainerRoleInspect:               true,
			// portainer.OperationPortainerRoleCreate:                true,
			// portainer.OperationPortainerRoleUpdate:                true,
			// portainer.OperationPortainerRoleDelete:                true,
			// portainer.OperationPortainerScheduleList:              true,
			// portainer.OperationPortainerScheduleInspect:           true,
			// portainer.OperationPortainerScheduleFile:              true,
			// portainer.OperationPortainerScheduleTasks:             true,
			// portainer.OperationPortainerScheduleCreate:            true,
			// portainer.OperationPortainerScheduleUpdate:            true,
			// portainer.OperationPortainerScheduleDelete:            true,
			// portainer.OperationPortainerSettingsInspect:           true,
			// portainer.OperationPortainerSettingsUpdate:            true,
			// portainer.OperationPortainerSettingsLDAPCheck:         true,

			// portainer.OperationPortainerStackCreate:               true,
			// portainer.OperationPortainerStackMigrate:              true,
			// portainer.OperationPortainerStackUpdate:               true,
			// portainer.OperationPortainerStackDelete:               true,
			// portainer.OperationPortainerTagList:                   true,
			// portainer.OperationPortainerTagCreate:                 true,
			// portainer.OperationPortainerTagDelete:                 true,
			// portainer.OperationPortainerTeamMembershipList:        true,
			// portainer.OperationPortainerTeamMembershipCreate:      true,
			// portainer.OperationPortainerTeamMembershipUpdate:      true,
			// portainer.OperationPortainerTeamMembershipDelete:      true,
			portainer.OperationPortainerTeamList: true,
			// portainer.OperationPortainerTeamInspect:               true,
			// portainer.OperationPortainerTeamMemberships:           true,
			// portainer.OperationPortainerTeamCreate:                true,
			// portainer.OperationPortainerTeamUpdate:                true,
			// portainer.OperationPortainerTeamDelete:                true,
			portainer.OperationPortainerTemplateList:    true,
			portainer.OperationPortainerTemplateInspect: true,
			// portainer.OperationPortainerTemplateCreate:            true,
			// portainer.OperationPortainerTemplateUpdate:            true,
			// portainer.OperationPortainerTemplateDelete:            true,
			// portainer.OperationPortainerUploadTLS:                 true,
			portainer.OperationPortainerUserList: true,
			// portainer.OperationPortainerUserInspect:               true,
			portainer.OperationPortainerUserMemberships: true,
			// portainer.OperationPortainerUserCreate:                true,
			// portainer.OperationPortainerUserUpdate:                true,
			// portainer.OperationPortainerUserUpdatePassword:        true,
			// portainer.OperationPortainerUserDelete:                true,
			// portainer.OperationPortainerWebsocketExec:             true,
			// portainer.OperationPortainerWebhookCreate:             true,
			// portainer.OperationPortainerWebhookDelete:             true,
		},
	}

	settings, err := handler.SettingsService.Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve settings from the database", err}
	}

	if settings.AuthenticationMethod == portainer.AuthenticationInternal {
		user.Password, err = handler.CryptoService.Hash(payload.Password)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to hash user password", portainer.ErrCryptoHashFailure}
		}
	}

	err = handler.UserService.CreateUser(user)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist user inside the database", err}
	}

	hideFields(user)
	return response.JSON(w, user)
}
