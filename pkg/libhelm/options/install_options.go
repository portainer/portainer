package options

type InstallOptions struct {
	Name                    string
	Chart                   string
	Namespace               string
	Repo                    string
	Wait                    bool
	ValuesFile              string
	PostRenderer            string
	KubernetesClusterAccess *KubernetesClusterAccess

	// Optional environment vars to pass when running helm
	Env []string
}
