package kubernetes

import (
	"fmt"
	"io/ioutil"
	"os"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

// TLS certificate can be generated using:
// openssl req -x509 -out localhost.crt -keyout localhost.key -newkey rsa:2048 -nodes -sha25 -subj '/CN=localhost' -extensions EXT -config <( \
// printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")
const certData = `-----BEGIN CERTIFICATE-----
MIIC5TCCAc2gAwIBAgIJAJ+poiEBdsplMA0GCSqGSIb3DQEBCwUAMBQxEjAQBgNV
BAMMCWxvY2FsaG9zdDAeFw0yMTA4MDQwNDM0MTZaFw0yMTA5MDMwNDM0MTZaMBQx
EjAQBgNVBAMMCWxvY2FsaG9zdDCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoC
ggEBAKQ0HStP34FY/lSDIfMG9MV/lKNUkiLZcMXepbyhPit4ND/w9kOA4WTJ+oP0
B2IYklRvLkneZOfQiPweGAPwZl3CjwII6gL6NCkhcXXAJ4JQ9duL5Q6pL//95Ocv
X+qMTssyS1DcH88F6v+gifACLpvG86G9V0DeSGS2fqqfOJngrOCgum1DsWi3Xsew
B3A7GkPRjYmckU3t4iHgcMb+6lGQAxtnllSM9DpqGnjXRs4mnQHKgufaeW5nvHXi
oa5l0aHIhN6MQS99QwKwfml7UtWAYhSJksMrrTovB6rThYpp2ID/iU9MGfkpxubT
oA6scv8alFa8Bo+NEKo255dxsScCAwEAAaM6MDgwFAYDVR0RBA0wC4IJbG9jYWxo
b3N0MAsGA1UdDwQEAwIHgDATBgNVHSUEDDAKBggrBgEFBQcDATANBgkqhkiG9w0B
AQsFAAOCAQEALFBHW/r79KOj5bhoDtHs8h/ESAlD5DJI/kzc1RajA8AuWPsaagG/
S0Bqiq2ApMA6Tr3t9An8peaLCaUapWw59kyQcwwPXm9vxhEEfoBRtk8po8XblsUS
Q5Ku07ycSg5NBGEW2rCLsvjQFuQiAt8sW4jGCCN+ph/GQF9XC8ir+ssiqiMEkbm/
JaK7sTi5kZ/GsSK8bJ+9N/ztoFr89YYEWjjOuIS3HNMdBcuQXIel7siEFdNjbzMo
iuViiuhTPJkxKOzCmv52cxf15B0/+cgcImoX4zc9Z0NxKthBmIe00ojexE0ZBOFi
4PxB7Ou6y/c9OvJb7gJv3z08+xuhOaFXwQ==
-----END CERTIFICATE-----
`

// string within the `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----` without linebreaks
const certDataString = "MIIC5TCCAc2gAwIBAgIJAJ+poiEBdsplMA0GCSqGSIb3DQEBCwUAMBQxEjAQBgNVBAMMCWxvY2FsaG9zdDAeFw0yMTA4MDQwNDM0MTZaFw0yMTA5MDMwNDM0MTZaMBQxEjAQBgNVBAMMCWxvY2FsaG9zdDCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAKQ0HStP34FY/lSDIfMG9MV/lKNUkiLZcMXepbyhPit4ND/w9kOA4WTJ+oP0B2IYklRvLkneZOfQiPweGAPwZl3CjwII6gL6NCkhcXXAJ4JQ9duL5Q6pL//95OcvX+qMTssyS1DcH88F6v+gifACLpvG86G9V0DeSGS2fqqfOJngrOCgum1DsWi3XsewB3A7GkPRjYmckU3t4iHgcMb+6lGQAxtnllSM9DpqGnjXRs4mnQHKgufaeW5nvHXioa5l0aHIhN6MQS99QwKwfml7UtWAYhSJksMrrTovB6rThYpp2ID/iU9MGfkpxubToA6scv8alFa8Bo+NEKo255dxsScCAwEAAaM6MDgwFAYDVR0RBA0wC4IJbG9jYWxob3N0MAsGA1UdDwQEAwIHgDATBgNVHSUEDDAKBggrBgEFBQcDATANBgkqhkiG9w0BAQsFAAOCAQEALFBHW/r79KOj5bhoDtHs8h/ESAlD5DJI/kzc1RajA8AuWPsaagG/S0Bqiq2ApMA6Tr3t9An8peaLCaUapWw59kyQcwwPXm9vxhEEfoBRtk8po8XblsUSQ5Ku07ycSg5NBGEW2rCLsvjQFuQiAt8sW4jGCCN+ph/GQF9XC8ir+ssiqiMEkbm/JaK7sTi5kZ/GsSK8bJ+9N/ztoFr89YYEWjjOuIS3HNMdBcuQXIel7siEFdNjbzMoiuViiuhTPJkxKOzCmv52cxf15B0/+cgcImoX4zc9Z0NxKthBmIe00ojexE0ZBOFi4PxB7Ou6y/c9OvJb7gJv3z08+xuhOaFXwQ=="

func createTempFile(filename, content string) (string, func()) {
	tempPath, _ := ioutil.TempDir("", "temp")
	filePath := fmt.Sprintf("%s/%s", tempPath, filename)
	ioutil.WriteFile(filePath, []byte(content), 0644)

	teardown := func() { os.RemoveAll(tempPath) }

	return filePath, teardown
}

func Test_getCertificateAuthorityData(t *testing.T) {
	is := assert.New(t)

	t.Run("getCertificateAuthorityData fails on tls cert not provided", func(t *testing.T) {
		_, err := getCertificateAuthorityData("")
		is.ErrorIs(err, errTLSCertNotProvided, "getCertificateAuthorityData should fail with %w", errTLSCertNotProvided)
	})

	t.Run("getCertificateAuthorityData fails on tls cert provided but missing file", func(t *testing.T) {
		_, err := getCertificateAuthorityData("/tmp/non-existent.crt")
		is.ErrorIs(err, errTLSCertFileMissing, "getCertificateAuthorityData should fail with %w", errTLSCertFileMissing)
	})

	t.Run("getCertificateAuthorityData fails on tls cert provided but invalid file data", func(t *testing.T) {
		filePath, teardown := createTempFile("invalid-cert.crt", "hello\ngo\n")
		defer teardown()

		_, err := getCertificateAuthorityData(filePath)
		is.ErrorIs(err, errTLSCertIncorrectType, "getCertificateAuthorityData should fail with %w", errTLSCertIncorrectType)
	})

	t.Run("getCertificateAuthorityData succeeds on valid tls cert provided", func(t *testing.T) {
		filePath, teardown := createTempFile("valid-cert.crt", certData)
		defer teardown()

		certificateAuthorityData, err := getCertificateAuthorityData(filePath)
		is.NoError(err, "getCertificateAuthorityData succeed with valid cert; err=%w", errTLSCertIncorrectType)

		is.Equal(certificateAuthorityData, certDataString, "returned certificateAuthorityData should be %s", certDataString)
	})
}

func TestKubeClusterAccessService_IsSecure(t *testing.T) {
	is := assert.New(t)

	t.Run("IsSecure should be false", func(t *testing.T) {
		kcs := NewKubeClusterAccessService("", "", "")
		is.False(kcs.IsSecure(), "should be false if TLS cert not provided")
	})

	t.Run("IsSecure should be false", func(t *testing.T) {
		filePath, teardown := createTempFile("valid-cert.crt", certData)
		defer teardown()

		kcs := NewKubeClusterAccessService("", "", filePath)
		is.True(kcs.IsSecure(), "should be true if valid TLS cert (path and content) provided")
	})
}

func TestKubeClusterAccessService_GetKubeConfigInternal(t *testing.T) {
	is := assert.New(t)

	t.Run("GetData contains host address", func(t *testing.T) {
		kcs := NewKubeClusterAccessService("/", "", "")
		clusterAccessDetails := kcs.GetData("mysite.com", 1)
		is.True(strings.Contains(clusterAccessDetails.ClusterServerURL, "https://mysite.com"), "should contain host address")
	})

	t.Run("GetData contains environment proxy url", func(t *testing.T) {
		kcs := NewKubeClusterAccessService("/", "", "")
		clusterAccessDetails := kcs.GetData("mysite.com", 100)
		is.True(strings.Contains(clusterAccessDetails.ClusterServerURL, "api/endpoints/100/kubernetes"), "should contain environment proxy url")
	})

	t.Run("GetData returns insecure cluster access config", func(t *testing.T) {
		kcs := NewKubeClusterAccessService("/", ":9443", "")
		clusterAccessDetails := kcs.GetData("mysite.com", 1)

		wantClusterAccessDetails := kubernetesClusterAccessData{
			ClusterServerURL:         "https://mysite.com:9443/api/endpoints/1/kubernetes",
			CertificateAuthorityFile: "",
			CertificateAuthorityData: "",
		}

		is.Equal(clusterAccessDetails, wantClusterAccessDetails)
	})

	t.Run("GetData returns secure cluster access config", func(t *testing.T) {
		filePath, teardown := createTempFile("valid-cert.crt", certData)
		defer teardown()

		kcs := NewKubeClusterAccessService("/", "", filePath)
		clusterAccessDetails := kcs.GetData("localhost", 1)

		wantClusterAccessDetails := kubernetesClusterAccessData{
			ClusterServerURL:         "https://localhost/api/endpoints/1/kubernetes",
			CertificateAuthorityFile: filePath,
			CertificateAuthorityData: certDataString,
		}

		is.Equal(clusterAccessDetails, wantClusterAccessDetails)
	})
}
