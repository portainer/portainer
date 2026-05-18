package sources

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"path"
	"strings"

	ce "github.com/portainer/portainer/api/gitops/workflows"
)

// Source represents a unique git repository used as a GitOps source across one or more workflows.
type Source struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Type         string    `json:"type"`
	URL          string    `json:"url"`
	Status       ce.Status `json:"status"`
	Error        string    `json:"error,omitempty"`
	UsedBy       int       `json:"usedBy"`
	Environments int       `json:"environments"`
	LastSync     int64     `json:"lastSync"`
}

type SourceType string

const (
	SourceTypeGit  SourceType = "git"
	SourceTypeHelm SourceType = "helm"
	SourceTypeOCI  SourceType = "oci"
)

func parseSourceType(s string) (string, error) {
	switch SourceType(s) {
	case SourceTypeGit, SourceTypeHelm, SourceTypeOCI:
		return s, nil
	default:
		return "", fmt.Errorf("invalid source type %q: must be git, helm, or oci", s)
	}
}

func sourceID(url string) string {
	h := sha256.Sum256([]byte(url))
	return hex.EncodeToString(h[:8])
}

// repoName extracts the repository name from a URL.
// e.g. "https://github.com/org/app-config.git" → "app-config"
func repoName(rawURL string) string {
	base := path.Base(rawURL)
	return strings.TrimSuffix(base, ".git")
}

func worstCaseStatus(statuses []ce.Status) ce.Status {
	priority := map[ce.Status]int{
		ce.StatusError:   4,
		ce.StatusSyncing: 3,
		ce.StatusPaused:  2,
		ce.StatusHealthy: 1,
		ce.StatusUnknown: 0,
	}
	worst := ce.StatusUnknown
	for _, s := range statuses {
		if priority[s] > priority[worst] {
			worst = s
		}
	}
	return worst
}
