package binary

import (
	"github.com/pkg/errors"
	"github.com/portainer/portainer/pkg/libhelm/options"
)

var errRequiredShowOptions = errors.New("chart, repo and output format are required")

// Show runs `helm show <command> <chart> --repo <repo>` with specified show options.
// The show options translate to CLI arguments which are passed in to the helm binary when executing install.
func (hbpm *helmBinaryPackageManager) Show(showOpts options.ShowOptions) ([]byte, error) {
	if showOpts.Chart == "" || showOpts.Repo == "" || showOpts.OutputFormat == "" {
		return nil, errRequiredShowOptions
	}

	args := []string{
		string(showOpts.OutputFormat),
		showOpts.Chart,
		"--repo", showOpts.Repo,
	}

	result, err := hbpm.run("show", args, showOpts.Env)
	if err != nil {
		return nil, errors.Wrap(err, "failed to run helm show on specified args")
	}

	return result, nil
}
