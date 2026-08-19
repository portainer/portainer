package libhelm

import (
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/portainer/portainer/pkg/libhelm/sdk"
	"github.com/portainer/portainer/pkg/libhttp/ssrf"
	"helm.sh/helm/v4/pkg/cli"
	"helm.sh/helm/v4/pkg/getter"
	repo "helm.sh/helm/v4/pkg/repo/v1"
)

func ValidateHelmRepositoryURL(repoUrl string, _ *http.Client) error {
	if repoUrl == "" {
		return errors.New("URL is required")
	}

	if strings.HasPrefix(repoUrl, "oci://") {
		return errors.New("OCI repositories are not supported yet")
	}

	url, err := url.ParseRequestURI(repoUrl)
	if err != nil {
		return fmt.Errorf("invalid helm repository URL '%s': %w", repoUrl, err)
	}

	if !strings.EqualFold(url.Scheme, "http") && !strings.EqualFold(url.Scheme, "https") {
		return fmt.Errorf("invalid helm repository URL '%s'", repoUrl)
	}

	// Mirror Helm CLI behavior: download and parse index.yaml using getters
	settings := cli.New()

	// Use a deterministic repo name shared with the SDK helper so cache aligns
	repoName, err := sdk.GetRepoNameFromURL(repoUrl)
	if err != nil {
		return fmt.Errorf("failed to derive repo name: %w", err)
	}

	ssrfTransport := ssrf.NewTransport(nil)

	r, err := repo.NewChartRepository(
		&repo.Entry{
			Name: repoName,
			URL:  repoUrl,
		},
		getter.All(settings, getter.WithTransport(ssrfTransport)),
	)
	if err != nil {
		return fmt.Errorf("%s is not a valid chart repository or cannot be reached: %w", repoUrl, err)
	}

	indexPath, err := r.DownloadIndexFile()
	if err != nil {
		return fmt.Errorf("%s is not a valid chart repository or cannot be reached", repoUrl)
	}

	// Best-effort: load and seed in-memory cache for future SearchRepo calls
	if indexFile, err := repo.LoadIndexFile(indexPath); err == nil {
		sdk.UpdateCache(repoUrl, indexFile)
	}

	return nil
}
