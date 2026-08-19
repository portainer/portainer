package options

type GetOptions struct {
	Name      string
	Namespace string
	// ShowResources indicates whether to display the resources of the named release
	ShowResources           bool
	Revision                int
	KubernetesClusterAccess *KubernetesClusterAccess

	Env []string
}
