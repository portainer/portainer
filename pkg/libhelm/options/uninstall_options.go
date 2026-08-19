package options

import "time"

// UninstallOptions are portainer supported options for `helm uninstall`
type UninstallOptions struct {
	Name                    string
	Namespace               string
	KubernetesClusterAccess *KubernetesClusterAccess

	// Wait blocks until all resources are deleted before returning (helm uninstall --wait).
	// Use when a restore will be applied immediately after uninstall so resources are gone first.
	Wait bool
	// Timeout is how long to wait for resources to be deleted when Wait is true (default 15m).
	Timeout time.Duration

	Env []string
}
