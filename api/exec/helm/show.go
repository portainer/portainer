package helm

import (
	"github.com/pkg/errors"
)

// ShowOutputFormat is the format of the output of `helm show`
type ShowOutputFormat string

const (
	// ShowAll is the format which shows all the information of a chart
	ShowAll ShowOutputFormat = "all"
	// ShowChart is the format which only shows the chart's definition
	ShowChart ShowOutputFormat = "chart"
	// ShowValues is the format which only shows the chart's values
	ShowValues ShowOutputFormat = "values"
	// ShowReadme is the format which only shows the chart's README
	ShowReadme ShowOutputFormat = "readme"
)

// ShowOptions are portainer supported options for `helm install`
type ShowOptions struct {
	OutputFormat ShowOutputFormat
	Chart        string
	Repo         string
}

var errRequiredShowOptions = errors.New("chart, repo and output format are required")

// Show runs `helm show <command> <chart> --repo <repo>` with specified show options.
// The show options translate to CLI arguments which are passed in to the helm binary when executing install.
func (hbpm *helmBinaryPackageManager) Show(showOpts ShowOptions) (string, error) {
	if showOpts.Chart == "" || showOpts.Repo == "" || showOpts.OutputFormat == "" {
		return "", errRequiredShowOptions
	}

	args := []string{
		string(showOpts.OutputFormat),
		showOpts.Chart,
		"--repo", showOpts.Repo,
	}

	result, err := hbpm.run("show", args)
	if err != nil {
		return "", errors.Wrap(err, "failed to run helm show on specified args")
	}

	return result, nil
}
