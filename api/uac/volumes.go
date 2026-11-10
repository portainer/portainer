package uac

import (
	"fmt"

	"github.com/docker/docker/api/types/volume"
	portainer "github.com/portainer/portainer/api"
)

// VolumeResourceControlGetter returns a resource control lookup function for volumes.
//
// dockerID identifies the Docker engine (or Swarm cluster) the volume belongs to. It must be
// included in the lookup key because Docker volume names are only unique within a single
// engine/cluster, not globally - see VolumeResourceControlID.
func VolumeResourceControlGetter[
	TX txLike[RCS, TS, US],
	RCS rcServiceLike,
	TS teamServiceLike,
	US userServiceLike,
](
	tx TX,
	endpointID portainer.EndpointID,
	dockerID string,
) func(item volume.Volume) (*portainer.ResourceControl, error) {
	return genericResourcControlGetter(tx, endpointID, ResourceContext[volume.Volume]{
		RCType: portainer.VolumeResourceControl,
		IDGetter: func(item volume.Volume) string {
			return VolumeResourceControlID(item, dockerID)
		},
		LabelsGetter: VolumeLabels,
	})
}

// VolumeResourceControlID builds the resource control ID for a volume. It must match
// Transport.getVolumeResourceID in api/http/proxy/factory/docker/volumes.go, which is the
// key used when a volume's ResourceControl is created and when the Docker proxy filters
// the volumes list - otherwise lookups here silently miss and the volume is treated as
// having no ResourceControl.
func VolumeResourceControlID(item volume.Volume, dockerID string) string {
	return fmt.Sprintf("%s_%s", item.Name, dockerID)
}

func VolumeLabels(item volume.Volume) map[string]string {
	return item.Labels
}
