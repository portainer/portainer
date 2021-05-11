package git

import (
	"context"
	"fmt"
	"github.com/pkg/errors"
	"github.com/portainer/portainer/api/archive"
	"io"
	"io/ioutil"
	"net/http"
	"net/url"
	"os"
	"strings"
)

func isAzureUrl(s string) bool {
	return strings.Contains(s, "dev.azure.com")
}

type azureOptions struct {
	organisation, project, repository string
}

type azureDownloader struct {
	client *http.Client
}

func (a *azureDownloader) download(ctx context.Context, destination string, options cloneOptions) error {
	zipFilepath, err := a.downloadZipFromAzureDevOps(ctx, options)
	if err != nil {
		return errors.Wrap(err, "failed to download a zip file from Azure DevOps")
	}
	defer os.Remove(zipFilepath)

	err = archive.UnzipFile(zipFilepath, destination)
	if err != nil {
		return errors.Wrap(err,"failed to unzip file")
	}

	return nil
}

func (a *azureDownloader) downloadZipFromAzureDevOps(ctx context.Context, options cloneOptions) (string, error) {
	config, err := parseUrl(options.repositoryUrl)
	if err != nil {
		return "", errors.WithMessage(err, "failed to parse url")
	}
	downloadUrl, err := buildDownloadUrl(config, options.referenceName)
	if err != nil {
		return "", errors.WithMessage(err, "failed to build download url")
	}
	zipFile, err := ioutil.TempFile("", "azure-git-repo-*.zip")
	if err != nil {
		return "", errors.WithMessage(err, "failed to create temp file")
	}
	defer zipFile.Close()

	req, err := http.NewRequestWithContext(ctx, "GET", downloadUrl, nil)
	req.SetBasicAuth(options.username, options.password)
	if err != nil {
		return "", errors.WithMessage(err, "failed to create new context")
	}

	res, err := a.client.Do(req)
	if err != nil {
		return "", errors.WithMessage(err, "failed to make an HTTP request")
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to download zip with a status \"%v\"", res.Status)
	}

	_, err = io.Copy(zipFile, res.Body)
	if err != nil {
		return "", errors.WithMessage(err, "failed to save HTTP response to a file")
	}
	return zipFile.Name(), nil
}

func parseUrl(rawUrl string) (*azureOptions, error) {
	if strings.HasPrefix(rawUrl, "https://") {
		return parseHttpUrl(rawUrl)
	}
	if strings.HasPrefix(rawUrl, "git@ssh") {
		return parseSshUrl(rawUrl)
	}
	if strings.HasPrefix(rawUrl, "ssh://") {
		r := []rune(rawUrl)
		return parseSshUrl(string(r[6:])) // remove the prefix
	}

	return nil, errors.Errorf("supported url schemes are https and ssh; recevied URL %s rawUrl", rawUrl)
}

var expectedSshUrl = "git@ssh.dev.azure.com:v3/Organisation/Project/Repository"

func parseSshUrl(rawUrl string) (*azureOptions, error) {
	path := strings.Split(rawUrl, "/")

	unexpectedUrlErr := errors.Errorf("want url %s, got %s", expectedSshUrl, rawUrl)
	if len(path) != 4 {
		return nil, unexpectedUrlErr
	}
	return &azureOptions{
		organisation: path[1],
		project:      path[2],
		repository:   path[3],
	}, nil
}

var expectedHttpUrl = "https://Organisation@dev.azure.com/Organisation/Project/_git/Repository"

func parseHttpUrl(rawUrl string) (*azureOptions, error) {
	u, err := url.Parse(rawUrl)
	if err != nil {
		return nil, errors.Wrap(err, "failed to parse HTTP url")
	}

	path := strings.Split(u.Path, "/")

	unexpectedUrlErr := errors.Errorf("want url %s, got %s", expectedHttpUrl, u)
	if len(path) != 5 {
		return nil, unexpectedUrlErr
	}
	return &azureOptions{
		organisation: path[1],
		project:      path[2],
		repository:   path[4],
	}, nil
}

func buildDownloadUrl(config *azureOptions, referenceName string) (string, error) {
	rawUrl := fmt.Sprintf("https://dev.azure.com/%s/%s/_apis/git/repositories/%s/items",
		url.PathEscape(config.organisation),
		url.PathEscape(config.project),
		url.PathEscape(config.repository))
	u, err := url.Parse(rawUrl)

	if err != nil {
		return "", errors.Wrapf(err, "failed to parse download url path %s", rawUrl)
	}
	q := u.Query()
	// scopePath=/&download=true&versionDescriptor.version=feture&$format=zip&recursionLevel=full&api-version=6.0
	q.Set("scopePath", "/")
	q.Set("download", "true")
	q.Set("versionDescriptor.version", referenceName)
	q.Set("$format", "zip")
	q.Set("recursionLevel", "full")
	q.Set("api-version", "6.0")
	u.RawQuery = q.Encode()

	return u.String(), nil
}
