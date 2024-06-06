package cli

import "k8s.io/apimachinery/pkg/version"

func (kcl *KubeClient) ServerVersion() (*version.Info, error) {
	return kcl.cli.Discovery().ServerVersion()
}
