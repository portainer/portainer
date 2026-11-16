package sdk

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/portainer/portainer/api/filesystem"

	"github.com/stretchr/testify/require"
)

func TestValidateLocalDependencies(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name    string
		files   map[string]string
		wantErr error
	}{
		{
			name: "no dependencies",
			files: map[string]string{
				"charts/app/Chart.yaml": "apiVersion: v2\nname: app\n",
			},
		},
		{
			name: "no chart file",
		},
		{
			name: "invalid chart file",
			files: map[string]string{
				"charts/app/Chart.yaml": "dependencies: [",
			},
		},
		{
			name: "remote and absolute dependencies are allowed",
			files: map[string]string{
				"charts/app/Chart.yaml": `dependencies:
  - name: redis
    repository: https://charts.example.com
  - name: library
    repository: file:///opt/charts/library
`,
			},
		},
		{
			name: "sibling dependency inside the repository is allowed",
			files: map[string]string{
				"charts/app/Chart.yaml":    "dependencies:\n  - repository: file://../common\n",
				"charts/common/Chart.yaml": "apiVersion: v2\nname: common\n",
			},
		},
		{
			name: "folder named ..charts inside the repository is allowed",
			files: map[string]string{
				"charts/app/Chart.yaml": "dependencies:\n  - repository: file://../../..charts\n",
				"..charts/Chart.yaml":   "apiVersion: v2\nname: dotted\n",
			},
		},
		{
			name: "stops at a dependency cycle",
			files: map[string]string{
				"charts/app/Chart.yaml":    "dependencies:\n  - repository: file://../common\n",
				"charts/common/Chart.yaml": "dependencies:\n  - repository: file://../app\n",
			},
		},
		{
			name: "dependency outside the repository is rejected",
			files: map[string]string{
				"charts/app/Chart.yaml": "dependencies:\n  - repository: file://../../../xxx\n",
			},
			wantErr: ErrLocalDependencyOutsideRoot,
		},
		{
			name: "dependency outside the repository in requirements.yaml is rejected",
			files: map[string]string{
				"charts/app/Chart.yaml":        "apiVersion: v1\nname: app\n",
				"charts/app/requirements.yaml": "dependencies:\n  - repository: file://../../../xxx\n",
			},
			wantErr: ErrLocalDependencyOutsideRoot,
		},
		{
			name: "dependency outside the repository in a nested dependency is rejected",
			files: map[string]string{
				"charts/app/Chart.yaml":    "dependencies:\n  - repository: file://../common\n",
				"charts/common/Chart.yaml": "dependencies:\n  - repository: file://../../../xxx\n",
			},
			wantErr: ErrLocalDependencyOutsideRoot,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			rootDir := filesystem.JoinPaths(t.TempDir(), "repo")
			require.NoError(t, os.MkdirAll(filesystem.JoinPaths(rootDir, "charts", "app"), 0o755))
			for name, content := range tc.files {
				path := filesystem.JoinPaths(rootDir, name)
				require.NoError(t, os.MkdirAll(filepath.Dir(path), 0o755))
				require.NoError(t, os.WriteFile(path, []byte(content), 0o644))
			}

			err := ValidateLocalDependencies(rootDir, filesystem.JoinPaths(rootDir, "charts", "app"))
			if tc.wantErr != nil {
				require.ErrorIs(t, err, tc.wantErr)
				return
			}

			require.NoError(t, err)
		})
	}
}

func TestParseLocalDependencyPaths(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name    string
		content string
		want    []string
	}{
		{
			name:    "relative file:// dependency",
			content: "dependencies:\n  - repository: file://../common\n",
			want:    []string{"../common"},
		},
		{
			name:    "remote and absolute dependencies are left out",
			content: "dependencies:\n  - repository: https://charts.example.com\n  - repository: file:///opt/charts/library\n",
		},
		{
			name:    "capitalised keys are matched, as in Helm",
			content: "Dependencies:\n  - Repository: file://../common\n",
			want:    []string{"../common"},
		},
		{
			name:    "duplicate repository key keeps the last value, as in Helm",
			content: "dependencies:\n  - repository: file://../first\n    repository: file://../last\n",
			want:    []string{"../last"},
		},
		{
			name:    "duplicate dependencies key keeps the last value, as in Helm",
			content: "dependencies:\n  - repository: file://../first\ndependencies:\n  - repository: file://../last\n",
			want:    []string{"../last"},
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			paths, err := ParseLocalDependencyPaths([]byte(tc.content))

			require.NoError(t, err)
			require.Equal(t, tc.want, paths)
		})
	}
}
