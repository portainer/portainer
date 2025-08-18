package sdk

import (
	"strings"
	"testing"

	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/pkg/fips"
	helmregistrycache "github.com/portainer/portainer/pkg/libhelm/cache"
	"github.com/stretchr/testify/assert"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/registry"
)

func init() {
	fips.InitFIPS(false)
}

func TestIsOCIRegistry(t *testing.T) {
	t.Run("should return false for nil registry (HTTP repo)", func(t *testing.T) {
		assert.False(t, IsOCIRegistry(nil))
	})

	t.Run("should return true for non-nil registry (OCI registry)", func(t *testing.T) {
		assert.True(t, IsOCIRegistry(&portainer.Registry{}))
	})
}

func TestIsHTTPRepository(t *testing.T) {
	t.Run("should return true for nil registry (HTTP repo)", func(t *testing.T) {
		assert.True(t, IsHTTPRepository(nil))
	})

	t.Run("should return false for non-nil registry (OCI registry)", func(t *testing.T) {
		assert.False(t, IsHTTPRepository(&portainer.Registry{}))
	})
}

func TestParseHTTPRepoChartRef(t *testing.T) {
	is := assert.New(t)

	chartRef, repoURL, err := parseHTTPRepoChartRef("my-chart", "https://my.repo/charts")

	is.NoError(err)
	is.Equal("my-chart", chartRef)
	is.Equal("https://my.repo/charts", repoURL)
}

func TestParseOCIChartRef(t *testing.T) {
	is := assert.New(t)

	registry := &portainer.Registry{
		URL:            "my-registry.io/my-namespace",
		Authentication: true,
		Username:       "user",
		Password:       "pass",
	}

	chartRef, repoURL, err := parseOCIChartRef("my-chart", registry)

	is.NoError(err)
	is.Equal("oci://my-registry.io/my-namespace/my-chart", chartRef)
	is.Equal("my-registry.io/my-namespace", repoURL)
}

func TestParseOCIChartRef_GitLab(t *testing.T) {
	is := assert.New(t)

	registry := &portainer.Registry{
		Type:           portainer.GitlabRegistry,
		URL:            "registry.gitlab.com",
		Authentication: true,
		Username:       "gitlab-ci-token",
		Password:       "glpat-xxxxxxxxxxxxxxxxxxxx",
		Gitlab: portainer.GitlabRegistryData{
			ProjectID:   12345,
			InstanceURL: "https://gitlab.com",
			ProjectPath: "my-group/my-project",
		},
	}

	chartRef, repoURL, err := parseOCIChartRef("my-chart", registry)

	is.NoError(err)
	is.Equal("oci://registry.gitlab.com/my-chart", chartRef)
	is.Equal("registry.gitlab.com", repoURL)
}

func TestParseChartRef(t *testing.T) {
	t.Run("should parse HTTP repo chart ref when registry is nil", func(t *testing.T) {
		is := assert.New(t)

		chartRef, repoURL, err := parseChartRef("my-chart", "https://my.repo/charts", nil)

		is.NoError(err)
		is.Equal("my-chart", chartRef)
		is.Equal("https://my.repo/charts", repoURL)
	})

	t.Run("should parse OCI chart ref when registry is provided", func(t *testing.T) {
		is := assert.New(t)

		registry := &portainer.Registry{
			URL:            "my-registry.io/my-namespace",
			Authentication: true,
			Username:       "user",
			Password:       "pass",
		}

		chartRef, repoURL, err := parseChartRef("my-chart", "", registry)

		is.NoError(err)
		is.Equal("oci://my-registry.io/my-namespace/my-chart", chartRef)
		is.Equal("my-registry.io/my-namespace", repoURL)
	})
}

func TestConfigureHTTPRepoChartPathOptions(t *testing.T) {
	is := assert.New(t)
	chartPathOptions := &action.ChartPathOptions{}

	configureHTTPRepoChartPathOptions(chartPathOptions, "https://my.repo/charts")

	is.Equal("https://my.repo/charts", chartPathOptions.RepoURL)
}

func TestConfigureOCIChartPathOptions(t *testing.T) {
	is := assert.New(t)
	chartPathOptions := &action.ChartPathOptions{}

	registry := &portainer.Registry{
		URL:            "my-registry.io/my-namespace",
		Authentication: true,
		Username:       "user",
		Password:       "pass",
	}

	configureOCIChartPathOptions(chartPathOptions, registry)

	is.Equal("user", chartPathOptions.Username)
	is.Equal("pass", chartPathOptions.Password)
}

func TestConfigureOCIChartPathOptions_NoAuth(t *testing.T) {
	is := assert.New(t)
	chartPathOptions := &action.ChartPathOptions{}

	registry := &portainer.Registry{
		URL:            "my-registry.io/my-namespace",
		Authentication: false,
	}

	configureOCIChartPathOptions(chartPathOptions, registry)

	is.Empty(chartPathOptions.Username)
	is.Empty(chartPathOptions.Password)
}

func TestConfigureChartPathOptions(t *testing.T) {
	t.Run("should configure HTTP repo when registry is nil", func(t *testing.T) {
		is := assert.New(t)
		chartPathOptions := &action.ChartPathOptions{}

		err := configureChartPathOptions(chartPathOptions, "1.0.0", "https://my.repo/charts", nil)

		is.NoError(err)
		is.Equal("https://my.repo/charts", chartPathOptions.RepoURL)
		is.Equal("1.0.0", chartPathOptions.Version)
	})

	t.Run("should configure OCI registry when registry is provided", func(t *testing.T) {
		is := assert.New(t)
		chartPathOptions := &action.ChartPathOptions{}

		registry := &portainer.Registry{
			URL:            "my-registry.io/my-namespace",
			Authentication: true,
			Username:       "user",
			Password:       "pass",
		}

		err := configureChartPathOptions(chartPathOptions, "1.0.0", "", registry)

		is.NoError(err)
		is.Equal("user", chartPathOptions.Username)
		is.Equal("pass", chartPathOptions.Password)
		is.Equal("1.0.0", chartPathOptions.Version)
	})
}

func TestLoginToOCIRegistry(t *testing.T) {
	is := assert.New(t)

	t.Run("should return nil for HTTP repository (nil registry)", func(t *testing.T) {
		client, err := createOCIRegistryClient(nil)
		is.NoError(err)
		is.Nil(client)
	})

	t.Run("should return client for registry with auth disabled (for TLS support)", func(t *testing.T) {
		registry := &portainer.Registry{
			URL:            "my-registry.io",
			Authentication: false,
		}
		client, err := createOCIRegistryClient(registry)
		is.NoError(err)
		is.NotNil(client) // Now returns a client even without auth for potential TLS configuration
	})

	t.Run("should handle custom TLS configuration without authentication", func(t *testing.T) {
		registry := &portainer.Registry{
			URL:            "my-registry.io",
			Authentication: false,
			ManagementConfiguration: &portainer.RegistryManagementConfiguration{
				TLSConfig: portainer.TLSConfiguration{
					TLS:           true,
					TLSSkipVerify: false,
					// In a real scenario, these would point to actual cert files
					TLSCACertPath: "",
					TLSCertPath:   "",
					TLSKeyPath:    "",
				},
			},
		}
		client, err := createOCIRegistryClient(registry)
		// Should succeed even without cert files when they're empty strings
		is.NoError(err)
		is.NotNil(client) // Should get a client configured for TLS
	})

	t.Run("should return error for invalid credentials", func(t *testing.T) {
		registry := &portainer.Registry{
			URL:            "my-registry.io",
			Authentication: true,
			Username:       " ",
		}
		client, err := createOCIRegistryClient(registry)
		is.Error(err)
		is.Nil(client)
		// The error might be a validation error or a login error, both are acceptable
		is.True(err.Error() == "username is required when registry authentication is enabled" ||
			strings.Contains(err.Error(), "failed to login to registry"))
	})

	t.Run("should attempt login for valid credentials", func(t *testing.T) {
		registry := &portainer.Registry{
			ID:             123,
			URL:            "my-registry.io",
			Authentication: true,
			Username:       "user",
			Password:       "pass",
		}
		// this will fail because it can't connect to the registry,
		// but it proves that the loginToOCIRegistry function is calling the login function.
		client, err := createOCIRegistryClient(registry)
		is.Error(err)
		is.Nil(client)
		is.Contains(err.Error(), "failed to login to registry")
	})

	t.Run("should attempt login for GitLab registry with valid credentials", func(t *testing.T) {
		registry := &portainer.Registry{
			ID:             456,
			Type:           portainer.GitlabRegistry,
			URL:            "registry.gitlab.com",
			Authentication: true,
			Username:       "gitlab-ci-token",
			Password:       "glpat-xxxxxxxxxxxxxxxxxxxx",
			Gitlab: portainer.GitlabRegistryData{
				ProjectID:   12345,
				InstanceURL: "https://gitlab.com",
				ProjectPath: "my-group/my-project",
			},
		}
		// this will fail because it can't connect to the registry,
		// but it proves that the loginToOCIRegistry function is calling the login function.
		client, err := createOCIRegistryClient(registry)
		is.Error(err)
		is.Nil(client)
		is.Contains(err.Error(), "failed to login to registry")
	})
}

func TestAuthenticateChartSource(t *testing.T) {
	t.Run("should do nothing for HTTP repo (nil registry)", func(t *testing.T) {
		is := assert.New(t)
		actionConfig := &action.Configuration{}
		err := authenticateChartSource(actionConfig, nil)
		is.NoError(err)
		is.Nil(actionConfig.RegistryClient)
	})

	t.Run("should do nothing if registry client already set", func(t *testing.T) {
		is := assert.New(t)
		actionConfig := &action.Configuration{}
		// Mock an existing registry client
		existingClient := &registry.Client{}
		actionConfig.RegistryClient = existingClient

		registry := &portainer.Registry{
			ID:             123,
			Authentication: true,
			Username:       "user",
			Password:       "pass",
		}

		err := authenticateChartSource(actionConfig, registry)
		is.NoError(err)
		is.Equal(existingClient, actionConfig.RegistryClient)
	})

	t.Run("should authenticate OCI registry when registry is provided", func(t *testing.T) {
		is := assert.New(t)
		actionConfig := &action.Configuration{}
		registry := &portainer.Registry{
			ID:             123,
			Authentication: false,
		}
		err := authenticateChartSource(actionConfig, registry)
		is.NoError(err)
	})

	t.Run("should return error for invalid registry credentials", func(t *testing.T) {
		is := assert.New(t)
		actionConfig := &action.Configuration{}
		registry := &portainer.Registry{
			ID:             123,
			Authentication: true,
			Username:       " ", // Invalid username
		}
		err := authenticateChartSource(actionConfig, registry)
		is.Error(err)
		is.Contains(err.Error(), "registry credential validation failed")
	})
}

func TestGetRegistryClientFromCache(t *testing.T) {
	// Initialize cache for testing
	err := helmregistrycache.Initialize("24h")
	if err != nil {
		t.Fatalf("Failed to initialize cache: %v", err)
	}
	// Clear cache before each test
	helmregistrycache.FlushAll()

	t.Run("should return nil for invalid registry ID", func(t *testing.T) {
		is := assert.New(t)
		client, found := helmregistrycache.GetCachedRegistryClientByID(0)
		is.False(found)
		is.Nil(client)
	})

	t.Run("should return nil for non-existent registry ID", func(t *testing.T) {
		is := assert.New(t)
		client, found := helmregistrycache.GetCachedRegistryClientByID(123)
		is.False(found)
		is.Nil(client)
	})

	t.Run("should return cached client for valid registry ID", func(t *testing.T) {
		is := assert.New(t)
		// Create a mock client
		mockClient := &registry.Client{}

		// Store in cache
		helmregistrycache.SetCachedRegistryClientByID(123, mockClient)

		// Retrieve from cache
		cachedClient, found := helmregistrycache.GetCachedRegistryClientByID(123)
		is.True(found)
		is.NotNil(cachedClient)
		is.Equal(mockClient, cachedClient)
	})
}

func TestSetRegistryClientInCache(t *testing.T) {
	// Initialize cache for testing
	err := helmregistrycache.Initialize("24h")
	if err != nil {
		t.Fatalf("Failed to initialize cache: %v", err)
	}
	// Clear cache before each test
	helmregistrycache.FlushAll()

	t.Run("should store and retrieve client successfully", func(t *testing.T) {
		is := assert.New(t)
		// Create a mock client
		client := &registry.Client{}

		// Store in cache
		helmregistrycache.SetCachedRegistryClientByID(123, client)

		// Verify the cache returns the client
		cachedClient, found := helmregistrycache.GetCachedRegistryClientByID(123)
		is.True(found)
		is.NotNil(cachedClient)
		is.Equal(client, cachedClient)
	})

	t.Run("should handle invalid parameters gracefully", func(t *testing.T) {
		// Clear cache to start clean
		helmregistrycache.FlushAll()

		// These should not panic
		helmregistrycache.SetCachedRegistryClientByID(0, nil)                  // nil client should be rejected
		helmregistrycache.SetCachedRegistryClientByID(999, &registry.Client{}) // valid client with registry ID 999 should be accepted
		helmregistrycache.SetCachedRegistryClientByID(123, nil)                // nil client should be rejected

		// Verify that nil clients don't get stored, but valid clients do
		is := assert.New(t)

		// Registry ID 999 with a valid client should be found (the second call above)
		client, found := helmregistrycache.GetCachedRegistryClientByID(999)
		is.True(found)
		is.NotNil(client)

		// Registry ID 0 with nil client should not be found
		client, found = helmregistrycache.GetCachedRegistryClientByID(0)
		is.False(found)
		is.Nil(client)

		// Registry ID 123 with nil client should not be found
		client, found = helmregistrycache.GetCachedRegistryClientByID(123)
		is.False(found)
		is.Nil(client)
	})
}

func TestFlushRegistryCache(t *testing.T) {
	// Initialize cache for testing
	err := helmregistrycache.Initialize("24h")
	if err != nil {
		t.Fatalf("Failed to initialize cache: %v", err)
	}
	// Clear cache before test
	helmregistrycache.FlushAll()

	t.Run("should flush specific registry cache", func(t *testing.T) {
		is := assert.New(t)
		// Create mock clients
		client1 := &registry.Client{}
		client2 := &registry.Client{}

		// Store in cache
		helmregistrycache.SetCachedRegistryClientByID(123, client1)
		helmregistrycache.SetCachedRegistryClientByID(456, client2)

		// Verify both are cached
		client, found := helmregistrycache.GetCachedRegistryClientByID(123)
		is.True(found)
		is.NotNil(client)
		client, found = helmregistrycache.GetCachedRegistryClientByID(456)
		is.True(found)
		is.NotNil(client)

		// Flush only one
		helmregistrycache.FlushRegistryByID(123)

		// Verify only one is flushed
		client, found = helmregistrycache.GetCachedRegistryClientByID(123)
		is.False(found)
		is.Nil(client)
		client, found = helmregistrycache.GetCachedRegistryClientByID(456)
		is.True(found)
		is.NotNil(client)
	})
}

func TestFlushAllRegistryCache(t *testing.T) {
	// Initialize cache for testing
	err := helmregistrycache.Initialize("24h")
	if err != nil {
		t.Fatalf("Failed to initialize cache: %v", err)
	}

	t.Run("should flush all registry cache", func(t *testing.T) {
		is := assert.New(t)
		// Create mock clients
		client1 := &registry.Client{}
		client2 := &registry.Client{}

		// Store in cache
		helmregistrycache.SetCachedRegistryClientByID(123, client1)
		helmregistrycache.SetCachedRegistryClientByID(456, client2)

		// Verify both are cached
		client, found := helmregistrycache.GetCachedRegistryClientByID(123)
		is.True(found)
		is.NotNil(client)
		client, found = helmregistrycache.GetCachedRegistryClientByID(456)
		is.True(found)
		is.NotNil(client)

		// Flush all
		helmregistrycache.FlushAll()

		// Verify both are flushed
		client, found = helmregistrycache.GetCachedRegistryClientByID(123)
		is.False(found)
		is.Nil(client)
		client, found = helmregistrycache.GetCachedRegistryClientByID(456)
		is.False(found)
		is.Nil(client)
		client, found = helmregistrycache.GetCachedRegistryClientByID(456)
		is.False(found)
		is.Nil(client)
	})
}

func TestValidateRegistryCredentials(t *testing.T) {
	tests := []struct {
		name        string
		registry    *portainer.Registry
		expectError bool
		errorMsg    string
	}{
		{
			name:        "nil registry should pass validation",
			registry:    nil,
			expectError: false,
		},
		{
			name: "registry with authentication disabled should pass validation",
			registry: &portainer.Registry{
				Authentication: false,
			},
			expectError: false,
		},
		{
			name: "registry with authentication enabled and valid credentials should pass",
			registry: &portainer.Registry{
				Authentication: true,
				Username:       "testuser",
				Password:       "testpass",
			},
			expectError: false,
		},
		{
			name: "registry with authentication enabled but empty username should fail",
			registry: &portainer.Registry{
				Authentication: true,
				Username:       "",
				Password:       "testpass",
			},
			expectError: true,
			errorMsg:    "username is required when registry authentication is enabled",
		},
		{
			name: "registry with authentication enabled but whitespace username should fail",
			registry: &portainer.Registry{
				Authentication: true,
				Username:       " ",
				Password:       "testpass",
			},
			expectError: true,
			errorMsg:    "username is required when registry authentication is enabled",
		},
		{
			name: "registry with authentication enabled but empty password should fail",
			registry: &portainer.Registry{
				Authentication: true,
				Username:       "testuser",
				Password:       "",
			},
			expectError: true,
			errorMsg:    "password is required when registry authentication is enabled",
		},
		{
			name: "registry with authentication enabled but whitespace password should fail",
			registry: &portainer.Registry{
				Authentication: true,
				Username:       "testuser",
				Password:       " ",
			},
			expectError: true,
			errorMsg:    "password is required when registry authentication is enabled",
		},
		{
			name: "GitLab registry with authentication enabled and valid credentials should pass",
			registry: &portainer.Registry{
				Type:           portainer.GitlabRegistry,
				Authentication: true,
				Username:       "gitlab-ci-token",
				Password:       "glpat-xxxxxxxxxxxxxxxxxxxx",
				Gitlab: portainer.GitlabRegistryData{
					ProjectID:   12345,
					InstanceURL: "https://gitlab.com",
					ProjectPath: "my-group/my-project",
				},
			},
			expectError: false,
		},
		{
			name: "GitLab registry with authentication enabled but empty username should fail",
			registry: &portainer.Registry{
				Type:           portainer.GitlabRegistry,
				Authentication: true,
				Username:       "",
				Password:       "glpat-xxxxxxxxxxxxxxxxxxxx",
				Gitlab: portainer.GitlabRegistryData{
					ProjectID:   12345,
					InstanceURL: "https://gitlab.com",
					ProjectPath: "my-group/my-project",
				},
			},
			expectError: true,
			errorMsg:    "username is required when registry authentication is enabled",
		},
		{
			name: "GitLab registry with authentication enabled but empty password should fail",
			registry: &portainer.Registry{
				Type:           portainer.GitlabRegistry,
				Authentication: true,
				Username:       "gitlab-ci-token",
				Password:       "",
				Gitlab: portainer.GitlabRegistryData{
					ProjectID:   12345,
					InstanceURL: "https://gitlab.com",
					ProjectPath: "my-group/my-project",
				},
			},
			expectError: true,
			errorMsg:    "password is required when registry authentication is enabled",
		},
		{
			name: "GitLab registry with authentication disabled should pass validation",
			registry: &portainer.Registry{
				Type:           portainer.GitlabRegistry,
				Authentication: false,
				Gitlab: portainer.GitlabRegistryData{
					ProjectID:   12345,
					InstanceURL: "https://gitlab.com",
					ProjectPath: "my-group/my-project",
				},
			},
			expectError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateRegistryCredentials(tt.registry)

			if tt.expectError {
				assert.Error(t, err)
				if err != nil {
					assert.Equal(t, tt.errorMsg, err.Error())
				}
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

// Note: buildCacheKey function was removed since we now use registry ID-based caching
// instead of endpoint/session-based caching for better rate limiting protection

func TestShouldFlushCacheOnError(t *testing.T) {
	tests := []struct {
		name        string
		err         error
		registryID  portainer.RegistryID
		shouldFlush bool
	}{
		{
			name:        "nil error should not flush",
			err:         nil,
			registryID:  123,
			shouldFlush: false,
		},
		{
			name:        "zero registry ID should not flush",
			err:         errors.New("some error"),
			registryID:  0,
			shouldFlush: false,
		},
		{
			name:        "unauthorized error should flush",
			err:         errors.New("unauthorized access to registry"),
			registryID:  123,
			shouldFlush: true,
		},
		{
			name:        "authentication failed error should flush",
			err:         errors.New("authentication failed"),
			registryID:  123,
			shouldFlush: true,
		},
		{
			name:        "login failed error should flush",
			err:         errors.New("login failed for user"),
			registryID:  123,
			shouldFlush: true,
		},
		{
			name:        "invalid credentials error should flush",
			err:         errors.New("invalid credentials provided"),
			registryID:  123,
			shouldFlush: true,
		},
		{
			name:        "access denied error should flush",
			err:         errors.New("access denied to repository"),
			registryID:  123,
			shouldFlush: true,
		},
		{
			name:        "forbidden error should flush",
			err:         errors.New("forbidden: insufficient permissions"),
			registryID:  123,
			shouldFlush: true,
		},
		{
			name:        "401 error should flush",
			err:         errors.New("HTTP 401 Unauthorized"),
			registryID:  123,
			shouldFlush: true,
		},
		{
			name:        "403 error should flush",
			err:         errors.New("HTTP 403 Forbidden"),
			registryID:  123,
			shouldFlush: true,
		},
		{
			name:        "token error should flush",
			err:         errors.New("token expired or invalid"),
			registryID:  123,
			shouldFlush: true,
		},
		{
			name:        "auth error should flush",
			err:         errors.New("auth validation failed"),
			registryID:  123,
			shouldFlush: true,
		},
		{
			name:        "chart not found error should not flush",
			err:         errors.New("chart not found in repository"),
			registryID:  123,
			shouldFlush: false,
		},
		{
			name:        "network error should not flush",
			err:         errors.New("connection timeout"),
			registryID:  123,
			shouldFlush: false,
		},
		{
			name:        "helm validation error should not flush",
			err:         errors.New("invalid chart values"),
			registryID:  123,
			shouldFlush: false,
		},
		{
			name:        "kubernetes error should not flush",
			err:         errors.New("namespace not found"),
			registryID:  123,
			shouldFlush: false,
		},
		{
			name:        "case insensitive matching works",
			err:         errors.New("UNAUTHORIZED access denied"),
			registryID:  123,
			shouldFlush: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := shouldFlushCacheOnError(tt.err, tt.registryID)
			is := assert.New(t)
			is.Equal(tt.shouldFlush, result, "Expected shouldFlushCacheOnError to return %v for error: %v", tt.shouldFlush, tt.err)
		})
	}
}
