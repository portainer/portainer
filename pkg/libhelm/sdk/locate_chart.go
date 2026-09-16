package sdk

import (
	"fmt"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/crypto"
	"github.com/portainer/portainer/pkg/libhttp/ssrf"
	"helm.sh/helm/v4/pkg/action"
	"helm.sh/helm/v4/pkg/cli"
	"helm.sh/helm/v4/pkg/downloader"
	"helm.sh/helm/v4/pkg/getter"
	"helm.sh/helm/v4/pkg/registry"
	repo "helm.sh/helm/v4/pkg/repo/v1"
)

func locateChart(opts *action.ChartPathOptions, registryClient *registry.Client, name string, settings *cli.EnvSettings) (string, error) {
	if registry.IsOCI(name) && registryClient == nil {
		return "", fmt.Errorf("unable to lookup chart %q, missing registry client", name)
	}

	name = strings.TrimSpace(name)
	version := strings.TrimSpace(opts.Version)

	if opts.RepoURL == "" {
		if _, err := os.Stat(name); err == nil {
			abs, err := filepath.Abs(name)
			if err != nil {
				return abs, err
			}

			if opts.Verify { //nolint:forbidigo
				if _, err := downloader.VerifyChart(abs, abs+".prov", opts.Keyring); err != nil { //nolint:forbidigo
					return "", err
				}
			}

			return abs, nil
		}

		if filepath.IsAbs(name) || strings.HasPrefix(name, ".") {
			return name, fmt.Errorf("path %q not found", name)
		}
	}

	transport, err := chartTransport(opts)
	if err != nil {
		return "", err
	}

	getters := getter.All(settings, getter.WithTransport(transport))

	dl := downloader.ChartDownloader{
		Out:     os.Stdout,
		Keyring: opts.Keyring,
		Getters: getters,
		Options: []getter.Option{
			getter.WithPassCredentialsAll(opts.PassCredentialsAll),
			getter.WithPlainHTTP(opts.PlainHTTP),
			getter.WithBasicAuth(opts.Username, opts.Password),
		},
		RepositoryConfig: settings.RepositoryConfig,
		RepositoryCache:  settings.RepositoryCache,
		ContentCache:     settings.ContentCache,
		RegistryClient:   registryClient,
	}

	if registry.IsOCI(name) {
		dl.Options = append(dl.Options, getter.WithRegistryClient(registryClient))
	}

	if opts.Verify { //nolint:forbidigo
		dl.Verify = downloader.VerifyAlways //nolint:forbidigo
	}

	if opts.RepoURL != "" {
		chartURL, err := repo.FindChartInRepoURL(
			opts.RepoURL,
			name,
			getters,
			repo.WithChartVersion(version),
			repo.WithUsernamePassword(opts.Username, opts.Password),
			repo.WithPassCredentialsAll(opts.PassCredentialsAll),
		)
		if err != nil {
			return "", err
		}
		name = chartURL

		// Only pass the user/pass on when the user has said to or when the
		// location of the chart repo and the chart are the same domain.
		u1, err := url.Parse(opts.RepoURL)
		if err != nil {
			return "", err
		}

		u2, err := url.Parse(chartURL)
		if err != nil {
			return "", err
		}

		if opts.PassCredentialsAll || sameHost(u1, u2) {
			dl.Options = append(dl.Options, getter.WithBasicAuth(opts.Username, opts.Password))
		} else {
			dl.Options = append(dl.Options, getter.WithBasicAuth("", ""))
		}
	} else {
		dl.Options = append(dl.Options, getter.WithBasicAuth(opts.Username, opts.Password))
	}

	if err := os.MkdirAll(settings.RepositoryCache, 0o755); err != nil {
		return "", err
	}

	filename, _, err := dl.DownloadToCache(name, version)
	if err != nil {
		return "", err
	}

	return filepath.Abs(filename)
}

func chartTransport(opts *action.ChartPathOptions) (*http.Transport, error) {
	if opts.CertFile == "" && opts.KeyFile == "" && opts.CaFile == "" && !opts.InsecureSkipTLSVerify {
		return ssrf.NewTransport(nil), nil
	}

	tlsConfig, err := crypto.CreateTLSConfigurationFromDisk(portainer.TLSConfiguration{
		TLS:           true,
		TLSCertPath:   opts.CertFile,
		TLSKeyPath:    opts.KeyFile,
		TLSCACertPath: opts.CaFile,
		TLSSkipVerify: opts.InsecureSkipTLSVerify,
	})
	if err != nil {
		return nil, err
	}

	return ssrf.NewTransport(tlsConfig), nil
}

func sameHost(u1, u2 *url.URL) bool {
	return u1.Scheme == u2.Scheme && u1.Hostname() == u2.Hostname() && portOrDefault(u1) == portOrDefault(u2)
}

func portOrDefault(u *url.URL) string {
	if p := u.Port(); p != "" {
		return p
	}

	switch u.Scheme {
	case "http":
		return "80"
	case "https":
		return "443"
	default:
		return ""
	}
}
