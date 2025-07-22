package options

import (
	"time"

	portainer "github.com/portainer/portainer/api"
)

type InstallOptions struct {
	Name                    string
	Chart                   string
	Version                 string
	Namespace               string
	Repo                    string
	Registry                *portainer.Registry
	Wait                    bool
	ValuesFile              string
	PostRenderer            string
	Atomic                  bool
	DryRun                  bool
	Timeout                 time.Duration
	KubernetesClusterAccess *KubernetesClusterAccess

	// Optional environment vars to pass when running helm
	Env []string
}
