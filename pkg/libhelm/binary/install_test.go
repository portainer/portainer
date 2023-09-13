package binary

import (
	"os"
	"os/exec"
	"path/filepath"
	"testing"

	"github.com/portainer/portainer/pkg/libhelm/options"
	"github.com/stretchr/testify/assert"
)

func createValuesFile(values string) (string, error) {
	file, err := os.CreateTemp("", "helm-values")
	if err != nil {
		return "", err
	}

	_, err = file.WriteString(values)
	if err != nil {
		file.Close()
		return "", err
	}

	err = file.Close()
	if err != nil {
		return "", err
	}

	return file.Name(), nil
}

// getHelmBinaryPath is helper function to get local helm binary path (if helm is in path)
func getHelmBinaryPath() (string, error) {
	path, err := exec.LookPath("helm")
	if err != nil {
		return "", err
	}
	dir, err := filepath.Abs(filepath.Dir(path))
	if err != nil {
		return "", err
	}
	return dir, nil
}

func Test_Install(t *testing.T) {
	ensureIntegrationTest(t)
	is := assert.New(t)

	path, err := getHelmBinaryPath()
	is.NoError(err, "helm binary must exist in path to run tests")

	hbpm := NewHelmBinaryPackageManager(path)

	t.Run("successfully installs nginx chart with name test-nginx", func(t *testing.T) {
		// helm install test-nginx --repo https://charts.bitnami.com/bitnami nginx
		installOpts := options.InstallOptions{
			Name:  "test-nginx",
			Chart: "nginx",
			Repo:  "https://charts.bitnami.com/bitnami",
		}

		release, err := hbpm.Install(installOpts)
		defer hbpm.run("uninstall", []string{"test-nginx"}, nil)

		is.NoError(err, "should successfully install release", release)
	})

	t.Run("successfully installs nginx chart with generated name", func(t *testing.T) {
		// helm install --generate-name --repo https://charts.bitnami.com/bitnami nginx
		installOpts := options.InstallOptions{
			Chart: "nginx",
			Repo:  "https://charts.bitnami.com/bitnami",
		}
		release, err := hbpm.Install(installOpts)
		defer hbpm.run("uninstall", []string{release.Name}, nil)

		is.NoError(err, "should successfully install release", release)
	})

	t.Run("successfully installs nginx with values", func(t *testing.T) {
		// helm install test-nginx-2 --repo https://charts.bitnami.com/bitnami nginx --values /tmp/helm-values3161785816
		values, err := createValuesFile("service:\n  port:  8081")
		is.NoError(err, "should create a values file")

		defer os.Remove(values)

		installOpts := options.InstallOptions{
			Name:       "test-nginx-2",
			Chart:      "nginx",
			Repo:       "https://charts.bitnami.com/bitnami",
			ValuesFile: values,
		}
		release, err := hbpm.Install(installOpts)
		defer hbpm.run("uninstall", []string{"test-nginx-2"}, nil)

		is.NoError(err, "should successfully install release", release)
	})

	t.Run("successfully installs portainer chart with name portainer-test", func(t *testing.T) {
		// helm install portainer-test portainer --repo https://portainer.github.io/k8s/
		installOpts := options.InstallOptions{
			Name:  "portainer-test",
			Chart: "portainer",
			Repo:  "https://portainer.github.io/k8s/",
		}
		release, err := hbpm.Install(installOpts)
		defer hbpm.run("uninstall", []string{installOpts.Name}, nil)

		is.NoError(err, "should successfully install release", release)
	})
}

func ensureIntegrationTest(t *testing.T) {
	if _, ok := os.LookupEnv("INTEGRATION_TEST"); !ok {
		t.Skip("skip an integration test")
	}
}
