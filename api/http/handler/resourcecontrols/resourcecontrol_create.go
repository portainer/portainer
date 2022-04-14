package resourcecontrols

import (
	"errors"
	"net/http"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
)

type resourceControlCreatePayload struct {
	//
	ResourceID string `example:"617c5f22bb9b023d6daab7cba43a57576f83492867bc767d1c59416b065e5f08" validate:"required"`
	// Type of Resource. Valid values are: 1 - container, 2 - service
	// 3 - volume, 4 - network, 5 - secret, 6 - stack, 7 - config, 8 - custom template, 9 - azure-container-group
	Type portainer.ResourceControlType `example:"1" validate:"required" enums:"1,2,3,4,5,6,7,8,9"`
	// Permit access to the associated resource to any user
	Public bool `example:"true"`
	// Permit access to resource only to admins
	AdministratorsOnly bool `example:"true"`
	// List of user identifiers with access to the associated resource
	Users []int `example:"1,4"`
	// List of team identifiers with access to the associated resource
	Teams []int `example:"56,7"`
	// List of Docker resources that will inherit this access control
	SubResourceIDs []string `example:"617c5f22bb9b023d6daab7cba43a57576f83492867bc767d1c59416b065e5f08"`
}

var (
	errResourceControlAlreadyExists = errors.New("A resource control is already applied on this resource") //http/resourceControl
	errInvalidResourceControlType   = errors.New("Unsupported resource control type")                      //http/resourceControl
)

func (payload *resourceControlCreatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.ResourceID) {
		return errors.New("invalid payload: invalid resource identifier")
	}

	if payload.Type <= 0 || payload.Type >= 10 {
		return errors.New("invalid payload: Invalid type value. Value must be one of: 1 - container, 2 - service, 3 - volume, 4 - network, 5 - secret, 6 - stack, 7 - config, 8 - custom template, 9 - azure-container-group")
	}

	if len(payload.Users) == 0 && len(payload.Teams) == 0 && !payload.Public && !payload.AdministratorsOnly {
		return errors.New("invalid payload: must specify Users, Teams, Public or AdministratorsOnly")
	}

	if payload.Public && payload.AdministratorsOnly {
		return errors.New("invalid payload: cannot set both public and administrators only flags to true")
	}
	return nil
}

// @id ResourceControlCreate
// @summary Create a new resource control
// @description Create a new resource control to restrict access to a Docker resource.
// @description **Access policy**: administrator
// @tags resource_controls
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param body body resourceControlCreatePayload true "Resource control details"
// @success 200 {object} portainer.ResourceControl "Success"
// @failure 400 "Invalid request"
// @failure 409 "Resource control already exists"
// @failure 500 "Server error"
// @router /resource_controls [post]
func (handler *Handler) resourceControlCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload resourceControlCreatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	rc, err := handler.DataStore.ResourceControl().ResourceControlByResourceIDAndType(payload.ResourceID, payload.Type)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve resource controls from the database", err}
	}
	if rc != nil {
		return &httperror.HandlerError{http.StatusConflict, "A resource control is already associated to this resource", errResourceControlAlreadyExists}
	}

	var userAccesses = make([]portainer.UserResourceAccess, 0)
	for _, v := range payload.Users {
		userAccess := portainer.UserResourceAccess{
			UserID:      portainer.UserID(v),
			AccessLevel: portainer.ReadWriteAccessLevel,
		}
		userAccesses = append(userAccesses, userAccess)
	}

	var teamAccesses = make([]portainer.TeamResourceAccess, 0)
	for _, v := range payload.Teams {
		teamAccess := portainer.TeamResourceAccess{
			TeamID:      portainer.TeamID(v),
			AccessLevel: portainer.ReadWriteAccessLevel,
		}
		teamAccesses = append(teamAccesses, teamAccess)
	}

	resourceControl := portainer.ResourceControl{
		ResourceID:         payload.ResourceID,
		SubResourceIDs:     payload.SubResourceIDs,
		Type:               payload.Type,
		Public:             payload.Public,
		AdministratorsOnly: payload.AdministratorsOnly,
		UserAccesses:       userAccesses,
		TeamAccesses:       teamAccesses,
	}

	err = handler.DataStore.ResourceControl().Create(&resourceControl)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the resource control inside the database", err}
	}

	return response.JSON(w, resourceControl)
}
