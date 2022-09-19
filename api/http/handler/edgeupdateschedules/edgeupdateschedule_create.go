package edgeupdateschedules

import (
	"fmt"
	"net/http"
	"time"

	"github.com/asaskevich/govalidator"
	"github.com/pkg/errors"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/edge/stacks"
	"github.com/portainer/portainer/api/edge/updateschedule"
	"github.com/portainer/portainer/api/internal/edge"
	"github.com/portainer/portainer/api/internal/set"
	"github.com/sirupsen/logrus"

	"github.com/portainer/portainer/api/http/security"
)

type createPayload struct {
	Name     string
	GroupIDs []portainer.EdgeGroupID
	Type     updateschedule.UpdateScheduleType
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

	if payload.Type != updateschedule.UpdateScheduleRollback && payload.Type != updateschedule.UpdateScheduleUpdate {
		return errors.New("Invalid schedule type")
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
// @accept json
// @param body body createPayload true "Schedule details"
// @produce json
// @success 200 {object} updateschedule.UpdateSchedule
// @failure 500
// @router /edge_update_schedules [post]
func (handler *Handler) create(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {

	var payload createPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	err = handler.validateUniqueName(payload.Name, 0)
	if err != nil {
		return httperror.NewError(http.StatusConflict, "Edge update schedule name already in use", err)

	}

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve user information from token", err)
	}

	var edgeStackID portainer.EdgeStackID
	var scheduleID updateschedule.UpdateScheduleID
	needCleanup := true
	defer func() {
		if !needCleanup {
			return
		}

		if scheduleID != 0 {
			err := handler.dataStore.EdgeUpdateSchedule().Delete(scheduleID)
			if err != nil {
				logrus.WithError(err).Error("Unable to cleanup edge update schedule")
			}
		}

		if edgeStackID != 0 {
			err := handler.dataStore.EdgeStack().DeleteEdgeStack(edgeStackID)
			if err != nil {
				logrus.WithError(err).Error("Unable to cleanup edge stack")
			}
		}
	}()

	item := &updateschedule.UpdateSchedule{
		Name:    payload.Name,
		Version: payload.Version,

		Created:   time.Now().Unix(),
		CreatedBy: tokenData.ID,
		Type:      payload.Type,
	}

	err = handler.dataStore.EdgeUpdateSchedule().Create(item)
	if err != nil {
		return httperror.InternalServerError("Unable to persist the edge update schedule", err)
	}

	scheduleID = item.ID

	previousVersions, err := handler.GetPreviousVersions(payload.GroupIDs)
	if err != nil {
		return httperror.InternalServerError("Unable to fetch previous versions for related endpoints", err)
	}

	item.EnvironmentsPreviousVersions = previousVersions

	edgeStackID, err = handler.createUpdateEdgeStack(item.ID, payload.Name, payload.GroupIDs, payload.Version)
	if err != nil {
		return httperror.InternalServerError("Unable to create edge stack", err)
	}

	item.EdgeStackID = edgeStackID
	err = handler.dataStore.EdgeUpdateSchedule().Update(item.ID, item)
	if err != nil {
		return httperror.InternalServerError("Unable to persist the edge update schedule", err)
	}

	needCleanup = false
	return response.JSON(w, item)
}

func buildEdgeStackName(scheduleId updateschedule.UpdateScheduleID, name string) string {
	return fmt.Sprintf("edge-update-schedule-%s-%d", name, scheduleId)
}

func (handler *Handler) GetPreviousVersions(edgeGroupIds []portainer.EdgeGroupID) (map[portainer.EndpointID]string, error) {
	relationConfig, err := stacks.FetchEndpointRelationsConfig(handler.dataStore)
	if err != nil {
		return nil, errors.WithMessage(err, "unable to fetch endpoint relations config")
	}

	relatedEndpointIds, err := edge.EdgeStackRelatedEndpoints(edgeGroupIds, relationConfig.Endpoints, relationConfig.EndpointGroups, relationConfig.EdgeGroups)
	if err != nil {
		return nil, errors.WithMessage(err, "unable to fetch related endpoints")
	}

	relatedEndpointIdsSet := set.ToSet(relatedEndpointIds)

	prevVersions := map[portainer.EndpointID]string{}

	environments, err := handler.dataStore.Endpoint().Endpoints()
	if err != nil {
		return nil, errors.WithMessage(err, "unable to fetch environments")
	}

	for _, environment := range environments {
		if !relatedEndpointIdsSet.Contains(environment.ID) {
			continue
		}

		prevVersions[environment.ID] = environment.Agent.Version
	}

	return prevVersions, nil
}
