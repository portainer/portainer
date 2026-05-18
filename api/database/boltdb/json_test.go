package boltdb

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"io"
	"testing"

	"github.com/google/uuid"
	"github.com/pkg/errors"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const (
	jsonobject = `{"LogoURL":"","BlackListedLabels":[],"AuthenticationMethod":1,"InternalAuthSettings": {"RequiredPasswordLength": 12}"LDAPSettings":{"AnonymousMode":true,"ReaderDN":"","URL":"","TLSConfig":{"TLS":false,"TLSSkipVerify":false},"StartTLS":false,"SearchSettings":[{"BaseDN":"","Filter":"","UserNameAttribute":""}],"GroupSearchSettings":[{"GroupBaseDN":"","GroupFilter":"","GroupAttribute":""}],"AutoCreateUsers":true},"OAuthSettings":{"ClientID":"","AccessTokenURI":"","AuthorizationURI":"","ResourceURI":"","RedirectURI":"","UserIdentifier":"","Scopes":"","OAuthAutoCreateUsers":false,"DefaultTeamID":0,"SSO":true,"LogoutURI":"","KubeSecretKey":"j0zLVtY/lAWBk62ByyF0uP80SOXaitsABP0TTJX8MhI="},"FeatureFlagSettings":{},"SnapshotInterval":"5m","TemplatesURL":"https://raw.githubusercontent.com/portainer/templates/master/templates-2.0.json","EdgeAgentCheckinInterval":5,"EnableEdgeComputeFeatures":false,"UserSessionTimeout":"8h","KubeconfigExpiry":"0","HelmRepositoryURL":"https://charts.bitnami.com/bitnami","KubectlShellImage":"portainer/kubectl-shell","DisplayDonationHeader":false,"DisplayExternalContributors":false,"EnableHostManagementFeatures":false,"AllowVolumeBrowserForRegularUsers":false,"AllowBindMountsForRegularUsers":false,"AllowPrivilegedModeForRegularUsers":false,"AllowHostNamespaceForRegularUsers":false,"AllowStackManagementForRegularUsers":false,"AllowDeviceMappingForRegularUsers":false,"AllowContainerCapabilitiesForRegularUsers":false}`
	passphrase = "my secret key"
)

func secretToEncryptionKey(passphrase string) []byte {
	hash := sha256.Sum256([]byte(passphrase))
	return hash[:]
}

func Test_MarshalObjectUnencrypted(t *testing.T) {
	t.Parallel()
	is := assert.New(t)

	uuid := uuid.New()

	tests := []struct {
		object   any
		expected string
	}{
		{
			object:   nil,
			expected: `null`,
		},
		{
			object:   true,
			expected: `true`,
		},
		{
			object:   false,
			expected: `false`,
		},
		{
			object:   123,
			expected: `123`,
		},
		{
			object:   "456",
			expected: "456",
		},
		{
			object:   uuid,
			expected: "\"" + uuid.String() + "\"",
		},
		{
			object:   uuid.String(),
			expected: uuid.String(),
		},
		{
			object:   map[string]any{"key": "value"},
			expected: `{"key":"value"}`,
		},
		{
			object:   []bool{true, false},
			expected: `[true,false]`,
		},
		{
			object:   []int{1, 2, 3},
			expected: `[1,2,3]`,
		},
		{
			object:   []string{"1", "2", "3"},
			expected: `["1","2","3"]`,
		},
		{
			object:   []map[string]any{{"key1": "value1"}, {"key2": "value2"}},
			expected: `[{"key1":"value1"},{"key2":"value2"}]`,
		},
		{
			object:   []any{1, "2", false, map[string]any{"key1": "value1"}},
			expected: `[1,"2",false,{"key1":"value1"}]`,
		},
	}

	conn := DbConnection{}

	for _, test := range tests {
		t.Run(fmt.Sprintf("%s -> %s", test.object, test.expected), func(t *testing.T) {
			data, err := conn.MarshalObject(test.object)
			require.NoError(t, err)
			is.Equal(test.expected, string(data))
		})
	}
}

func Test_UnMarshalObjectUnencrypted(t *testing.T) {
	t.Parallel()
	is := assert.New(t)

	// Based on actual data entering and what we expect out of the function

	tests := []struct {
		object   []byte
		expected string
	}{
		{
			object:   []byte(""),
			expected: "",
		},
		{
			object:   []byte("35"),
			expected: "35",
		},
		{
			// An unmarshalled byte string should return the same without error
			object:   []byte("9ca4a1dd-a439-4593-b386-a7dfdc2e9fc6"),
			expected: "9ca4a1dd-a439-4593-b386-a7dfdc2e9fc6",
		},
		{
			// An un-marshalled json object string should return the same as a string without error also
			object:   []byte(jsonobject),
			expected: jsonobject,
		},
	}

	conn := DbConnection{}

	for _, test := range tests {
		t.Run(fmt.Sprintf("%s -> %s", test.object, test.expected), func(t *testing.T) {
			var object string
			err := conn.UnmarshalObject(test.object, &object)
			require.NoError(t, err)
			is.Equal(test.expected, object)
		})
	}
}

func Test_ObjectMarshallingEncrypted(t *testing.T) {
	t.Parallel()
	is := assert.New(t)

	// Based on actual data entering and what we expect out of the function

	tests := []struct {
		object   []byte
		expected string
	}{
		{
			object: []byte(""),
		},
		{
			object: []byte("35"),
		},
		{
			// An unmarshalled byte string should return the same without error
			object: []byte("9ca4a1dd-a439-4593-b386-a7dfdc2e9fc6"),
		},
		{
			// An un-marshalled json object string should return the same as a string without error also
			object: []byte(jsonobject),
		},
	}

	key := secretToEncryptionKey(passphrase)
	conn := DbConnection{EncryptionKey: key, isEncrypted: true}
	for _, test := range tests {
		t.Run(fmt.Sprintf("%s -> %s", test.object, test.expected), func(t *testing.T) {

			data, err := conn.MarshalObject(test.object)
			require.NoError(t, err)

			var object []byte
			err = conn.UnmarshalObject(data, &object)

			require.NoError(t, err)
			is.Equal(test.object, object)
		})
	}
}

func Test_NonceSources(t *testing.T) {
	t.Parallel()
	// ensure that the new go 1.24 NewGCMWithRandomNonce works correctly with
	// the old way of creating and including the nonce

	encryptOldFn := func(plaintext []byte, passphrase []byte) (encrypted []byte, err error) {
		block, _ := aes.NewCipher(passphrase)
		gcm, err := cipher.NewGCM(block)
		if err != nil {
			return encrypted, err
		}

		nonce := make([]byte, gcm.NonceSize())
		if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
			return encrypted, err
		}

		return gcm.Seal(nonce, nonce, plaintext, nil), nil
	}

	decryptOldFn := func(encrypted []byte, passphrase []byte) (plaintext []byte, err error) {
		block, err := aes.NewCipher(passphrase)
		if err != nil {
			return encrypted, errors.Wrap(err, "Error creating cypher block")
		}

		gcm, err := cipher.NewGCM(block)
		if err != nil {
			return encrypted, errors.Wrap(err, "Error creating GCM")
		}

		nonceSize := gcm.NonceSize()
		if len(encrypted) < nonceSize {
			return encrypted, errEncryptedStringTooShort
		}

		nonce, ciphertextByteClean := encrypted[:nonceSize], encrypted[nonceSize:]

		plaintext, err = gcm.Open(nil, nonce, ciphertextByteClean, nil)
		if err != nil {
			return encrypted, errors.Wrap(err, "Error decrypting text")
		}

		return plaintext, err
	}

	encryptNewFn := encrypt
	decryptNewFn := decrypt

	passphrase := make([]byte, 32)
	_, err := io.ReadFull(rand.Reader, passphrase)
	require.NoError(t, err)

	junk := make([]byte, 1024)
	_, err = io.ReadFull(rand.Reader, junk)
	require.NoError(t, err)

	junkEnc := make([]byte, base64.StdEncoding.EncodedLen(len(junk)))
	base64.StdEncoding.Encode(junkEnc, junk)

	cases := [][]byte{
		[]byte("test"),
		[]byte("35"),
		[]byte("9ca4a1dd-a439-4593-b386-a7dfdc2e9fc6"),
		[]byte(jsonobject),
		passphrase,
		junk,
		junkEnc,
	}

	for _, plain := range cases {
		var enc, dec []byte
		var err error

		enc, err = encryptOldFn(plain, passphrase)
		require.NoError(t, err)

		dec, err = decryptNewFn(enc, passphrase)
		require.NoError(t, err)

		require.Equal(t, plain, dec)

		enc, err = encryptNewFn(plain, passphrase)
		require.NoError(t, err)

		dec, err = decryptOldFn(enc, passphrase)
		require.NoError(t, err)

		require.Equal(t, plain, dec)
	}
}
