package portainer

func KubernetesDefault() KubernetesData {
	return KubernetesData{
		Snapshots: []KubernetesSnapshot{},
	}
}
