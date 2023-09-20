package binary

// Package common implements common functionality for the helm.
// The functionality does not rely on the implementation of `HelmPackageManager`

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"path"
	"time"

	"github.com/pkg/errors"
	"github.com/portainer/portainer/pkg/libhelm/options"
	"gopkg.in/yaml.v3"
)

var errRequiredSearchOptions = errors.New("repo is required")

type File struct {
	APIVersion string             `yaml:"apiVersion" json:"apiVersion"`
	Entries    map[string][]Entry `yaml:"entries" json:"entries"`
	Generated  string             `yaml:"generated" json:"generated"`
}

type Annotations struct {
	Category string `yaml:"category" json:"category"`
}

type Entry struct {
	Annotations *Annotations `yaml:"annotations" json:"annotations,omitempty"`
	Created     string       `yaml:"created" json:"created"`
	Deprecated  bool         `yaml:"deprecated" json:"deprecated"`
	Description string       `yaml:"description" json:"description"`
	Digest      string       `yaml:"digest" json:"digest"`
	Home        string       `yaml:"home" json:"home"`
	Name        string       `yaml:"name" json:"name"`
	Sources     []string     `yaml:"sources" json:"sources"`
	Urls        []string     `yaml:"urls" json:"urls"`
	Version     string       `yaml:"version" json:"version"`
	Icon        string       `yaml:"icon" json:"icon,omitempty"`
}

// SearchRepo downloads the `index.yaml` file for specified repo, parses it and returns JSON to caller.
// The functionality is similar to that of what `helm search repo [chart] --repo <repo>` CLI runs;
// this approach is used instead since the `helm search repo` requires a repo to be added to the global helm cache
func (hbpm *helmBinaryPackageManager) SearchRepo(searchRepoOpts options.SearchRepoOptions) ([]byte, error) {
	if searchRepoOpts.Repo == "" {
		return nil, errRequiredSearchOptions
	}

	client := searchRepoOpts.Client
	if searchRepoOpts.Client == nil {
		// The current index.yaml is ~9MB on bitnami.
		// At a slow @2mbit download = 40s. @100bit = ~1s.
		// I'm seeing 3 - 4s over wifi.
		// Give ample time but timeout for now.  Can be improved in the future
		client = &http.Client{
			Timeout:   60 * time.Second,
			Transport: http.DefaultTransport,
		}
	}

	url, err := url.ParseRequestURI(searchRepoOpts.Repo)
	if err != nil {
		return nil, errors.Wrap(err, fmt.Sprintf("invalid helm chart URL: %s", searchRepoOpts.Repo))
	}

	url.Path = path.Join(url.Path, "index.yaml")
	resp, err := client.Get(url.String())
	if err != nil {
		return nil, errors.Wrap(err, "failed to get index file")
	}
	defer resp.Body.Close()

	var file File
	err = yaml.NewDecoder(resp.Body).Decode(&file)
	if err != nil {
		return nil, errors.Wrap(err, "failed to decode index file")
	}

	result, err := json.Marshal(file)
	if err != nil {
		return nil, errors.Wrap(err, "failed to marshal index file")
	}

	return result, nil
}
