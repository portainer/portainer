package liboras

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/stretchr/testify/assert"
	"oras.land/oras-go/v2/registry/remote/auth"
	"oras.land/oras-go/v2/registry/remote/retry"
)

func TestCreateClient_AuthenticationScenarios(t *testing.T) {
	tests := []struct {
		name                string
		registry            portainer.Registry
		expectAuthenticated bool
		description         string
	}{
		{
			name: "authentication disabled should create anonymous client",
			registry: portainer.Registry{
				URL:            "registry.example.com",
				Authentication: false,
				Username:       "testuser",
				Password:       "testpass",
			},
			expectAuthenticated: false,
			description:         "Even with credentials present, authentication=false should result in anonymous access",
		},
		{
			name: "authentication enabled with valid credentials should create authenticated client",
			registry: portainer.Registry{
				URL:            "registry.example.com",
				Authentication: true,
				Username:       "testuser",
				Password:       "testpass",
			},
			expectAuthenticated: true,
			description:         "Valid credentials with authentication=true should result in authenticated access",
		},
		{
			name: "authentication enabled with empty username should create anonymous client",
			registry: portainer.Registry{
				URL:            "registry.example.com",
				Authentication: true,
				Username:       "",
				Password:       "testpass",
			},
			expectAuthenticated: false,
			description:         "Empty username should fallback to anonymous access",
		},
		{
			name: "authentication enabled with whitespace-only username should create anonymous client",
			registry: portainer.Registry{
				URL:            "registry.example.com",
				Authentication: true,
				Username:       "   ",
				Password:       "testpass",
			},
			expectAuthenticated: false,
			description:         "Whitespace-only username should fallback to anonymous access",
		},
		{
			name: "authentication enabled with empty password should create anonymous client",
			registry: portainer.Registry{
				URL:            "registry.example.com",
				Authentication: true,
				Username:       "testuser",
				Password:       "",
			},
			expectAuthenticated: false,
			description:         "Empty password should fallback to anonymous access",
		},
		{
			name: "authentication enabled with whitespace-only password should create anonymous client",
			registry: portainer.Registry{
				URL:            "registry.example.com",
				Authentication: true,
				Username:       "testuser",
				Password:       "   ",
			},
			expectAuthenticated: false,
			description:         "Whitespace-only password should fallback to anonymous access",
		},
		{
			name: "authentication enabled with both credentials empty should create anonymous client",
			registry: portainer.Registry{
				URL:            "registry.example.com",
				Authentication: true,
				Username:       "",
				Password:       "",
			},
			expectAuthenticated: false,
			description:         "Both credentials empty should fallback to anonymous access",
		},
		{
			name: "public registry with no authentication should create anonymous client",
			registry: portainer.Registry{
				URL:            "docker.io",
				Authentication: false,
				Username:       "",
				Password:       "",
			},
			expectAuthenticated: false,
			description:         "Public registries without authentication should use anonymous access",
		},
		{
			name: "GitLab registry with valid credentials should create authenticated client",
			registry: portainer.Registry{
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
			},
			expectAuthenticated: true,
			description:         "GitLab registry with valid credentials should result in authenticated access",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			client, err := CreateClient(tt.registry)

			assert.NoError(t, err, "CreateClient should not return an error")
			assert.NotNil(t, client, "Client should not be nil")

			// Check if the client has authentication configured
			if tt.expectAuthenticated {
				// Should have auth.Client with credentials
				authClient, ok := client.Client.(*auth.Client)
				assert.True(t, ok, "Expected auth.Client for authenticated access")
				assert.NotNil(t, authClient, "Auth client should not be nil")
				assert.NotNil(t, authClient.Credential, "Credential function should be set")
			} else {
				// For anonymous access without custom TLS, all registries should use retry.DefaultClient
				// (Only registries with custom TLS configuration use a different retry client)
				if tt.registry.ManagementConfiguration == nil || !tt.registry.ManagementConfiguration.TLSConfig.TLS {
					assert.Equal(t, retry.DefaultClient, client.Client,
						"Expected retry.DefaultClient for anonymous access without custom TLS")
				} else {
					// Custom TLS configuration means a custom retry client
					assert.NotEqual(t, retry.DefaultClient, client.Client,
						"Expected custom retry client for registry with custom TLS")
				}
			}
		})
	}
}

func TestCreateClient_RegistryTypes(t *testing.T) {
	registryTypes := []struct {
		name         string
		registryType portainer.RegistryType
		expectedName string
	}{
		{"DockerHub", portainer.DockerHubRegistry, "DockerHub"},
		{"Azure", portainer.AzureRegistry, "Azure"},
		{"Custom", portainer.CustomRegistry, "Custom"},
		{"GitLab", portainer.GitlabRegistry, "GitLab"},
		{"Quay", portainer.QuayRegistry, "Quay"},
		{"ProGet", portainer.ProGetRegistry, "ProGet"},
		{"ECR", portainer.EcrRegistry, "ECR"},
	}

	for _, rt := range registryTypes {
		t.Run(rt.name, func(t *testing.T) {
			registry := portainer.Registry{
				URL:            "registry.example.com",
				Type:           rt.registryType,
				Authentication: false,
			}

			client, err := CreateClient(registry)

			assert.NoError(t, err, "CreateClient should not return an error")
			assert.NotNil(t, client, "Client should not be nil")

			// Verify that getRegistryTypeName returns the expected name
			typeName := getRegistryTypeName(rt.registryType)
			assert.Equal(t, rt.expectedName, typeName, "Registry type name mismatch")
		})
	}
}

func TestGetRegistryTypeName(t *testing.T) {
	tests := []struct {
		registryType portainer.RegistryType
		expectedName string
	}{
		{portainer.QuayRegistry, "Quay"},
		{portainer.AzureRegistry, "Azure"},
		{portainer.CustomRegistry, "Custom"},
		{portainer.GitlabRegistry, "GitLab"},
		{portainer.ProGetRegistry, "ProGet"},
		{portainer.DockerHubRegistry, "DockerHub"},
		{portainer.EcrRegistry, "ECR"},
		{portainer.RegistryType(999), "Unknown"}, // Unknown type
	}

	for _, tt := range tests {
		t.Run(tt.expectedName, func(t *testing.T) {
			result := getRegistryTypeName(tt.registryType)
			assert.Equal(t, tt.expectedName, result, "Registry type name mismatch")
		})
	}
}

func TestCreateClient_ErrorHandling(t *testing.T) {
	tests := []struct {
		name        string
		registry    portainer.Registry
		expectError bool
	}{
		{
			name: "valid registry URL should not error",
			registry: portainer.Registry{
				URL:            "registry.example.com",
				Authentication: false,
			},
			expectError: false,
		},
		{
			name: "empty registry URL should error",
			registry: portainer.Registry{
				URL:            "",
				Authentication: false,
			},
			expectError: true,
		},
		{
			name: "invalid registry URL should error",
			registry: portainer.Registry{
				URL:            "://invalid-url",
				Authentication: false,
			},
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			client, err := CreateClient(tt.registry)

			if tt.expectError {
				assert.Error(t, err, "Expected an error but got none")
				assert.Nil(t, client, "Client should be nil when error occurs")
			} else {
				assert.NoError(t, err, "Expected no error but got: %v", err)
				assert.NotNil(t, client, "Client should not be nil")
			}
		})
	}
}
