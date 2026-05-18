package exec

import (
	"fmt"
	"regexp"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/proxy"
	"github.com/portainer/portainer/api/http/proxy/factory"
	"github.com/portainer/portainer/api/internal/registryutils"

	"github.com/docker/cli/cli/config/types"
	"github.com/rs/zerolog/log"
)

var stackNameNormalizeRegex = regexp.MustCompile("[^-_a-z0-9]+")

func normalizeStackName(name string) string {
	return stackNameNormalizeRegex.ReplaceAllString(strings.ToLower(name), "")
}

// fetchEndpointProxy returns the Docker host URL for the given endpoint.
// For remote endpoints it creates a local proxy that handles TLS termination and
// Portainer agent header injection; for local unix/npipe sockets no proxy is needed.
func fetchEndpointProxy(proxyManager *proxy.Manager, endpoint *portainer.Endpoint) (string, *factory.ProxyServer, error) {
	if strings.HasPrefix(endpoint.URL, "unix://") || strings.HasPrefix(endpoint.URL, "npipe://") {
		return "", nil, nil
	}

	proxy, err := proxyManager.CreateAgentProxyServer(endpoint)
	if err != nil {
		return "", nil, err
	}

	return fmt.Sprintf("tcp://127.0.0.1:%d", proxy.Port), proxy, nil
}

// portainerRegistriesToAuthConfigs converts registries to Docker auth configs.
// Callers must ensure ECR tokens are valid before calling this function (e.g. via
// registryutils.ValidateRegistriesECRTokens with a real DataStoreTx). This function
// intentionally performs no DB writes to avoid write-lock contention when called inside
// an active BoltDB write transaction.
func portainerRegistriesToAuthConfigs(registries []portainer.Registry) []types.AuthConfig {
	var authConfigs []types.AuthConfig

	for _, r := range registries {
		ac := types.AuthConfig{
			Username:      r.Username,
			Password:      r.Password,
			ServerAddress: r.URL,
		}

		if r.Authentication {
			var err error

			ac.Username, ac.Password, err = getEffectiveRegUsernamePassword(&r)
			if err != nil {
				continue
			}
		}

		authConfigs = append(authConfigs, ac)
	}

	return authConfigs
}

func getEffectiveRegUsernamePassword(registry *portainer.Registry) (string, string, error) {
	username, password, err := registryutils.GetRegEffectiveCredential(registry)
	if err != nil {
		log.Warn().
			Err(err).
			Str("RegistryName", registry.Name).
			Msg("Failed to get effective credential. Skip logging with this registry.")
	}

	return username, password, err
}
