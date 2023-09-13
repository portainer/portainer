package libhelm

import (
	"fmt"
	"net/http"
	"net/url"
	"path"
	"strings"
	"time"

	"github.com/pkg/errors"
)

const invalidChartRepo = "%q is not a valid chart repository or cannot be reached"

func ValidateHelmRepositoryURL(repoUrl string, client *http.Client) error {
	if repoUrl == "" {
		return errors.New("URL is required")
	}

	url, err := url.ParseRequestURI(repoUrl)
	if err != nil {
		return errors.Wrap(err, fmt.Sprintf("invalid helm chart URL: %s", repoUrl))
	}

	if !strings.EqualFold(url.Scheme, "http") && !strings.EqualFold(url.Scheme, "https") {
		return errors.New(fmt.Sprintf("invalid helm chart URL: %s", repoUrl))
	}

	url.Path = path.Join(url.Path, "index.yaml")

	if client == nil {
		client = &http.Client{
			Timeout: time.Second * 10,
		}
	}

	response, err := client.Head(url.String())
	if err != nil {
		return errors.Wrapf(err, invalidChartRepo, repoUrl)
	}

	// Success is indicated with 2xx status codes
	statusOK := response.StatusCode >= 200 && response.StatusCode < 300
	if !statusOK {
		return errors.Errorf(invalidChartRepo, repoUrl)
	}

	return nil
}
