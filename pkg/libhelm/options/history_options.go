package options

type HistoryOptions struct {
	Name                    string
	Namespace               string
	KubernetesClusterAccess *KubernetesClusterAccess

	Env []string
}
