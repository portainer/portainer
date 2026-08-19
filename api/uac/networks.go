package uac

import (
	"github.com/docker/docker/api/types/network"
	portainer "github.com/portainer/portainer/api"
)

func NetworkResourceControlGetter[
	TX txLike[RCS, TS, US],
	RCS rcServiceLike,
	TS teamServiceLike,
	US userServiceLike,
](
	tx TX,
	endpointID portainer.EndpointID,
) func(item network.Summary) (*portainer.ResourceControl, error) {
	return genericResourcControlGetter(tx, endpointID, ResourceContext[network.Summary]{
		RCType:       portainer.NetworkResourceControl,
		IDGetter:     NetworkResourceControlID,
		LabelsGetter: NetworkLabels,
	})
}

func NetworkResourceControlID(item network.Summary) string {
	return item.ID
}

func NetworkLabels(item network.Summary) map[string]string {
	return item.Labels
}
