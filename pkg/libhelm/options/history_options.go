package options

type HistoryOptions struct {
	Name                    string
	Namespace               string
	KubernetesClusterAccess *KubernetesClusterAccess
	ReleaseStorage          ReleaseStorage

	Env []string
}
