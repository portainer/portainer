package options

// UninstallOptions are portainer supported options for `helm uninstall`
type UninstallOptions struct {
	Name                    string
	Namespace               string
	KubernetesClusterAccess *KubernetesClusterAccess

	Env []string
}
