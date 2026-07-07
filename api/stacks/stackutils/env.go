package stackutils

import (
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
func BuildEnvMap(stack *portainer.Stack) map[string]string {
	env := make(map[string]string, len(os.Environ()))
	for _, e := range os.Environ() {
		k, v, _ := strings.Cut(e, "=")
		env[k] = v
	}

	dotEnvPath := filesystem.JoinPaths(stack.ProjectPath, path.Dir(stack.EntryPoint), ".env")
	if dotVars, err := dotenv.Read(dotEnvPath); err == nil {
		maps.Copy(env, dotVars)
	}

	for _, pair := range stack.Env {
		env[pair.Name] = UnquoteEnvValue(pair.Value)
	}

	return env
}

// UnquoteEnvValue removes a single matched pair of surrounding quotes from an env
// var value, matching how docker compose reads env-file values.
func UnquoteEnvValue(value string) string {
	if len(value) >= 2 {
		first, last := value[0], value[len(value)-1]
		if (first == '"' && last == '"') || (first == '\'' && last == '\'') {
			return value[1 : len(value)-1]
		}
	}

	return value
}
