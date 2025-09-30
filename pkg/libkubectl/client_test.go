package libkubectl

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestGenerateConfigFlags(t *testing.T) {
	config, err := generateConfigFlags("test-token", "https://api.example.com", "", "", false)
	require.NoError(t, err)
	require.NotNil(t, config)

	_, err = generateConfigFlags("test-token", "", "", "", false)
	require.Error(t, err)
}

func TestNewClient(t *testing.T) {
	// Test with server and token
	client, err := NewClient(&ClientAccess{
		Token:     "test-token",
		ServerUrl: "https://api.example.com",
	}, "", "", false)
	require.NoError(t, err)
	require.NotNil(t, client)

	// Verify the client has the expected structure for a Kubernetes client
	require.NotNil(t, client.factory, "Expected factory to be set")
	require.NotNil(t, client.streams, "Expected streams to be set")
	require.NotNil(t, client.out, "Expected output buffer to be set")
}

func TestNewClientWithKubeconfig(t *testing.T) {
	// Test with kubeconfig path
	client, err := NewClient(&ClientAccess{
		Token:     "",
		ServerUrl: "",
	}, "test-namespace", "/path/to/kubeconfig", true)
	require.NoError(t, err)
	require.NotNil(t, client)

	// Verify the client has the expected structure for a Kubernetes client
	require.NotNil(t, client.factory, "Expected factory to be set")
	require.NotNil(t, client.streams, "Expected streams to be set")
	require.NotNil(t, client.out, "Expected output buffer to be set")
}

func TestNewClientError(t *testing.T) {
	// Test error case when both server and kubeconfig are empty
	client, err := NewClient(&ClientAccess{
		Token:     "",
		ServerUrl: "",
	}, "", "", false)
	require.Error(t, err)
	require.Nil(t, client)
}
