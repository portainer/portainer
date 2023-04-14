package binary

import (
	"encoding/json"

	"github.com/pkg/errors"
	"github.com/portainer/portainer/pkg/libhelm/options"
	"github.com/portainer/portainer/pkg/libhelm/release"
)

// Install runs `helm install` with specified install options.
// The install options translate to CLI arguments which are passed in to the helm binary when executing install.
func (hbpm *helmBinaryPackageManager) Install(installOpts options.InstallOptions) (*release.Release, error) {
	if installOpts.Name == "" {
		installOpts.Name = "--generate-name"
	}
	args := []string{
		installOpts.Name,
		installOpts.Chart,
		"--repo", installOpts.Repo,
		"--output", "json",
	}
	if installOpts.Namespace != "" {
		args = append(args, "--namespace", installOpts.Namespace)
	}
	if installOpts.ValuesFile != "" {
		args = append(args, "--values", installOpts.ValuesFile)
	}
	if installOpts.Wait {
		args = append(args, "--wait")
	}
	if installOpts.PostRenderer != "" {
		args = append(args, "--post-renderer", installOpts.PostRenderer)
	}

	result, err := hbpm.runWithKubeConfig("install", args, installOpts.KubernetesClusterAccess, installOpts.Env)
	if err != nil {
		return nil, errors.Wrap(err, "failed to run helm install on specified args")
	}

	response := &release.Release{}
	err = json.Unmarshal(result, &response)
	if err != nil {
		return nil, errors.Wrap(err, "failed to unmarshal helm install response to Release struct")
	}

	return response, nil
}
