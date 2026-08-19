package libkompose

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_getDefaultConvertOptions(t *testing.T) {
	t.Parallel()
	tests := []struct {
		name        string
		opts        *ConvertOptions
		wantErr     bool
		errContains string
		validate    func(t *testing.T, opts *ConvertOptions)
	}{
		{
			name: "nil options uses all defaults",
			opts: nil,
			validate: func(t *testing.T, opts *ConvertOptions) {
				assert.Equal(t, "kubernetes", opts.Provider)
				assert.Equal(t, 1, opts.Replicas)
				assert.Equal(t, "persistentVolumeClaim", opts.Volumes)
				assert.Equal(t, 2, opts.YAMLIndent)
			},
		},
		{
			name: "empty options uses all defaults",
			opts: &ConvertOptions{},
			validate: func(t *testing.T, opts *ConvertOptions) {
				assert.Equal(t, "kubernetes", opts.Provider)
				assert.Equal(t, 1, opts.Replicas)
				assert.Equal(t, "persistentVolumeClaim", opts.Volumes)
				assert.Equal(t, 2, opts.YAMLIndent)
			},
		},
		{
			name: "valid provider openshift",
			opts: &ConvertOptions{Provider: "openshift"},
			validate: func(t *testing.T, opts *ConvertOptions) {
				assert.Equal(t, "openshift", opts.Provider)
			},
		},
		{
			name:        "invalid provider",
			opts:        &ConvertOptions{Provider: "docker"},
			wantErr:     true,
			errContains: "invalid provider",
		},
		{
			name: "valid positive replicas",
			opts: &ConvertOptions{Replicas: 3},
			validate: func(t *testing.T, opts *ConvertOptions) {
				assert.Equal(t, 3, opts.Replicas)
			},
		},
		{
			name:        "negative replicas",
			opts:        &ConvertOptions{Replicas: -1},
			wantErr:     true,
			errContains: "invalid replicas",
		},
		{
			name: "valid volume type emptyDir",
			opts: &ConvertOptions{Volumes: "emptyDir"},
			validate: func(t *testing.T, opts *ConvertOptions) {
				assert.Equal(t, "emptyDir", opts.Volumes)
			},
		},
		{
			name: "valid volume type hostPath",
			opts: &ConvertOptions{Volumes: "hostPath"},
			validate: func(t *testing.T, opts *ConvertOptions) {
				assert.Equal(t, "hostPath", opts.Volumes)
			},
		},
		{
			name: "valid volume type configMap",
			opts: &ConvertOptions{Volumes: "configMap"},
			validate: func(t *testing.T, opts *ConvertOptions) {
				assert.Equal(t, "configMap", opts.Volumes)
			},
		},
		{
			name:        "invalid volume type",
			opts:        &ConvertOptions{Volumes: "nfs"},
			wantErr:     true,
			errContains: "invalid volumes",
		},
		{
			name:        "negative yaml indent",
			opts:        &ConvertOptions{YAMLIndent: -1},
			wantErr:     true,
			errContains: "invalid yamlIndent",
		},
		{
			name: "valid controller deployment",
			opts: &ConvertOptions{Controller: "deployment"},
			validate: func(t *testing.T, opts *ConvertOptions) {
				assert.Equal(t, "deployment", opts.Controller)
			},
		},
		{
			name: "valid controller daemonSet",
			opts: &ConvertOptions{Controller: "daemonSet"},
			validate: func(t *testing.T, opts *ConvertOptions) {
				assert.Equal(t, "daemonSet", opts.Controller)
			},
		},
		{
			name:        "invalid controller",
			opts:        &ConvertOptions{Controller: "statefulSet"},
			wantErr:     true,
			errContains: "invalid controller",
		},
		{
			name:        "ToStdout with CreateChart conflicts",
			opts:        &ConvertOptions{ToStdout: true, CreateChart: true},
			wantErr:     true,
			errContains: "cannot use ToStdout with CreateChart",
		},
		{
			name:        "ToStdout with OutFile conflicts",
			opts:        &ConvertOptions{ToStdout: true, OutFile: "/tmp/out"},
			wantErr:     true,
			errContains: "cannot use ToStdout with OutFile",
		},
		{
			name: "custom yaml indent",
			opts: &ConvertOptions{YAMLIndent: 4},
			validate: func(t *testing.T, opts *ConvertOptions) {
				assert.Equal(t, 4, opts.YAMLIndent)
			},
		},
		{
			name: "namespace is passed through",
			opts: &ConvertOptions{Namespace: "my-namespace"},
			validate: func(t *testing.T, opts *ConvertOptions) {
				assert.Equal(t, "my-namespace", opts.Namespace)
			},
		},
		{
			name: "CreateChart is passed through",
			opts: &ConvertOptions{CreateChart: true},
			validate: func(t *testing.T, opts *ConvertOptions) {
				assert.True(t, opts.CreateChart)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := getDefaultConvertOptions(tt.opts)

			if tt.wantErr {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tt.errContains)
				return
			}

			require.NoError(t, err)
			require.NotNil(t, result)

			if tt.validate != nil {
				convertOpts := &ConvertOptions{
					Provider:    result.Provider,
					Replicas:    result.Replicas,
					Volumes:     result.Volumes,
					YAMLIndent:  result.YAMLIndent,
					Controller:  result.Controller,
					Namespace:   result.Namespace,
					CreateChart: result.CreateChart,
				}
				tt.validate(t, convertOpts)
			}
		})
	}
}

func Test_ConvertComposeFiles_EmptyInput(t *testing.T) {
	t.Parallel()
	_, err := ConvertComposeFiles(nil, nil)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "at least one compose file is required")
}

func Test_ConvertComposeFiles_EmptySlice(t *testing.T) {
	t.Parallel()
	_, err := ConvertComposeFiles([]string{}, nil)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "at least one compose file is required")
}

func Test_ConvertComposeFiles_InvalidOptions(t *testing.T) {
	t.Parallel()
	_, err := ConvertComposeFiles([]string{"/nonexistent/docker-compose.yml"}, &ConvertOptions{
		Provider: "invalid",
	})
	require.Error(t, err)
	assert.Contains(t, err.Error(), "invalid provider")
}
