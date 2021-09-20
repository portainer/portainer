package kubernetes

import (
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"fmt"
	"io/ioutil"
	"log"

	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
)

// KubeConfigService represents a service that is responsible for handling kubeconfig operations
type KubeConfigService interface {
	IsSecure() bool
	GetKubeConfigInternal(endpointId portainer.EndpointID, authToken string) kubernetesClusterAccess
}

// KubernetesClusterAccess represents core details which can be used to generate KubeConfig file/data
type kubernetesClusterAccess struct {
	ClusterServerURL         string `example:"https://mycompany.k8s.com"`
	CertificateAuthorityFile string `example:"/data/tls/localhost.crt"`
	CertificateAuthorityData string `example:"MIIC5TCCAc2gAwIBAgIJAJ+...+xuhOaFXwQ=="`
	AuthToken                string `example:"ey..."`
}

type kubeConfigCAService struct {
	httpsBindAddr            string
	certificateAuthorityFile string
	certificateAuthorityData string
}

var (
	errTLSCertNotProvided   = errors.New("tls cert path not provided")
	errTLSCertFileMissing   = errors.New("missing tls cert file")
	errTLSCertIncorrectType = errors.New("incorrect tls cert type")
	errTLSCertValidation    = errors.New("failed to parse tls certificate")
)

// NewKubeConfigCAService encapsulates generation of core KubeConfig data
func NewKubeConfigCAService(httpsBindAddr string, tlsCertPath string) KubeConfigService {
	certificateAuthorityData, err := getCertificateAuthorityData(tlsCertPath)
	if err != nil {
		log.Printf("[DEBUG] [internal,kubeconfig] [message: %s, generated KubeConfig will be insecure]", err.Error())
	}

	return &kubeConfigCAService{
		httpsBindAddr:            httpsBindAddr,
		certificateAuthorityFile: tlsCertPath,
		certificateAuthorityData: certificateAuthorityData,
	}
}

// getCertificateAuthorityData reads tls certificate from supplied path and verifies the tls certificate
// then returns content (string) of the certificate within `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----`
func getCertificateAuthorityData(tlsCertPath string) (string, error) {
	if tlsCertPath == "" {
		return "", errTLSCertNotProvided
	}

	data, err := ioutil.ReadFile(tlsCertPath)
	if err != nil {
		return "", errors.Wrap(errTLSCertFileMissing, err.Error())
	}

	block, _ := pem.Decode(data)
	if block == nil || block.Type != "CERTIFICATE" {
		return "", errTLSCertIncorrectType
	}

	certificate, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return "", errors.Wrap(errTLSCertValidation, err.Error())
	}

	return base64.StdEncoding.EncodeToString(certificate.Raw), nil
}

// IsSecure specifies whether generated KubeConfig structs from the service will not have `insecure-skip-tls-verify: true`
// this is based on the fact that we can successfully extract `certificateAuthorityData` from
// certificate file at `tlsCertPath`. If we can successfully extract `certificateAuthorityData`,
// then this will be used as `certificate-authority-data` attribute in a generated KubeConfig.
func (kccas *kubeConfigCAService) IsSecure() bool {
	return kccas.certificateAuthorityData != ""
}

// GetKubeConfigInternal returns K8s cluster access details for the specified environment(endpoint).
// On startup, portainer generates a certificate against localhost at specified `httpsBindAddr` port, hence
// the kubeconfig generated should only be utilised by internal portainer binaries as the `ClusterServerURL`
// points to the internally accessible `https` based `localhost` address.
// The struct can be used to:
// - generate a kubeconfig file
// - pass down params to binaries
func (kccas *kubeConfigCAService) GetKubeConfigInternal(endpointId portainer.EndpointID, authToken string) kubernetesClusterAccess {
	clusterServerUrl := fmt.Sprintf("https://localhost%s/api/endpoints/%s/kubernetes", kccas.httpsBindAddr, fmt.Sprint(endpointId))
	return kubernetesClusterAccess{
		ClusterServerURL:         clusterServerUrl,
		CertificateAuthorityFile: kccas.certificateAuthorityFile,
		CertificateAuthorityData: kccas.certificateAuthorityData,
		AuthToken:                authToken,
	}
}
