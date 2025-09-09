package registryhttp

import (
	"net/http"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/pkg/fips"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"oras.land/oras-go/v2/registry/remote/retry"
)

func init() {
	fips.InitFIPS(false)
}

func TestCreateClient(t *testing.T) {
	tests := []struct {
		name                 string
		registry             *portainer.Registry
		expectedUsePlainHTTP bool
		expectError          bool
	}{
		{
			name: "Azure Registry should use default client with HTTPS",
			registry: &portainer.Registry{
				Type: portainer.AzureRegistry,
				URL:  "myregistry.azurecr.io",
			},
			expectedUsePlainHTTP: false,
			expectError:          false,
		},
		{
			name: "ECR Registry should use default client with HTTPS",
			registry: &portainer.Registry{
				Type: portainer.EcrRegistry,
				URL:  "123456789012.dkr.ecr.us-east-1.amazonaws.com",
			},
			expectedUsePlainHTTP: false,
			expectError:          false,
		},
		{
			name: "GitHub Registry should use default client with HTTPS",
			registry: &portainer.Registry{
				Type: portainer.GithubRegistry,
				URL:  "ghcr.io",
			},
			expectedUsePlainHTTP: false,
			expectError:          false,
		},
		{
			name: "GitLab Registry should use default client with HTTPS",
			registry: &portainer.Registry{
				Type: portainer.GitlabRegistry,
				URL:  "registry.gitlab.com",
			},
			expectedUsePlainHTTP: false,
			expectError:          false,
		},
		{
			name: "Custom registry without TLS should use plain HTTP",
			registry: &portainer.Registry{
				Type: portainer.CustomRegistry,
				URL:  "my-custom-registry.local",
			},
			expectedUsePlainHTTP: true,
			expectError:          false,
		},
		{
			name: "Custom registry with TLS enabled should use HTTPS",
			registry: &portainer.Registry{
				Type: portainer.CustomRegistry,
				URL:  "my-custom-registry.local",
				ManagementConfiguration: &portainer.RegistryManagementConfiguration{
					TLSConfig: portainer.TLSConfiguration{
						TLS:           true,
						TLSSkipVerify: true, // Skip verify to avoid cert file requirements in test
					},
				},
			},
			expectedUsePlainHTTP: false,
			expectError:          false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			client, usePlainHTTP, err := CreateClient(tt.registry)

			if tt.expectError {
				require.Error(t, err)
				assert.Nil(t, client)
				return
			}

			require.NoError(t, err)
			assert.NotNil(t, client)
			assert.Equal(t, tt.expectedUsePlainHTTP, usePlainHTTP)

			// Verify client type based on registry configuration
			switch tt.registry.Type {
			case portainer.AzureRegistry, portainer.EcrRegistry, portainer.GithubRegistry, portainer.GitlabRegistry:
				// Cloud registries should use the default retry client
				assert.Equal(t, retry.DefaultClient, client)
			default:
				// Custom registries with TLS should get a custom client, others use default
				if tt.registry.ManagementConfiguration != nil && tt.registry.ManagementConfiguration.TLSConfig.TLS {
					// Custom TLS configuration should create a new client
					assert.NotEqual(t, retry.DefaultClient, client)
					assert.IsType(t, &http.Client{}, client)
				} else {
					// No TLS configuration should use default client
					assert.Equal(t, retry.DefaultClient, client)
				}
			}
		})
	}
}

func TestCreateClient_CloudRegistries(t *testing.T) {
	cloudRegistryTypes := []struct {
		name         string
		registryType portainer.RegistryType
	}{
		{"AzureRegistry", portainer.AzureRegistry},
		{"EcrRegistry", portainer.EcrRegistry},
		{"GithubRegistry", portainer.GithubRegistry},
		{"GitlabRegistry", portainer.GitlabRegistry},
	}

	for _, tt := range cloudRegistryTypes {
		t.Run(tt.name, func(t *testing.T) {
			registry := &portainer.Registry{
				Type: tt.registryType,
				URL:  "example.registry.com",
			}

			client, usePlainHTTP, err := CreateClient(registry)

			require.NoError(t, err)
			assert.NotNil(t, client)
			assert.False(t, usePlainHTTP, "Cloud registries should use HTTPS")
			assert.Equal(t, retry.DefaultClient, client, "Cloud registries should use default retry client")
		})
	}
}

func TestCreateClient_CustomTLSConfiguration(t *testing.T) {
	t.Run("TLS enabled with skip verify", func(t *testing.T) {
		registry := &portainer.Registry{
			Type: portainer.CustomRegistry,
			URL:  "my-registry.local",
			ManagementConfiguration: &portainer.RegistryManagementConfiguration{
				TLSConfig: portainer.TLSConfiguration{
					TLS:           true,
					TLSSkipVerify: true,
				},
			},
		}

		client, usePlainHTTP, err := CreateClient(registry)

		require.NoError(t, err)
		assert.NotNil(t, client)
		assert.False(t, usePlainHTTP, "TLS enabled registries should use HTTPS")
		assert.NotEqual(t, retry.DefaultClient, client, "Custom TLS should create new client")
		assert.IsType(t, &http.Client{}, client)
	})

	t.Run("TLS disabled should use plain HTTP", func(t *testing.T) {
		registry := &portainer.Registry{
			Type: portainer.CustomRegistry,
			URL:  "my-registry.local",
			ManagementConfiguration: &portainer.RegistryManagementConfiguration{
				TLSConfig: portainer.TLSConfiguration{
					TLS: false,
				},
			},
		}

		client, usePlainHTTP, err := CreateClient(registry)

		require.NoError(t, err)
		assert.NotNil(t, client)
		assert.True(t, usePlainHTTP, "TLS disabled should use plain HTTP")
		assert.Equal(t, retry.DefaultClient, client, "No TLS should use default client")
	})

	t.Run("No management configuration should use plain HTTP", func(t *testing.T) {
		registry := &portainer.Registry{
			Type:                    portainer.CustomRegistry,
			URL:                     "my-registry.local",
			ManagementConfiguration: nil,
		}

		client, usePlainHTTP, err := CreateClient(registry)

		require.NoError(t, err)
		assert.NotNil(t, client)
		assert.True(t, usePlainHTTP, "No management config should use plain HTTP")
		assert.Equal(t, retry.DefaultClient, client, "No management config should use default client")
	})
}

func TestCreateClient_TLSWithTrustedCerts_UsesDefaultClientHTTPS(t *testing.T) {
	registry := &portainer.Registry{
		Type: portainer.CustomRegistry,
		URL:  "my-registry.local",
		ManagementConfiguration: &portainer.RegistryManagementConfiguration{
			TLSConfig: portainer.TLSConfiguration{
				TLS:           true,
				TLSSkipVerify: false,
				TLSCACertPath: "",
				TLSCertPath:   "",
				TLSKeyPath:    "",
			},
		},
	}

	client, usePlainHTTP, err := CreateClient(registry)

	require.NoError(t, err)
	assert.False(t, usePlainHTTP, "Trusted TLS should use HTTPS")
	assert.Equal(t, retry.DefaultClient, client, "Trusted TLS should use default retry client")
}

func TestCreateClient_CustomTLS_WithCertPathsMissing_ReturnsError(t *testing.T) {
	registry := &portainer.Registry{
		Type: portainer.CustomRegistry,
		URL:  "my-registry.local",
		ManagementConfiguration: &portainer.RegistryManagementConfiguration{
			TLSConfig: portainer.TLSConfiguration{
				TLS:           true,
				TLSSkipVerify: false,
				TLSCACertPath: "/not/found/ca.pem",
				TLSCertPath:   "/not/found/cert.pem",
				TLSKeyPath:    "/not/found/key.pem",
			},
		},
	}

	client, usePlainHTTP, err := CreateClient(registry)

	require.Error(t, err)
	assert.Nil(t, client)
	assert.False(t, usePlainHTTP)
}
