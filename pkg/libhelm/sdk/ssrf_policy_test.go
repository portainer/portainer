package sdk

import (
	"path/filepath"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/pkg/libhttp/ssrf"
	"github.com/stretchr/testify/require"
	"helm.sh/helm/v4/pkg/action"
)

type staticAllowListService struct {
	parsed portainer.ParsedAllowList
}

func (s *staticAllowListService) ReadParsed(portainer.AllowListKey) (*portainer.ParsedAllowList, error) {
	return &s.parsed, nil
}

func newStaticAllowListService(mode portainer.SSRFMode, entries []string) *staticAllowListService {
	parsed := ssrf.ParseAllowedHosts(entries)
	parsed.Mode = mode

	return &staticAllowListService{parsed: parsed}
}

func TestLocateChart_SSRFPolicy(t *testing.T) {
	t.Cleanup(func() {
		require.NoError(t, ssrf.Configure(newStaticAllowListService(portainer.SSRFModeOff, nil)))
	})

	tgzPath := saveMinimalDepChart(t, "dep-chart", "0.1.0")
	server := newHelmHTTPRepoServer(t, tgzPath)

	f := func(mode portainer.SSRFMode, allowedHosts []string, wantErrSubstr string) {
		t.Helper()

		require.NoError(t, ssrf.Configure(newStaticAllowListService(mode, allowedHosts)))

		hspm := newIsolatedHelmSDKPackageManager(t)

		_, err := locateChart(&action.ChartPathOptions{RepoURL: server.URL}, nil, "dep-chart", hspm.settings)

		if wantErrSubstr == "" {
			require.NoError(t, err)
			return
		}

		require.ErrorContains(t, err, wantErrSubstr)
	}

	// enforce mode with an empty allowlist blocks the loopback repo host
	f(portainer.SSRFModeEnforce, nil, "ssrf")

	// enforce mode with the repo host allow-listed lets the same download through
	f(portainer.SSRFModeEnforce, []string{"127.0.0.1"}, "")
}

func TestDependencyUpdate_SSRFPolicy(t *testing.T) {
	t.Cleanup(func() {
		require.NoError(t, ssrf.Configure(newStaticAllowListService(portainer.SSRFModeOff, nil)))
	})

	depTgzPath := saveMinimalDepChart(t, "dep-chart", "0.1.0")
	depTgzName := filepath.Base(depTgzPath)
	server, requests := newHelmHTTPRepoServerWithRequestCounter(t, depTgzPath)

	f := func(mode portainer.SSRFMode, allowedHosts []string, wantDownloaded bool) {
		t.Helper()

		require.NoError(t, ssrf.Configure(newStaticAllowListService(mode, allowedHosts)))

		parentDir := writeParentChart(t, "parent-chart", "dep-chart", "0.1.0", server.URL)
		hspm := newIsolatedHelmSDKPackageManager(t)
		requests.Store(0)

		_, err := hspm.loadAndValidateChartWithPathOptions(
			new(action.Configuration),
			&action.ChartPathOptions{},
			parentDir, "", "", true, "test",
		)

		tgzPath := filesystem.JoinPaths(parentDir, "charts", depTgzName)
		if wantDownloaded {
			require.NoError(t, err)
			require.FileExists(t, tgzPath)
			return
		}

		require.Error(t, err)
		require.NoFileExists(t, tgzPath)

		// The SSRF dialer must reject the connection before any request reaches the repo
		// server, otherwise this "blocked" case would also pass for an unrelated failure.
		require.Zero(t, requests.Load(), "blocked download should never reach the repo server")
	}

	// enforce mode with an empty allowlist blocks the dependency's loopback host
	f(portainer.SSRFModeEnforce, nil, false)

	// enforce mode with the dependency's host allow-listed lets the update through
	f(portainer.SSRFModeEnforce, []string{"127.0.0.1"}, true)
}
