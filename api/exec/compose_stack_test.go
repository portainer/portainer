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

func Test_createEnvFile_mergesDefultAndInplaceEnvVars(t *testing.T) {
	dir := t.TempDir()
	os.WriteFile(path.Join(dir, ".env"), []byte("VAR1=VAL1\nVAR2=VAL2\n"), 0600)
	stack := &portainer.Stack{
		ProjectPath: dir,
		Env: []portainer.Pair{
			{Name: "VAR1", Value: "NEW_VAL1"},
			{Name: "VAR3", Value: "VAL3"},
		},
	}
	result, err := createEnvFile(stack)
	assert.Equal(t, "stack.env", result)
	assert.NoError(t, err)
	assert.FileExists(t, path.Join(dir, "stack.env"))
	f, _ := os.Open(path.Join(dir, "stack.env"))
	content, _ := ioutil.ReadAll(f)

	assert.Equal(t, []byte("VAR1=VAL1\nVAR2=VAL2\n\nVAR1=NEW_VAL1\nVAR3=VAL3\n"), content)
}
