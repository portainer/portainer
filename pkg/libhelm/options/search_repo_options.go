package options

import (
	"net/http"

	portainer "github.com/portainer/portainer/api"
)

type SearchRepoOptions struct {
	Repo     string       `example:"https://charts.gitlab.io/"`
	Client   *http.Client `example:"&http.Client{Timeout: time.Second * 10}"`
	Chart    string       `example:"my-chart"`
	UseCache bool         `example:"false"`
	Registry *portainer.Registry
}
