package edgeupdateschedules

import (
	"errors"
	"net/http"
	"time"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/security"
)

type createPayload struct {
	Name     string
	GroupIDs []portainer.EdgeGroupID
	Type     portainer.EdgeUpdateScheduleType
	Version  string
	Time     int64
}

func (payload *createPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return errors.New("Invalid tag name")
	}

	if len(payload.GroupIDs) == 0 {
		return errors.New("Required to choose at least one group")
	}

	if payload.Type != portainer.EdgeUpdateScheduleRollback && payload.Type != portainer.EdgeUpdateScheduleUpgrade {
		return errors.New("Invalid schedule type")
	}

	if payload.Version == "" {
		return errors.New("Invalid version")
	}

	if payload.Time < time.Now().Unix() {
		return errors.New("Invalid time")
	}

	return nil
}

// @id EdgeUpdateScheduleCreate
// @summary Creates a new Edge Update Schedule
// @description **Access policy**: administrator
// @tags edge_update_schedules
// @security ApiKeyAuth
// @security jwt
// @produce json
// @success 200 {object} portainer.EdgeUpdateSchedule
// @failure 500
// @router /edge_update_schedules [post]
func (handler *Handler) create(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {

	var payload createPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	err = handler.validateUniqueName(payload.Name)
	if err != nil {
		return httperror.NewError(http.StatusConflict, "Edge update schedule name already in use", err)

	}

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve user information from token", err)
	}

	item := &portainer.EdgeUpdateSchedule{
		Name:      payload.Name,
		Time:      payload.Time,
		GroupIDs:  payload.GroupIDs,
		Status:    map[portainer.EndpointID]portainer.EdgeUpdateScheduleStatus{},
		Created:   time.Now().Unix(),
		CreatedBy: tokenData.ID,
		Type:      payload.Type,
		Version:   payload.Version,
	}

	err = handler.dataStore.EdgeUpdateSchedule().Create(item)
	if err != nil {
		return httperror.InternalServerError("Unable to persist the edge update schedule", err)
	}

	return response.JSON(w, item)
}
