package exec

import (
	"io/ioutil"
	"os"
	"path"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/stretchr/testify/assert"
)

func Test_setComposeFile(t *testing.T) {
	tests := []struct {
		name     string
		stack    *portainer.Stack
		expected []string
	}{
		{
			name:     "should return empty result if stack is missing",
			stack:    nil,
			expected: []string{},
		},
		{
			name:     "should return empty result if stack don't have entrypoint",
			stack:    &portainer.Stack{},
			expected: []string{},
		},
		{
			name: "should allow file name and dir",
			stack: &portainer.Stack{
				ProjectPath: "dir",
				EntryPoint:  "file",
			},
			expected: []string{"-f", path.Join("dir", "file")},
		},
		{
			name: "should allow file name only",
			stack: &portainer.Stack{
				EntryPoint: "file",
			},
			expected: []string{"-f", "file"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := setComposeFile(tt.stack)
			assert.ElementsMatch(t, tt.expected, result)
		})
	}
}

func Test_addProjectNameOption(t *testing.T) {
	tests := []struct {
		name     string
		stack    *portainer.Stack
		expected []string
	}{
		{
			name:     "should not add project option if stack is missing",
			stack:    nil,
			expected: []string{},
		},
		{
			name:     "should not add project option if stack doesn't have name",
			stack:    &portainer.Stack{},
			expected: []string{},
		},
		{
			name: "should add project name option if stack has a name",
			stack: &portainer.Stack{
				Name: "project-name",
			},
			expected: []string{"-p", "project-name"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			options := []string{"-a", "b"}
			result := addProjectNameOption(options, tt.stack)
			assert.ElementsMatch(t, append(options, tt.expected...), result)
		})
	}
}

func Test_addEnvFileOption(t *testing.T) {
	dir := t.TempDir()

	tests := []struct {
		name            string
		stack           *portainer.Stack
		expected        []string
		expectedContent string
	}{
		{
			name:     "should not add env file option if stack is missing",
			stack:    nil,
			expected: []string{},
		},
		{
			name:     "should not add env file option if stack doesn't have env variables",
			stack:    &portainer.Stack{},
			expected: []string{},
		},
		{
			name: "should not add env file option if stack's env variables are empty",
			stack: &portainer.Stack{
				ProjectPath: dir,
				Env:         []portainer.Pair{},
			},
			expected: []string{},
		},
		{
			name: "should add env file option if stack has env variables",
			stack: &portainer.Stack{
				ProjectPath: dir,
				Env: []portainer.Pair{
					{Name: "var1", Value: "value1"},
					{Name: "var2", Value: "value2"},
				},
			},
			expected:        []string{"--env-file", path.Join(dir, "stack.env")},
			expectedContent: "var1=value1\nvar2=value2\n",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			options := []string{"-a", "b"}
			result, _ := addEnvFileOption(options, tt.stack)
			assert.ElementsMatch(t, append(options, tt.expected...), result)

			if tt.expectedContent != "" {
				f, _ := os.Open(path.Join(dir, "stack.env"))
				content, _ := ioutil.ReadAll(f)

				assert.Equal(t, tt.expectedContent, string(content))
			}
		})
	}
}
