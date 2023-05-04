package binary

import (
	"github.com/pkg/errors"
	"github.com/portainer/portainer/pkg/libhelm/options"
)

var errRequiredUninstallOptions = errors.New("release name is required")

// Uninstall runs `helm uninstall <name> --namespace <namespace>` with specified uninstall options.
// The uninstall options translate to CLI arguments which are passed in to the helm binary when executing uninstall.
func (hbpm *helmBinaryPackageManager) Uninstall(uninstallOpts options.UninstallOptions) error {
	if uninstallOpts.Name == "" {
		return errRequiredUninstallOptions
	}

	args := []string{uninstallOpts.Name}

	if uninstallOpts.Namespace != "" {
		args = append(args, "--namespace", uninstallOpts.Namespace)
	}

	_, err := hbpm.runWithKubeConfig("uninstall", args, uninstallOpts.KubernetesClusterAccess, uninstallOpts.Env)
	if err != nil {
		return errors.Wrap(err, "failed to run helm uninstall on specified args")
	}

	return nil
}
