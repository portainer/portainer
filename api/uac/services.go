package uac

import (
	"github.com/docker/docker/api/types/swarm"
	portainer "github.com/portainer/portainer/api"
)

func ServiceResourceControlGetter[
	TX txLike[RCS, TS, US],
	RCS rcServiceLike,
	TS teamServiceLike,
	US userServiceLike,
](
	tx TX,
	endpointID portainer.EndpointID,
) func(item swarm.Service) (*portainer.ResourceControl, error) {
	return genericResourcControlGetter(tx, endpointID, ResourceContext[swarm.Service]{
		RCType:       portainer.ServiceResourceControl,
		IDGetter:     ServiceResourceControlID,
		LabelsGetter: ServiceLabels,
	})
}

func ServiceResourceControlID(item swarm.Service) string {
	return item.ID
}

func ServiceLabels(item swarm.Service) map[string]string {
	return item.Spec.Labels
}
