package stackutils

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/stretchr/testify/require"
)

func TestUnquoteEnvValue(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name     string
		value    string
		expected string
	}{
		{"double quoted", `"8005"`, "8005"},
		{"single quoted", `'8005'`, "8005"},
		{"unquoted", "8005", "8005"},
		{"empty quoted", `""`, ""},
		{"leading quote only", `"8005`, `"8005`},
		{"trailing quote only", `8005"`, `8005"`},
		{"quoted string", `"hello world"`, "hello world"},
		{"inner quotes", `pa"ss"word`, `pa"ss"word`},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			require.Equal(t, tt.expected, UnquoteEnvValue(tt.value))
		})
	}
}

func TestIsValidStackFile_QuotedPortEnvSubstitution(t *testing.T) {
	t.Parallel()

	yamlContent := []byte(`
services:
  web:
    image: nginx:alpine
    ports:
      - "${API_PORT}:8005"
`)

	stack := &portainer.Stack{
		EntryPoint: "docker-compose.yml",
		Env:        []portainer.Pair{{Name: "API_PORT", Value: `"8005"`}},
	}

	err := IsValidStackFile(StackFileValidationConfig{
		Content:          yamlContent,
		SecuritySettings: &portainer.EndpointSecuritySettings{},
		Env:              BuildEnvMap(stack),
	})
	require.NoError(t, err)
}
