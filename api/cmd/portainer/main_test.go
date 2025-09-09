package main

import (
	"os"
	"path"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const secretFileName = "secret.txt"

func createPasswordFile(t *testing.T, secretPath, password string) string {
	err := os.WriteFile(secretPath, []byte(password), 0600)
	require.NoError(t, err)
	return secretPath
}

func TestLoadEncryptionSecretKey(t *testing.T) {
	tempDir := t.TempDir()
	secretPath := path.Join(tempDir, secretFileName)

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

func TestDBSecretPath(t *testing.T) {
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
