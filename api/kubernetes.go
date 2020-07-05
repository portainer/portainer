package portainer

func KubernetesDefault() KubernetesData {
	return KubernetesData{
		Configuration: KubernetesConfiguration{
			UseLoadBalancer: false,
			StorageClasses:  []KubernetesStorageClassConfig{},
		},
		Snapshots: []KubernetesSnapshot{},
	}
}
