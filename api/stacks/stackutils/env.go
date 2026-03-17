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
// Priority (lowest to highest): OS env → .env file → stack.Env
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
		env[pair.Name] = pair.Value
	}

	return env
}
