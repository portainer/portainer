package workflows

import (
	"context"
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestComputeGitPhases(t *testing.T) {
	t.Parallel()

	okRefs := func(_ context.Context) ([]string, error) {
		return []string{"refs/heads/main"}, nil
	}
	okFiles := func(_ context.Context, _ []string) ([]string, error) {
		return []string{"docker-compose.yml"}, nil
	}
	errRefs := func(_ context.Context) ([]string, error) {
		return nil, errors.New("connection refused")
	}
	errFiles := func(_ context.Context, _ []string) ([]string, error) {
		return nil, errors.New("connection refused")
	}

	cases := []struct {
		name             string
		referenceName    string
		configFilePath   string
		listRefs         ListRefsFunc
		listFiles        ListFilesFunc
		expectedSource   Status
		expectedArtifact Status
	}{
		{
			name:             "listRefs errors → source error, artifact unknown",
			referenceName:    "refs/heads/main",
			configFilePath:   "docker-compose.yml",
			listRefs:         errRefs,
			listFiles:        okFiles,
			expectedSource:   StatusError,
			expectedArtifact: StatusUnknown,
		},
		{
			name:           "ref not in list → source error, artifact unknown",
			referenceName:  "refs/heads/missing",
			configFilePath: "docker-compose.yml",
			listRefs: func(_ context.Context) ([]string, error) {
				return []string{"refs/heads/main"}, nil
			},
			listFiles:        okFiles,
			expectedSource:   StatusError,
			expectedArtifact: StatusUnknown,
		},
		{
			name:             "empty configFilePath → artifact error",
			referenceName:    "refs/heads/main",
			configFilePath:   "",
			listRefs:         okRefs,
			listFiles:        okFiles,
			expectedSource:   StatusHealthy,
			expectedArtifact: StatusError,
		},
		{
			name:             "listFiles errors → artifact error",
			referenceName:    "refs/heads/main",
			configFilePath:   "docker-compose.yml",
			listRefs:         okRefs,
			listFiles:        errFiles,
			expectedSource:   StatusHealthy,
			expectedArtifact: StatusError,
		},
		{
			name:           "file not in list → artifact error",
			referenceName:  "refs/heads/main",
			configFilePath: "docker-compose.yml",
			listRefs:       okRefs,
			listFiles: func(_ context.Context, _ []string) ([]string, error) {
				return []string{"other.yml"}, nil
			},
			expectedSource:   StatusHealthy,
			expectedArtifact: StatusError,
		},
		{
			name:             "both healthy",
			referenceName:    "refs/heads/main",
			configFilePath:   "docker-compose.yml",
			listRefs:         okRefs,
			listFiles:        okFiles,
			expectedSource:   StatusHealthy,
			expectedArtifact: StatusHealthy,
		},
		{
			name:             "empty referenceName → source healthy (default HEAD)",
			referenceName:    "",
			configFilePath:   "docker-compose.yml",
			listRefs:         okRefs,
			listFiles:        okFiles,
			expectedSource:   StatusHealthy,
			expectedArtifact: StatusHealthy,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			source, artifact := ComputeGitPhases(t.Context(), tc.referenceName, tc.configFilePath, tc.listRefs, tc.listFiles)
			assert.Equal(t, tc.expectedSource, source.Status)
			assert.Equal(t, tc.expectedArtifact, artifact.Status)
		})
	}
}

func TestComputeArtifactPhase_ExtensionFilter(t *testing.T) {
	t.Parallel()

	cases := []struct {
		configPath string
		wantExts   []string
	}{
		{"docker-compose.yml", []string{"yml"}},
		{"stack.yaml", []string{"yaml"}},
		{"subdir/compose.yml", []string{"yml"}},
		{"Makefile", nil},
		{"archive.tar.gz", []string{"gz"}},
	}

	for _, tc := range cases {
		t.Run(tc.configPath, func(t *testing.T) {
			t.Parallel()
			var capturedExts []string
			ComputeGitPhases(
				t.Context(),
				"",
				tc.configPath,
				func(_ context.Context) ([]string, error) { return nil, nil },
				func(_ context.Context, exts []string) ([]string, error) {
					capturedExts = exts
					return []string{tc.configPath}, nil
				},
			)
			assert.Equal(t, tc.wantExts, capturedExts)
		})
	}
}

func TestComputeGitPhases_ArtifactNotCalledOnSourceError(t *testing.T) {
	t.Parallel()

	listFilesCalled := false
	listRefs := func(_ context.Context) ([]string, error) {
		return nil, errors.New("repo unreachable")
	}
	listFiles := func(_ context.Context, _ []string) ([]string, error) {
		listFilesCalled = true
		return nil, nil
	}

	ComputeGitPhases(t.Context(), "refs/heads/main", "docker-compose.yml", listRefs, listFiles)

	assert.False(t, listFilesCalled, "listFiles must not be called when source fails")
}
