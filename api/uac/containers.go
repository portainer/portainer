package uac

import (
	"github.com/docker/docker/api/types/container"
	portainer "github.com/portainer/portainer/api"
)

func ContainerResourceControlGetter[
	TX txLike[RCS, TS, US],
	RCS rcServiceLike,
	TS teamServiceLike,
	US userServiceLike,
](
	tx TX,
	endpointID portainer.EndpointID,
) func(item container.Summary) (*portainer.ResourceControl, error) {
	return genericResourcControlGetter(tx, endpointID, ResourceContext[container.Summary]{
		RCType:       portainer.ContainerResourceControl,
		IDGetter:     ContainerResourceControlID,
		LabelsGetter: ContainerLabels,
	})
}

func ContainerResourceControlID(item container.Summary) string {
	return item.ID
}

func ContainerLabels(item container.Summary) map[string]string {
	return item.Labels
}
