package portainer

func KubernetesDefault() KubernetesData {
	return KubernetesData{
		Configuration: KubernetesConfiguration{
			UseLoadBalancer: false,
			StorageClasses:  []string{},
		},
		Snapshots: []KubernetesSnapshot{},
	}
}
