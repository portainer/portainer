package portainer

func KubernetesDefault() KubernetesData {
	return KubernetesData{
		Configuration: KubernetesConfiguration{
			UseLoadBalancer:  false,
			UseServerMetrics: false,
			StorageClasses:   []KubernetesStorageClassConfig{},
		},
		Snapshots: []KubernetesSnapshot{},
	}
}
