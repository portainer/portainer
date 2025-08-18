package sdk

// Helm Registry Client Caching Strategy
//
// This package implements a registry-based caching mechanism for Helm OCI registry clients
// to address rate limiting issues caused by repeated registry authentication.
//
// Key Design Decisions:
//
// 1. Cache Key Strategy: Registry ID
//    - Uses portainer.RegistryID as the cache key instead of user sessions or URL+username
//    - One cached client per registry per Portainer instance, regardless of users
//    - Optimal for rate limiting: each registry only gets one login per Portainer instance
//    - New users reuse existing cached clients rather than creating new ones
//
// 2. Cache Invalidation: Registry Change Events
//    - Cache is flushed when registry credentials are updated (registryUpdate handler)
//    - Cache is flushed when registry is reconfigured (registryConfigure handler)
//    - Cache is flushed when registry is deleted (registryDelete handler)
//    - Cache is flushed when registry authentication fails (show, install, upgrade)
//    - No time-based expiration needed since registry credentials rarely change
//
// 3. Alternative Approaches NOT Used:
//    - registry.ClientOptCredentialsFile(): Still requires token exchange on each client creation
//    - User/session-based caching: Less efficient for rate limiting, creates unnecessary logins
//    - URL+username caching: More complex, harder to invalidate, doesn't handle registry updates
//
// 4. Security Model:
//    - RBAC security is enforced BEFORE reaching this caching layer (handler.getRegistryWithAccess)

import (
	"strings"

	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/pkg/libhelm/cache"
	"github.com/portainer/portainer/pkg/libhelm/options"
	"github.com/portainer/portainer/pkg/registryhttp"
	"github.com/rs/zerolog/log"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/registry"
)

// IsOCIRegistry returns true if the registry is an OCI registry (not nil), false if it's an HTTP repository (nil)
func IsOCIRegistry(registry *portainer.Registry) bool {
	return registry != nil
}

// IsHTTPRepository returns true if it's an HTTP repository (registry is nil), false if it's an OCI registry
func IsHTTPRepository(registry *portainer.Registry) bool {
	return registry == nil
}

// parseChartRef parses chart and repo references based on the registry type
func parseChartRef(chart, repo string, registry *portainer.Registry) (string, string, error) {
	if IsHTTPRepository(registry) {
		return parseHTTPRepoChartRef(chart, repo)
	}
	return parseOCIChartRef(chart, registry)
}

// parseOCIChartRef constructs the full OCI chart reference
func parseOCIChartRef(chart string, registry *portainer.Registry) (string, string, error) {

	chartRef := options.ConstructChartReference(registry.URL, chart)

	log.Debug().
		Str("context", "HelmClient").
		Str("chart_ref", chartRef).
		Bool("authentication", registry.Authentication).
		Msg("Constructed OCI chart reference")

	return chartRef, registry.URL, nil
}

// parseHTTPRepoChartRef returns chart and repo as-is for HTTP repositories
func parseHTTPRepoChartRef(chart, repo string) (string, string, error) {
	return chart, repo, nil
}

// shouldFlushCacheOnError determines if a registry client should be removed from cache based on the error
// This helps handle cases where cached credentials have become invalid
func shouldFlushCacheOnError(err error, registryID portainer.RegistryID) bool {
	if err == nil || registryID == 0 {
		return false
	}

	errorStr := strings.ToLower(err.Error())

	// Authentication/authorization errors that indicate invalid cached credentials
	authenticationErrors := []string{
		"unauthorized",
		"authentication",
		"login failed",
		"invalid credentials",
		"access denied",
		"forbidden",
		"401",
		"403",
		"token",
		"auth",
	}

	for _, authErr := range authenticationErrors {
		if strings.Contains(errorStr, authErr) {
			log.Info().
				Int("registry_id", int(registryID)).
				Str("error", err.Error()).
				Str("context", "HelmClient").
				Msg("Detected authentication error - will flush registry cache")
			return true
		}
	}

	return false
}

// authenticateChartSource handles both HTTP repositories and OCI registries
func authenticateChartSource(actionConfig *action.Configuration, registry *portainer.Registry) error {
	// For HTTP repositories, no authentication needed (CE and EE)
	if IsHTTPRepository(registry) {
		return nil
	}

	// If RegistryClient is already set, we're done
	if actionConfig.RegistryClient != nil {
		log.Debug().
			Str("context", "HelmClient").
			Msg("Registry client already set in action config")
		return nil
	}

	// Validate registry credentials first
	err := validateRegistryCredentials(registry)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Err(err).
			Msg("Registry credential validation failed")
		return errors.Wrap(err, "registry credential validation failed")
	}

	// Cache Strategy Decision: Use registry ID as cache key
	// This provides optimal rate limiting protection since each registry only gets
	// logged into once per Portainer instance, regardless of how many users access it.
	// RBAC security is enforced before reaching this caching layer.
	// When a new user needs access, they reuse the same cached client.
	//
	// Alternative approach (NOT used): registry.ClientOptCredentialsFile()
	// We don't use Helm's credential file approach because:
	// 1. It still requires token exchange with registry on each new client creation
	// 2. Rate limiting occurs during token exchange, not credential loading
	// 3. Our caching approach reuses existing authenticated clients completely
	// 4. Credential files add complexity without solving the core rate limiting issue

	// Try to get cached registry client (registry ID-based key)
	if cachedClient, found := cache.GetCachedRegistryClientByID(registry.ID); found {
		log.Debug().
			Int("registry_id", int(registry.ID)).
			Str("registry_url", registry.URL).
			Str("context", "HelmClient").
			Msg("Using cached registry client")

		actionConfig.RegistryClient = cachedClient
		return nil
	}

	// Cache miss - perform login and cache the result
	log.Debug().
		Int("registry_id", int(registry.ID)).
		Str("registry_url", registry.URL).
		Str("context", "HelmClient").
		Msg("Cache miss - creating new registry client")

	registryClient, err := createOCIRegistryClient(registry)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("registry_url", registry.URL).
			Err(err).
			Msg("Failed to create registry client")
		return errors.Wrap(err, "failed to create registry client")
	}

	// Cache the client if login was successful (registry ID-based key)
	if registryClient != nil {
		cache.SetCachedRegistryClientByID(registry.ID, registryClient)
		log.Debug().
			Int("registry_id", int(registry.ID)).
			Str("registry_url", registry.URL).
			Str("context", "HelmClient").
			Msg("Registry client cached successfully")
	}

	actionConfig.RegistryClient = registryClient
	return nil
}

// configureChartPathOptions sets chart path options based on registry type
func configureChartPathOptions(chartPathOptions *action.ChartPathOptions, version, repo string, registry *portainer.Registry) error {
	chartPathOptions.Version = version
	// Set chart path options based on registry type
	if IsHTTPRepository(registry) {
		configureHTTPRepoChartPathOptions(chartPathOptions, repo)
	} else {
		configureOCIChartPathOptions(chartPathOptions, registry)
	}

	return nil
}

// configureHTTPRepoChartPathOptions sets chart path options for HTTP repositories
func configureHTTPRepoChartPathOptions(chartPathOptions *action.ChartPathOptions, repo string) {
	chartPathOptions.RepoURL = repo
}

// configureOCIChartPathOptions sets chart path options for OCI registries
func configureOCIChartPathOptions(chartPathOptions *action.ChartPathOptions, registry *portainer.Registry) {
	if registry.Authentication {
		chartPathOptions.Username = registry.Username
		chartPathOptions.Password = registry.Password
	}
}

// createOCIRegistryClient creates and optionally authenticates a registry client for OCI-based registries
// Handles both authenticated and unauthenticated registries with proper TLS configuration
// Tries to get a cached registry client if available, otherwise creates and caches a new one
func createOCIRegistryClient(portainerRegistry *portainer.Registry) (*registry.Client, error) {
	// Handle nil registry (HTTP repository)
	if portainerRegistry == nil {
		return nil, nil
	}

	// Check cache first using registry ID-based key
	if cachedClient, found := cache.GetCachedRegistryClientByID(portainerRegistry.ID); found {
		return cachedClient, nil
	}

	log.Debug().
		Str("context", "HelmClient").
		Int("registry_id", int(portainerRegistry.ID)).
		Str("registry_url", portainerRegistry.URL).
		Bool("authentication", portainerRegistry.Authentication).
		Msg("Creating OCI registry client")

	// Create an HTTP client with proper TLS configuration
	httpClient, usePlainHTTP, err := registryhttp.CreateClient(portainerRegistry)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("registry_url", portainerRegistry.URL).
			Err(err).
			Msg("Failed to create HTTP client for registry")
		return nil, errors.Wrap(err, "failed to create HTTP client for registry")
	}

	clientOptions := []registry.ClientOption{
		registry.ClientOptHTTPClient(httpClient),
	}

	if usePlainHTTP {
		clientOptions = append(clientOptions, registry.ClientOptPlainHTTP())
	}

	registryClient, err := registry.NewClient(clientOptions...)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("registry_url", portainerRegistry.URL).
			Err(err).
			Msg("Failed to create registry client")
		return nil, errors.Wrap(err, "failed to create registry client")
	}

	// Only perform login if authentication is enabled
	if portainerRegistry.Authentication {
		loginOpts := []registry.LoginOption{
			registry.LoginOptBasicAuth(portainerRegistry.Username, portainerRegistry.Password),
		}

		err = registryClient.Login(portainerRegistry.URL, loginOpts...)
		if err != nil {
			log.Error().
				Str("context", "HelmClient").
				Str("registry_url", portainerRegistry.URL).
				Err(err).
				Msg("Failed to login to registry")
			return nil, errors.Wrapf(err, "failed to login to registry %s", portainerRegistry.URL)
		}

		log.Debug().
			Str("context", "createOCIRegistryClient").
			Int("registry_id", int(portainerRegistry.ID)).
			Str("registry_url", portainerRegistry.URL).
			Msg("Successfully logged in to OCI registry")
	} else {
		log.Debug().
			Str("context", "createOCIRegistryClient").
			Int("registry_id", int(portainerRegistry.ID)).
			Str("registry_url", portainerRegistry.URL).
			Msg("Created unauthenticated OCI registry client")
	}

	cache.SetCachedRegistryClientByID(portainerRegistry.ID, registryClient)

	return registryClient, nil
}

// validateRegistryCredentials validates registry authentication settings
func validateRegistryCredentials(registry *portainer.Registry) error {
	if IsHTTPRepository(registry) {
		return nil // No registry means no validation needed
	}

	if !registry.Authentication {
		return nil // No authentication required
	}

	// Authentication is enabled - validate credentials
	if strings.TrimSpace(registry.Username) == "" {
		return errors.New("username is required when registry authentication is enabled")
	}

	if strings.TrimSpace(registry.Password) == "" {
		return errors.New("password is required when registry authentication is enabled")
	}

	return nil
}
