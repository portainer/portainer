package helm

import (
	"testing"

	"github.com/portainer/portainer/api/kubernetes"
	"github.com/stretchr/testify/assert"
)

func Test_Install(t *testing.T) {
	is := assert.New(t)

	kubeConfigService := kubernetes.NewKubeConfigCAService("")
	// assume helm is in $PATH
	hbpm := NewHelmBinaryPackageManager(kubeConfigService, "")

	t.Run("successfully installs nginx chart with name test-nginx", func(t *testing.T) {
		// helm install test-nginx --repo https://charts.bitnami.com/bitnami nginx
		installOpts := InstallOptions{
			Name:  "test-nginx",
			Chart: "nginx",
			Repo:  "https://charts.bitnami.com/bitnami",
		}
		release, err := hbpm.Install(installOpts, "", "")
		defer hbpm.Run("uninstall", []string{"test-nginx"}, "", "")

		is.NoError(err, "should successfully install release", release)
	})

	t.Run("successfully installs nginx chart with generated name", func(t *testing.T) {
		// helm install --generate-name --repo https://charts.bitnami.com/bitnami nginx
		installOpts := InstallOptions{
			Chart: "nginx",
			Repo:  "https://charts.bitnami.com/bitnami",
		}
		release, err := hbpm.Install(installOpts, "", "")
		defer hbpm.Run("uninstall", []string{release.Name}, "", "")

		is.NoError(err, "should successfully install release", release)
	})

	// TODO
	// t.Run("successfully installs nginx with values", func(t *testing.T) {
	// 	installOpts := InstallOptions{
	// 		Name: "test-nginx-2",
	// 		ValuesFile: "tempfile",
	// 	}
	// 	release, err := hbpm.Install(installOpts, "", "")
	// 	defer hbpm.Run("uninstall", []string{"test-nginx-2"}, "", "")

	// 	is.NoError(err, "should successfully install release", release)
	// })
}
