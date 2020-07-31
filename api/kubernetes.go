package portainer

func KubernetesDefault() KubernetesData {
	return KubernetesData{
		Configuration: KubernetesConfiguration{
			UseLoadBalancer:  false,
			UseServerMetrics: false,
			UseIngress: false,
			StorageClasses:  []KubernetesStorageClassConfig{},
			IngressClasses: "",
		},
		Snapshots: []KubernetesSnapshot{},
	}
}
