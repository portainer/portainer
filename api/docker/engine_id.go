package docker

import "github.com/docker/docker/api/types/system"

// EngineID returns the identifier of the Docker engine (or Swarm cluster) a snapshot of
// Docker info was taken from. It must stay consistent with Transport.getDockerID in
// api/http/proxy/factory/docker/volumes.go, since both are used to build the same volume
// ResourceControl lookup key.
func EngineID(info system.Info) string {
	if info.Swarm.Cluster != nil {
		return info.Swarm.Cluster.ID
	}
	return info.ID
}
