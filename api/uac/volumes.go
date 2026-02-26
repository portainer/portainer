package uac

import (
	"github.com/docker/docker/api/types/volume"
	portainer "github.com/portainer/portainer/api"
)

func VolumeResourceControlGetter[
	TX txLike[RCS, TS, US],
	RCS rcServiceLike,
	TS teamServiceLike,
	US userServiceLike,
](
	tx TX,
	endpointID portainer.EndpointID,
) func(item volume.Volume) (*portainer.ResourceControl, error) {
	return genericResourcControlGetter(tx, endpointID, ResourceContext[volume.Volume]{
		RCType:       portainer.VolumeResourceControl,
		IDGetter:     VolumeResourceControlID,
		LabelsGetter: VolumeLabels,
	})
}

// TODO: use a copy of getVolumeResourceID()
// or change the key (+ migrate) to not require using the dockerID/swarm nodeID
func VolumeResourceControlID(item volume.Volume) string {
	return item.Name
}

func VolumeLabels(item volume.Volume) map[string]string {
	return item.Labels
}
