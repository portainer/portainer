package options

// ListOptions are portainer supported options for `helm list`
type ListOptions struct {
	Filter                  string
	Selector                string
	Namespace               string
	KubernetesClusterAccess *KubernetesClusterAccess

	Env []string
}
