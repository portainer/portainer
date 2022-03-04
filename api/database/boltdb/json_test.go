package boltdb

import (
	"crypto/sha256"
	"fmt"
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/assert"
)

const (
	jsonobject = `{"LogoURL":"","BlackListedLabels":[],"AuthenticationMethod":1,"LDAPSettings":{"AnonymousMode":true,"ReaderDN":"","URL":"","TLSConfig":{"TLS":false,"TLSSkipVerify":false},"StartTLS":false,"SearchSettings":[{"BaseDN":"","Filter":"","UserNameAttribute":""}],"GroupSearchSettings":[{"GroupBaseDN":"","GroupFilter":"","GroupAttribute":""}],"AutoCreateUsers":true},"OAuthSettings":{"ClientID":"","AccessTokenURI":"","AuthorizationURI":"","ResourceURI":"","RedirectURI":"","UserIdentifier":"","Scopes":"","OAuthAutoCreateUsers":false,"DefaultTeamID":0,"SSO":true,"LogoutURI":"","KubeSecretKey":"j0zLVtY/lAWBk62ByyF0uP80SOXaitsABP0TTJX8MhI="},"OpenAMTConfiguration":{"Enabled":false,"MPSServer":"","MPSUser":"","MPSPassword":"","MPSToken":"","CertFileContent":"","CertFileName":"","CertFilePassword":"","DomainName":""},"FeatureFlagSettings":{},"SnapshotInterval":"5m","TemplatesURL":"https://raw.githubusercontent.com/portainer/templates/master/templates-2.0.json","EdgeAgentCheckinInterval":5,"EnableEdgeComputeFeatures":false,"UserSessionTimeout":"8h","KubeconfigExpiry":"0","EnableTelemetry":true,"HelmRepositoryURL":"https://charts.bitnami.com/bitnami","KubectlShellImage":"portainer/kubectl-shell","DisplayDonationHeader":false,"DisplayExternalContributors":false,"EnableHostManagementFeatures":false,"AllowVolumeBrowserForRegularUsers":false,"AllowBindMountsForRegularUsers":false,"AllowPrivilegedModeForRegularUsers":false,"AllowHostNamespaceForRegularUsers":false,"AllowStackManagementForRegularUsers":false,"AllowDeviceMappingForRegularUsers":false,"AllowContainerCapabilitiesForRegularUsers":false}`
	passphrase = "my secret key"
)

func secretToEncryptionKey(passphrase string) []byte {
	hash := sha256.Sum256([]byte(passphrase))
	return hash[:]
}

func Test_MarshalObjectUnencrypted(t *testing.T) {
	is := assert.New(t)

	uuid := uuid.Must(uuid.NewV4())

	tests := []struct {
		object   interface{}
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
			object:   map[string]interface{}{"key": "value"},
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
			object:   []map[string]interface{}{{"key1": "value1"}, {"key2": "value2"}},
			expected: `[{"key1":"value1"},{"key2":"value2"}]`,
		},
		{
			object:   []interface{}{1, "2", false, map[string]interface{}{"key1": "value1"}},
			expected: `[1,"2",false,{"key1":"value1"}]`,
		},
	}

	conn := DbConnection{}

	for _, test := range tests {
		t.Run(fmt.Sprintf("%s -> %s", test.object, test.expected), func(t *testing.T) {
			data, err := conn.MarshalObject(test.object)
			is.NoError(err)
			is.Equal(test.expected, string(data))
		})
	}
}

func Test_UnMarshalObjectUnencrypted(t *testing.T) {
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
			is.NoError(err)
			is.Equal(test.expected, string(object))
		})
	}
}

func Test_ObjectMarshallingEncrypted(t *testing.T) {
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
	conn := DbConnection{EncryptionKey: key}
	for _, test := range tests {
		t.Run(fmt.Sprintf("%s -> %s", test.object, test.expected), func(t *testing.T) {

			data, err := conn.MarshalObject(test.object)
			is.NoError(err)

			var object []byte
			err = conn.UnmarshalObject(data, &object)

			is.NoError(err)
			is.Equal(test.object, object)
		})
	}
}
