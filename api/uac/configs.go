package uac

import (
	"github.com/docker/docker/api/types/swarm"
	portainer "github.com/portainer/portainer/api"
)

func ConfigResourceControlGetter[
	TX txLike[RCS, TS, US],
	RCS rcServiceLike,
	TS teamServiceLike,
	US userServiceLike,
](
	tx TX,
	endpointID portainer.EndpointID,
) func(item swarm.Config) (*portainer.ResourceControl, error) {
	return genericResourcControlGetter(tx, endpointID, ResourceContext[swarm.Config]{
		RCType:       portainer.ConfigResourceControl,
		IDGetter:     ConfigResourceControlID,
		LabelsGetter: ConfigLabels,
	})
}

func ConfigResourceControlID(item swarm.Config) string {
	return item.ID
}

func ConfigLabels(item swarm.Config) map[string]string {
	return item.Spec.Labels
}
