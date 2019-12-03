package portainer

// SupportDirectSnapshot checks whether an endpoint can be used to trigger a direct a snapshot.
// It is mostly true for all endpoints except Edge and Azure endpoints.
func SupportDirectSnapshot(endpoint *Endpoint) bool {
	switch endpoint.Type {
	case EdgeAgentOnDockerEnvironment, EdgeAgentOnKubernetesEnvironment, AzureEnvironment:
		return false
	}
	return true
}

// SnapshotManager represents a service used to create endpoint snapshots
type SnapshotManager struct {
	dockerSnapshotter     DockerSnapshotter
	kubernetesSnapshotter KubernetesSnapshotter
}

// NewSnapshotManager returns a pointer to a new SnapshotManager instance
func NewSnapshotManager(docker DockerSnapshotter, kubernetes KubernetesSnapshotter) *SnapshotManager {
	return &SnapshotManager{
		dockerSnapshotter:     docker,
		kubernetesSnapshotter: kubernetes,
	}
}

// SnapshotEndpoint will create a snapshot of the endpoint based on the endpoint type.
// If the snapshot is a success, it will be associated to the endpoint.
func (manager *SnapshotManager) SnapshotEndpoint(endpoint *Endpoint) error {
	switch endpoint.Type {
	case AzureEnvironment:
		return nil
	case KubernetesLocalEnvironment, AgentOnKubernetesEnvironment, EdgeAgentOnKubernetesEnvironment:
		return manager.snapshotKubernetesEndpoint(endpoint)
	}

	return manager.snapshotDockerEndpoint(endpoint)
}

func (manager *SnapshotManager) snapshotKubernetesEndpoint(endpoint *Endpoint) error {
	snapshot, err := manager.kubernetesSnapshotter.CreateSnapshot(endpoint)
	if err != nil {
		return err
	}

	if snapshot != nil {
		endpoint.Kubernetes.Snapshots = []KubernetesSnapshot{*snapshot}
	}

	return nil
}

func (manager *SnapshotManager) snapshotDockerEndpoint(endpoint *Endpoint) error {
	snapshot, err := manager.dockerSnapshotter.CreateSnapshot(endpoint)
	if err != nil {
		return err
	}

	if snapshot != nil {
		endpoint.Snapshots = []DockerSnapshot{*snapshot}
	}

	return nil
}
