package main

import (
	"os"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/internal/testhelpers"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_resolveSetupToken(t *testing.T) {
	t.Parallel()

	t.Run("admin already exists — returns empty token", func(t *testing.T) {
		admin := portainer.User{Role: portainer.AdministratorRole}
		store := testhelpers.NewDatastore(testhelpers.WithUsers([]portainer.User{admin}))
		token, err := resolveSetupToken(store, "")
		require.NoError(t, err)
		assert.Empty(t, token)
	})

	t.Run("no admin — generates a 64-char hex token", func(t *testing.T) {
		store := testhelpers.NewDatastore(testhelpers.WithUsers([]portainer.User{}))
		token, err := resolveSetupToken(store, "")
		require.NoError(t, err)
		assert.Len(t, token, 64)

		token2, err := resolveSetupToken(store, "")
		require.NoError(t, err)
		assert.NotEqual(t, token, token2)
	})

	t.Run("no admin — uses provided token", func(t *testing.T) {
		store := testhelpers.NewDatastore(testhelpers.WithUsers([]portainer.User{}))
		token, err := resolveSetupToken(store, "mysecrettoken")
		require.NoError(t, err)
		assert.Equal(t, "mysecrettoken", token)
	})

	t.Run("admin already exists — ignores provided token", func(t *testing.T) {
		admin := portainer.User{Role: portainer.AdministratorRole}
		store := testhelpers.NewDatastore(testhelpers.WithUsers([]portainer.User{admin}))
		token, err := resolveSetupToken(store, "mysecrettoken")
		require.NoError(t, err)
		assert.Empty(t, token)
	})
}

const secretFileName = "secret.txt"

func createPasswordFile(t *testing.T, secretPath, password string) string {
	err := os.WriteFile(secretPath, []byte(password), 0o600)
	require.NoError(t, err)
	return secretPath
}

func TestLoadEncryptionSecretKey(t *testing.T) {
	t.Parallel()
	tempDir := t.TempDir()
	secretPath := filesystem.JoinPaths(tempDir, secretFileName)

	// first pointing to file that does not exist, gives nil hash (no encryption)
	encryptionKey := loadEncryptionSecretKey(secretPath)
	require.Nil(t, encryptionKey)

	// point to a directory instead of a file
	encryptionKey = loadEncryptionSecretKey(tempDir)
	require.Nil(t, encryptionKey)

	password := "portainer@1234"
	createPasswordFile(t, secretPath, password)

	encryptionKey = loadEncryptionSecretKey(secretPath)
	require.NotNil(t, encryptionKey)
	// should be 32 bytes for aes256 encryption
	require.Len(t, encryptionKey, 32)
}

func TestUpdateSettingsFromFlags_KubectlShellImage(t *testing.T) {
	const existingImage = "existing-image:v1"
	const newImage = "new-image:v2"

	emptyString := ""
	falseBool := false
	var emptyLabels []portainer.Pair

	tests := []struct {
		name                      string
		imageSet                  bool
		flagImage                 string
		expectedKubectlShellImage string
	}{
		{
			name:                      "flag not set — DB image unchanged",
			imageSet:                  false,
			flagImage:                 portainer.DefaultKubectlShellImage,
			expectedKubectlShellImage: existingImage,
		},
		{
			name:                      "flag set — DB image updated",
			imageSet:                  true,
			flagImage:                 newImage,
			expectedKubectlShellImage: newImage,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			store := testhelpers.NewDatastore(
				testhelpers.WithSettingsService(&portainer.Settings{
					KubectlShellImage: existingImage,
				}),
				testhelpers.WithSSLSettingsService(&portainer.SSLSettings{}),
			)

			flags := &portainer.CLIFlags{
				SnapshotInterval:          &emptyString,
				Logo:                      &emptyString,
				EnableEdgeComputeFeatures: &falseBool,
				Templates:                 &emptyString,
				Labels:                    &emptyLabels,
				HTTPDisabled:              &falseBool,
				HTTPEnabled:               &falseBool,
			}
			flags.KubectlShellImage = &tc.flagImage
			flags.KubectlShellImageSet = tc.imageSet

			err := updateSettingsFromFlags(store, flags)
			require.NoError(t, err)

			settings, err := store.Settings().Settings()
			require.NoError(t, err)
			require.Equal(t, tc.expectedKubectlShellImage, settings.KubectlShellImage)
		})
	}
}

func TestDBSecretPath(t *testing.T) {
	t.Parallel()
	tests := []struct {
		keyFilenameFlag string
		expected        string
	}{
		{keyFilenameFlag: "secret.txt", expected: "/run/secrets/secret.txt"},
		{keyFilenameFlag: "/tmp/secret.txt", expected: "/tmp/secret.txt"},
		{keyFilenameFlag: "/run/secrets/secret.txt", expected: "/run/secrets/secret.txt"},
		{keyFilenameFlag: "./secret.txt", expected: "/run/secrets/secret.txt"},
		{keyFilenameFlag: "../secret.txt", expected: "/run/secret.txt"},
		{keyFilenameFlag: "foo/bar/secret.txt", expected: "/run/secrets/foo/bar/secret.txt"},
	}

	for _, test := range tests {
		assert.Equal(t, test.expected, dbSecretPath(test.keyFilenameFlag))
	}
}
