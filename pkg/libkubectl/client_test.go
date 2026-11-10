package libkubectl

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestGenerateConfigFlags(t *testing.T) {
	t.Parallel()
	config, err := generateConfigFlags("test-token", "https://api.example.com", "", "", "", false)
	require.NoError(t, err)
	require.NotNil(t, config)
	require.Empty(t, *config.CAFile)

	config, err = generateConfigFlags("test-token", "https://api.example.com", "/path/to/ca.crt", "", "", false)
	require.NoError(t, err)
	require.NotNil(t, config.CAFile)
	require.Equal(t, "/path/to/ca.crt", *config.CAFile)

	_, err = generateConfigFlags("test-token", "", "", "", "", false)
	require.Error(t, err)
}

func TestNewClientAccess(t *testing.T) {
	t.Parallel()

	access, insecure := NewClientAccess(InClusterServerURL, "a-token")
	require.Equal(t, "a-token", access.Token)
	require.Equal(t, InClusterServerURL, access.ServerUrl)
	require.Equal(t, InClusterCAFile, access.CAFile)
	require.False(t, insecure)

	access, insecure = NewClientAccess("http://127.0.0.1:12345/kubernetes", "a-token")
	require.Equal(t, "a-token", access.Token)
	require.Equal(t, "http://127.0.0.1:12345/kubernetes", access.ServerUrl)
	require.Empty(t, access.CAFile)
	require.True(t, insecure)

	access, insecure = NewClientAccess("https://proxy.invalid", "a-token")
	require.Equal(t, "a-token", access.Token)
	require.Equal(t, "https://proxy.invalid", access.ServerUrl)
	require.Equal(t, InClusterCAFile, access.CAFile)
	require.False(t, insecure)
}

func TestClientAccessFor(t *testing.T) {
	t.Parallel()

	caFile, insecure := ClientAccessFor(InClusterServerURL)
	require.Equal(t, InClusterCAFile, caFile)
	require.False(t, insecure)

	caFile, insecure = ClientAccessFor("http://127.0.0.1:12345/kubernetes")
	require.Empty(t, caFile)
	require.True(t, insecure)

	caFile, insecure = ClientAccessFor("https://proxy.invalid")
	require.Equal(t, InClusterCAFile, caFile)
	require.False(t, insecure)
}

func TestNewClient(t *testing.T) {
	t.Parallel()
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
	t.Parallel()
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
	t.Parallel()
	// Test error case when both server and kubeconfig are empty
	client, err := NewClient(&ClientAccess{
		Token:     "",
		ServerUrl: "",
	}, "", "", false)
	require.Error(t, err)
	require.Nil(t, client)
}
