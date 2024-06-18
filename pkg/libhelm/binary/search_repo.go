package binary

// Package common implements common functionality for the helm.
// The functionality does not rely on the implementation of `HelmPackageManager`

import (
	"fmt"
	"net/http"
	"net/url"
	"path"
	"time"

	"github.com/portainer/portainer/pkg/libhelm/options"

	"github.com/pkg/errors"
	"github.com/segmentio/encoding/json"
	"gopkg.in/yaml.v3"
)

var errRequiredSearchOptions = errors.New("repo is required")
var errInvalidRepoURL = errors.New("the request failed since either the Helm repository was not found or the index.yaml is not valid")

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

	if client == nil {
		// The current index.yaml is ~9MB on bitnami.
		// At a slow @2mbit download = 40s. @100bit = ~1s.
		// I'm seeing 3 - 4s over wifi.
		// Give ample time but timeout for now.  Can be improved in the future
		client = &http.Client{
			Timeout:   300 * time.Second,
			Transport: http.DefaultTransport,
		}
	}

	// Allow redirect behavior to be overridden if specified.
	if client.CheckRedirect == nil {
		client.CheckRedirect = defaultCheckRedirect
	}

	url, err := url.ParseRequestURI(searchRepoOpts.Repo)
	if err != nil {
		return nil, errors.Wrap(err, fmt.Sprintf("invalid helm chart URL: %s", searchRepoOpts.Repo))
	}

	url.Path = path.Join(url.Path, "index.yaml")
	resp, err := client.Get(url.String())
	if err != nil {
		return nil, errInvalidRepoURL
	}
	defer resp.Body.Close()

	var file File
	err = yaml.NewDecoder(resp.Body).Decode(&file)
	if err != nil {
		return nil, errInvalidRepoURL
	}

	// Validate index.yaml
	if file.APIVersion == "" || file.Entries == nil {
		return nil, errInvalidRepoURL
	}

	result, err := json.Marshal(file)
	if err != nil {
		return nil, errInvalidRepoURL
	}

	return result, nil
}

// defaultCheckRedirect is a default CheckRedirect for helm
// We don't allow redirects to URLs not ending in index.yaml
// After that we follow the go http client behavior which is to stop
// after a maximum of 10 redirects
func defaultCheckRedirect(req *http.Request, via []*http.Request) error {
	// The request url must end in index.yaml
	if path.Base(req.URL.Path) != "index.yaml" {
		return errors.New("the request URL must end in index.yaml")
	}

	// default behavior below
	if len(via) >= 10 {
		return errors.New("stopped after 10 redirects")
	}
	return nil
}
