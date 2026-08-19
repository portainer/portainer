package portainer

func KubernetesDefault() KubernetesData {
	return KubernetesData{
		Configuration: KubernetesConfiguration{
			UseLoadBalancer:          false,
			UseServerMetrics:         false,
			EnableResourceOverCommit: true,
			StorageClasses:           []KubernetesStorageClassConfig{},
			IngressClasses:           []KubernetesIngressClassConfig{},
		},
		Snapshots: []KubernetesSnapshot{},
	}
}
