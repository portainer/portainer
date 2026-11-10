package sdk

import (
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"runtime"
	"testing"

	"github.com/portainer/portainer/api/filesystem"
	"github.com/stretchr/testify/require"
	"helm.sh/helm/v4/pkg/action"
)

func TestLocateChart_PinnedHelmVersion(t *testing.T) {
	t.Parallel()

	_, thisFile, _, ok := runtime.Caller(0)
	require.True(t, ok)

	dir := filepath.Dir(thisFile)
	for {
		modPath := filesystem.JoinPaths(dir, "go.mod")
		if _, err := os.Stat(modPath); err == nil {
			checkPinnedHelmVersion(t, modPath)
			return
		}

		parent := filepath.Dir(dir)
		require.NotEqual(t, dir, parent, "reached filesystem root without finding go.mod")
		dir = parent
	}
}

func checkPinnedHelmVersion(t *testing.T, modPath string) {
	t.Helper()

	data, err := os.ReadFile(modPath)
	require.NoError(t, err)

	re := regexp.MustCompile(`(?m)^\thelm\.sh/helm/v4\s+(\S+)`)
	matches := re.FindSubmatch(data)
	require.NotNil(t, matches, "expected to find helm.sh/helm/v4 in %s", modPath)

	require.Equal(t, "v4.1.4", string(matches[1]),
		"locateChart in locate_chart.go was reimplemented from action.ChartPathOptions.LocateChart "+
			"at this exact helm.sh/helm/v4 version; before bumping the dependency, diff LocateChart "+
			"against locate_chart.go and update this pinned version once verified")
}

func TestChartTransport(t *testing.T) {
	t.Parallel()

	f := func(opts *action.ChartPathOptions, wantErrSubstr string) {
		t.Helper()

		transport, err := chartTransport(opts)

		if wantErrSubstr != "" {
			require.ErrorContains(t, err, wantErrSubstr)
			return
		}

		require.NoError(t, err)
		require.NotNil(t, transport)
	}

	// no TLS options set falls back to the default SSRF transport
	f(&action.ChartPathOptions{}, "")

	// InsecureSkipTLSVerify alone still builds a custom TLS transport
	f(&action.ChartPathOptions{InsecureSkipTLSVerify: true}, "")

	// an unreadable cert/key pair surfaces the underlying disk error
	f(&action.ChartPathOptions{CertFile: "/nonexistent/cert.pem", KeyFile: "/nonexistent/key.pem"}, "no such file or directory")
}

func TestPortOrDefault(t *testing.T) {
	t.Parallel()

	f := func(rawURL, want string) {
		t.Helper()

		u, err := url.Parse(rawURL)
		require.NoError(t, err)

		require.Equal(t, want, portOrDefault(u))
	}

	// an explicit port is returned as-is
	f("http://example.com:8080", "8080")

	// http with no port defaults to 80
	f("http://example.com", "80")

	// https with no port defaults to 443
	f("https://example.com", "443")

	// an unknown scheme with no port has no default
	f("ftp://example.com", "")
}

func TestLocateChart_OCIWithoutRegistryClient(t *testing.T) {
	t.Parallel()

	hspm := newIsolatedHelmSDKPackageManager(t)

	_, err := locateChart(&action.ChartPathOptions{}, nil, "oci://example.com/chart", hspm.settings)

	require.ErrorContains(t, err, "missing registry client")
}

func TestLocateChart_LocalPathNotFound(t *testing.T) {
	t.Parallel()

	hspm := newIsolatedHelmSDKPackageManager(t)

	_, err := locateChart(&action.ChartPathOptions{}, nil, "/nonexistent/chart/path", hspm.settings)

	require.ErrorContains(t, err, "not found")
}

func TestLocateChart_DefaultRepoLookup(t *testing.T) {
	t.Parallel()

	hspm := newIsolatedHelmSDKPackageManager(t)

	_, err := locateChart(&action.ChartPathOptions{}, nil, "dep-chart", hspm.settings)

	require.Error(t, err)
}
