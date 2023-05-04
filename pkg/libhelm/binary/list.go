package binary

import (
	"encoding/json"

	"github.com/pkg/errors"
	"github.com/portainer/portainer/pkg/libhelm/options"
	"github.com/portainer/portainer/pkg/libhelm/release"
)

// List runs `helm list --output json --filter <filter> --selector <selector> --namespace <namespace>` with specified list options.
// The list options translate to CLI args the helm binary
func (hbpm *helmBinaryPackageManager) List(listOpts options.ListOptions) ([]release.ReleaseElement, error) {
	args := []string{"--output", "json"}

	if listOpts.Filter != "" {
		args = append(args, "--filter", listOpts.Filter)
	}
	if listOpts.Selector != "" {
		args = append(args, "--selector", listOpts.Selector)
	}
	if listOpts.Namespace != "" {
		args = append(args, "--namespace", listOpts.Namespace)
	}

	result, err := hbpm.runWithKubeConfig("list", args, listOpts.KubernetesClusterAccess, listOpts.Env)
	if err != nil {
		return []release.ReleaseElement{}, errors.Wrap(err, "failed to run helm list on specified args")
	}

	response := []release.ReleaseElement{}
	err = json.Unmarshal(result, &response)
	if err != nil {
		return []release.ReleaseElement{}, errors.Wrap(err, "failed to unmarshal helm list response to releastElement list")
	}

	return response, nil
}
