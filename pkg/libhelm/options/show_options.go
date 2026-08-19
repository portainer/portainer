package options

import portainer "github.com/portainer/portainer/api"

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
	Version      string
	Env          []string
	Registry     *portainer.Registry // Registry credentials for authentication
}
