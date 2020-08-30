package portainer

func KubernetesDefault() KubernetesData {
	return KubernetesData{
		Configuration: KubernetesConfiguration{
			UseLoadBalancer:              false,
			UseServerMetrics:             false,
			EnableResourceOverCommit:     false,
			ResourceOverCommitPercentage: 80,
			StorageClasses:               []KubernetesStorageClassConfig{},
			IngressClasses:               []KubernetesIngressClassConfig{},
		},
		Snapshots: []KubernetesSnapshot{},
	}
}
