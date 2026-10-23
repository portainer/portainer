package stackutils

import (
	"fmt"
	"maps"
	"os"
	"path"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"

	"github.com/compose-spec/compose-go/v2/dotenv"
)

// BuildEnvMap builds the environment variable map for stack validation/loading.
// Priority (lowest to highest): OS env, .env file, stack.Env
//
// stack.Env values are parsed through the same dotenv rules as the env file
// consumed by the actual deployment (see createEnvFile in api/exec/compose_stack.go),
// so that quoted values (e.g. API_PORT="8005") are interpreted identically during
// validation and deployment.
func BuildEnvMap(stack *portainer.Stack) (map[string]string, error) {
	env := make(map[string]string, len(os.Environ()))
	for _, e := range os.Environ() {
		k, v, _ := strings.Cut(e, "=")
		env[k] = v
	}

	dotEnvPath := filesystem.JoinPaths(stack.ProjectPath, path.Dir(stack.EntryPoint), ".env")
	if dotVars, err := dotenv.Read(dotEnvPath); err == nil {
		maps.Copy(env, dotVars)
	}

	if len(stack.Env) == 0 {
		return env, nil
	}

	var stackEnvFile strings.Builder
	for _, pair := range stack.Env {
		stackEnvFile.WriteString(pair.Name)
		stackEnvFile.WriteString("=")
		stackEnvFile.WriteString(pair.Value)
		stackEnvFile.WriteString("\n")
	}

	stackVars, err := dotenv.ParseWithLookup(strings.NewReader(stackEnvFile.String()), func(k string) (string, bool) {
		v, ok := env[k]
		return v, ok
	})
	if err != nil {
		return nil, fmt.Errorf("failed to parse stack environment variables: %w", err)
	}

	maps.Copy(env, stackVars)

	return env, nil
}
