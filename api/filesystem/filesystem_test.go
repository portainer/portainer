package filesystem

import (
	"os"
	"testing"

	"github.com/stretchr/testify/require"
)

func createService(t *testing.T) *Service {
	dataStorePath := JoinPaths(t.TempDir(), t.Name())

	service, err := NewService(dataStorePath, "")
	require.NoError(t, err, "NewService should not fail")

	t.Cleanup(func() {
		err := os.RemoveAll(dataStorePath)
		require.NoError(t, err)
	})

	return service
}

func Test_LoadKeyPair_ReturnsError_WhenPrivateKeyFileIsNotValidPEM(t *testing.T) {
	t.Parallel()
	service := createService(t)

	err := os.WriteFile(service.wrapFileStore(PrivateKeyFile), []byte("not a pem file"), 0600)
	require.NoError(t, err)

	_, _, err = service.LoadKeyPair()
	require.EqualError(t, err, "failed to decode PEM block")
}
