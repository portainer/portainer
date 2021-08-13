package kubernetes

import (
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"io/ioutil"
	"log"

	"github.com/pkg/errors"
)

// KubeConfigService represents a service that is responsible for handling kubeconfig operations
type KubeConfigService interface {
	IsSecure() bool
	GetKubeConfigCore(clusterServerURL, authToken string) KubernetesClusterAccess
}

// KubernetesClusterAccess represents core details which can be used to generate KubeConfig file/data
type KubernetesClusterAccess struct {
	ClusterServerURL         string `example:"https://mycompany.k8s.com"`
	CertificateAuthorityFile string `example:"/data/tls/localhost.crt"`
	CertificateAuthorityData string `example:"MIIC5TCCAc2gAwIBAgIJAJ+...+xuhOaFXwQ=="`
	AuthToken                string `example:"ey..."`
}

type kubeConfigCAService struct {
	certificateAuthorityFile string
	certificateAuthorityData string
}

var (
	errSSLCertNotProvided   = errors.New("ssl cert path not provided")
	errSSLCertFileMissing   = errors.New("missing ssl cert file")
	errSSLCertIncorrectType = errors.New("incorrect ssl cert type")
	errSSLCertValidation    = errors.New("failed to parse ssl certificate")
)

// NewKubeConfigCAService encapsulates generation of core KubeConfig data
func NewKubeConfigCAService(sslCertPath string) KubeConfigService {
	certificateAuthorityData, err := getCertificateAuthorityData(sslCertPath)
	if err != nil {
		log.Printf("[DEBUG] [internal,kubeconfig] [message: %s, generated KubeConfig will be insecure]", err.Error())
	}

	return &kubeConfigCAService{
		certificateAuthorityFile: sslCertPath,
		certificateAuthorityData: certificateAuthorityData,
	}
}

// getCertificateAuthorityData reads ssl certificate from supplied path and verifies the ssl certificate
// then returns content (string) of the certificate within `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----`
func getCertificateAuthorityData(sslCertPath string) (string, error) {
	if sslCertPath == "" {
		return "", errSSLCertNotProvided
	}

	data, err := ioutil.ReadFile(sslCertPath)
	if err != nil {
		return "", errors.Wrap(errSSLCertFileMissing, err.Error())
	}

	block, _ := pem.Decode(data)
	if block == nil || block.Type != "CERTIFICATE" {
		return "", errSSLCertIncorrectType
	}

	certificate, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return "", errors.Wrap(errSSLCertValidation, err.Error())
	}

	return base64.StdEncoding.EncodeToString(certificate.Raw), nil
}

// IsSecure specifies whether generated KubeConfig structs from the service will not have `insecure-skip-tls-verify: true`
// this is based on the fact that we can successfully extract `certificateAuthorityData` from
// certificate file at `sslCertPath`. If we can successfully extract `certificateAuthorityData`,
// then this will be used as `certificate-authority-data` attribute in a generated KubeConfig.
func (kccas *kubeConfigCAService) IsSecure() bool {
	return kccas.certificateAuthorityData != ""
}

// GetKubeConfigCore returns core K8s cluster access details
// The struct can be used to:
// - generate a kubeconfig file
// - pass down params to binaries
func (kccas *kubeConfigCAService) GetKubeConfigCore(clusterServerURL, authToken string) KubernetesClusterAccess {
	return KubernetesClusterAccess{
		ClusterServerURL:         clusterServerURL,
		CertificateAuthorityFile: kccas.certificateAuthorityFile,
		CertificateAuthorityData: kccas.certificateAuthorityData,
		AuthToken:                authToken,
	}
}
