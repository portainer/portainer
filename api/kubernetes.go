package portainer

func KubernetesDefault() KubernetesData {
	return KubernetesData{
		Configuration: KubernetesConfiguration{
			UseLoadBalancer:  false,
			UseServerMetrics: false,
			StorageClasses:   []KubernetesStorageClassConfig{},
			IngressClasses:   []KubernetesIngressClassConfig{},
		},
		Snapshots: []KubernetesSnapshot{},
	}
}
