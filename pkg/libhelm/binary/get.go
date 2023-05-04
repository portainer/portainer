package binary

import (
	"github.com/pkg/errors"
	"github.com/portainer/portainer/pkg/libhelm/options"
)

// Get runs `helm get` with specified get options.
// The get options translate to CLI arguments which are passed in to the helm binary when executing install.
func (hbpm *helmBinaryPackageManager) Get(getOpts options.GetOptions) ([]byte, error) {
	if getOpts.Name == "" || getOpts.ReleaseResource == "" {
		return nil, errors.New("release name and release resource are required")
	}

	args := []string{
		string(getOpts.ReleaseResource),
		getOpts.Name,
	}
	if getOpts.Namespace != "" {
		args = append(args, "--namespace", getOpts.Namespace)
	}

	result, err := hbpm.runWithKubeConfig("get", args, getOpts.KubernetesClusterAccess, getOpts.Env)
	if err != nil {
		return nil, errors.Wrap(err, "failed to run helm get on specified args")
	}

	return result, nil
}
