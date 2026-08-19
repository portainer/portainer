package uac

import (
	"github.com/docker/docker/api/types/swarm"
	portainer "github.com/portainer/portainer/api"
)

func SecretResourceControlGetter[
	TX txLike[RCS, TS, US],
	RCS rcServiceLike,
	TS teamServiceLike,
	US userServiceLike,
](
	tx TX,
	endpointID portainer.EndpointID,
) func(item swarm.Secret) (*portainer.ResourceControl, error) {
	return genericResourcControlGetter(tx, endpointID, ResourceContext[swarm.Secret]{
		RCType:       portainer.SecretResourceControl,
		IDGetter:     SecretResourceControlID,
		LabelsGetter: SecretLabels,
	})
}

func SecretResourceControlID(item swarm.Secret) string {
	return item.ID
}

func SecretLabels(item swarm.Secret) map[string]string {
	return item.Spec.Labels
}
