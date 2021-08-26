package exec

import (
	"io/ioutil"
	"os"
	"path"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/stretchr/testify/assert"
)

func Test_createEnvFile(t *testing.T) {
	dir := t.TempDir()

	tests := []struct {
		name         string
		stack        *portainer.Stack
		expected     string
		expectedFile bool
	}{
		{
			name: "should not add env file option if stack doesn't have env variables",
			stack: &portainer.Stack{
				ProjectPath: dir,
			},
			expected: "",
		},
		{
			name: "should not add env file option if stack's env variables are empty",
			stack: &portainer.Stack{
				ProjectPath: dir,
				Env:         []portainer.Pair{},
			},
			expected: "",
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
			expected: "var1=value1\nvar2=value2\n",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, _ := createEnvFile(tt.stack)

			if tt.expected != "" {
				assert.Equal(t, "stack.env", result)

				f, _ := os.Open(path.Join(dir, "stack.env"))
				content, _ := ioutil.ReadAll(f)

				assert.Equal(t, tt.expected, string(content))
			} else {
				assert.Equal(t, "", result)
			}
		})
	}
}

func Test_getStackFiles(t *testing.T) {
	stack := &portainer.Stack{
		EntryPoint: "./file", // picks entry point
		AdditionalFiles: []string{
			``,                  // ignores empty string
			`.`,                 // ignores .
			`..`,                // ignores ..
			`./dir/`,            // ignrores paths that end with trailing /
			`/with-root-prefix`, // replaces "root" based paths with relative
			`./relative`,        // keeps relative paths
			`../escape`,         // prevents dir escape
		},
	}

	filePaths := getStackFiles(stack)
	assert.ElementsMatch(t, filePaths, []string{`./file`, `./with-root-prefix`, `./relative`})
}
