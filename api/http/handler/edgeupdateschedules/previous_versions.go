package edgeupdateschedules

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/edge/updateschedule"
	"golang.org/x/exp/slices"
)

// @id EdgeUpdatePreviousVersions
// @summary Fetches the previous versions of updated agents
// @description
// @description **Access policy**: authenticated
// @tags edge_update_schedules
// @security ApiKeyAuth
// @security jwt
// @produce json
// @success 200 {array} string
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /edge_update_schedules/agent_versions [get]
func (handler *Handler) previousVersions(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	schedules, err := handler.dataStore.EdgeUpdateSchedule().List()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve the edge update schedules list", err)
	}

	versionMap := previousVersions(schedules, handler.dataStore.EdgeUpdateSchedule().ActiveSchedule)

	return response.JSON(w, versionMap)
}

type EnvironmentVersionDetails struct {
	version    string
	skip       bool
	skipReason string
}

func previousVersions(schedules []updateschedule.UpdateSchedule, activeScheduleGetter func(environmentID portainer.EndpointID) *updateschedule.EndpointUpdateScheduleRelation) map[portainer.EndpointID]string {

	slices.SortFunc(schedules, func(a updateschedule.UpdateSchedule, b updateschedule.UpdateSchedule) bool {
		return a.Created > b.Created
	})

	environmentMap := map[portainer.EndpointID]*EnvironmentVersionDetails{}
	// to all schedules[:schedule index -1].Created > schedule.Created
	for _, schedule := range schedules {
		for environmentId, version := range schedule.EnvironmentsPreviousVersions {
			props, ok := environmentMap[environmentId]
			if !ok {
				environmentMap[environmentId] = &EnvironmentVersionDetails{}
				props = environmentMap[environmentId]
			}

			if props.version != "" || props.skip {
				continue
			}

			if schedule.Type == updateschedule.UpdateScheduleRollback {
				props.skip = true
				props.skipReason = "has rollback"
				continue
			}

			activeSchedule := activeScheduleGetter(environmentId)

			if activeSchedule != nil {
				props.skip = true
				props.skipReason = "has active schedule"
				continue
			}

			props.version = version
		}
	}

	versionMap := map[portainer.EndpointID]string{}
	for environmentId, props := range environmentMap {
		if !props.skip {
			versionMap[environmentId] = props.version
		}
	}

	return versionMap
}
