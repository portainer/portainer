package helm

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/pkg/errors"
	"gopkg.in/yaml.v3"
)

// SearchRepoOptions are portainer supported options for `helm search repo`
type SearchRepoOptions struct {
	Repo string
}

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

// Show runs `helm search repo [chart] --repo <repo>` with specified show options.
// The show options translate to CLI arguments which are passed in to the helm binary when executing install.
func (hbpm *helmBinaryPackageManager) SearchRepo(searchRepoOpts SearchRepoOptions) (string, error) {
	if searchRepoOpts.Repo == "" {
		return "", errRequiredSearchOptions
	}

	// The current index.yaml is ~9MB on bitnami.
	// At a slow @2mbit download = 40s. @100bit = ~1s.
	// I'm seeing 3 - 4s over wifi.
	// Give ample time but timeout for now.  Can be improved in the future
	client := http.Client{
		Timeout: 60 * time.Second,
	}

	resp, err := client.Get(searchRepoOpts.Repo + "/index.yaml")
	if err != nil {
		return "", errors.Wrap(err, "Failed to get index file")
	}

	var file File
	err = yaml.NewDecoder(resp.Body).Decode(&file)
	if err != nil {
		return "", err
	}

	result, err := json.Marshal(file)
	if err != nil {
		return "", err
	}

	return string(result), nil
}
