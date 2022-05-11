package kubernetes

import (
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"fmt"
	"io/ioutil"
	"log"
	"strings"

	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
)

// KubeClusterAccessService represents a service that is responsible for centralizing kube cluster access data
type KubeClusterAccessService interface {
	IsSecure() bool
	GetData(hostURL string, endpointId portainer.EndpointID) kubernetesClusterAccessData
}

// KubernetesClusterAccess represents core details which can be used to generate KubeConfig file/data
type kubernetesClusterAccessData struct {
	ClusterServerURL         string `example:"https://mycompany.k8s.com"`
	CertificateAuthorityFile string `example:"/data/tls/localhost.crt"`
	CertificateAuthorityData string `example:"MIIC5TCCAc2gAwIBAgIJAJ+...+xuhOaFXwQ=="`
}

type kubeClusterAccessService struct {
	baseURL                  string
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

// NewKubeClusterAccessService creates a new instance of a KubeClusterAccessService
func NewKubeClusterAccessService(baseURL, httpsBindAddr, tlsCertPath string) KubeClusterAccessService {
	certificateAuthorityData, err := getCertificateAuthorityData(tlsCertPath)
	if err != nil {
		log.Printf("[DEBUG] [internal,kubeconfig] [message: %s, generated KubeConfig will be insecure]", err.Error())
	}

	return &kubeClusterAccessService{
		baseURL:                  baseURL,
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
func (service *kubeClusterAccessService) IsSecure() bool {
	return service.certificateAuthorityData != ""
}

// GetData returns K8s cluster access details for the specified environment(endpoint).
// The struct can be used to:
// - generate a kubeconfig file
// - pass down params to binaries
func (service *kubeClusterAccessService) GetData(hostURL string, endpointID portainer.EndpointID) kubernetesClusterAccessData {
	baseURL := service.baseURL
	if baseURL != "/" {
		baseURL = fmt.Sprintf("/%s/", strings.Trim(baseURL, "/"))
	}

	clusterURL := hostURL + service.httpsBindAddr + baseURL

	clusterServerURL := fmt.Sprintf("https://%sapi/endpoints/%d/kubernetes", clusterURL, endpointID)

	return kubernetesClusterAccessData{
		ClusterServerURL:         clusterServerURL,
		CertificateAuthorityFile: service.certificateAuthorityFile,
		CertificateAuthorityData: service.certificateAuthorityData,
	}
}
