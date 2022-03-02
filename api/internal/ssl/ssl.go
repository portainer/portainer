package ssl

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"io/ioutil"
	"log"
	"os"
	"time"

	"github.com/pkg/errors"

	"github.com/portainer/libcrypto"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

// Service represents a service to manage SSL certificates
type Service struct {
	fileService     portainer.FileService
	dataStore       dataservices.DataStore
	rawCert         *tls.Certificate
	shutdownTrigger context.CancelFunc
}

// NewService returns a pointer to a new Service
func NewService(fileService portainer.FileService, dataStore dataservices.DataStore, shutdownTrigger context.CancelFunc) *Service {
	return &Service{
		fileService:     fileService,
		dataStore:       dataStore,
		shutdownTrigger: shutdownTrigger,
	}
}

// Init initializes the service
func (service *Service) Init(host, certPath, keyPath, caCertPath string) error {
	certSupplied := certPath != "" && keyPath != ""
	caCertSupplied := caCertPath != ""

	if caCertSupplied && !certSupplied {
		return errors.Errorf("supplying a CA cert path (%s) requires an SSL cert and key file", caCertPath)
	}

	if certSupplied {
		newCertPath, newKeyPath, err := service.fileService.CopySSLCertPair(certPath, keyPath)
		if err != nil {
			return errors.Wrap(err, "failed copying supplied certs")
		}

		newCACertPath := ""
		if caCertSupplied {
			newCACertPath, err = service.fileService.CopySSLCACert(caCertPath)
			if err != nil {
				return errors.Wrap(err, "failed copying supplied CA cert")
			}
		}

		return service.cacheInfo(newCertPath, newKeyPath, &newCACertPath, false)
	}

	settings, err := service.GetSSLSettings()
	if err != nil {
		return errors.Wrap(err, "failed fetching ssl settings")
	}

	// certificates already exist
	if settings.CertPath != "" && settings.KeyPath != "" {
		err := service.cacheCertificate(settings.CertPath, settings.KeyPath)
		if err != nil && !os.IsNotExist(err) {
			return err
		}

		// continue if certs don't exist
		if err == nil {
			return nil
		}
	}

	// path not supplied and certificates doesn't exist - generate self-signed
	certPath, keyPath = service.fileService.GetDefaultSSLCertsPath()

	err = generateSelfSignedCertificates(host, certPath, keyPath)
	if err != nil {
		return errors.Wrap(err, "failed generating self signed certs")
	}

	return service.cacheInfo(certPath, keyPath, &caCertPath, true)
}

func generateSelfSignedCertificates(ip, certPath, keyPath string) error {
	if ip == "" {
		return errors.New("host can't be empty")
	}

	log.Printf("[INFO] [internal,ssl] [message: no cert files found, generating self signed ssl certificates]")
	return libcrypto.GenerateCertsForHost("localhost", ip, certPath, keyPath, time.Now().AddDate(5, 0, 0))
}

// GetRawCertificate gets the raw certificate
func (service *Service) GetRawCertificate() *tls.Certificate {
	return service.rawCert
}

// GetSSLSettings gets the certificate info
func (service *Service) GetSSLSettings() (*portainer.SSLSettings, error) {
	return service.dataStore.SSLSettings().Settings()
}

// SetCertificates sets the certificates
func (service *Service) SetCertificates(certData, keyData []byte) error {
	if len(certData) == 0 || len(keyData) == 0 {
		return errors.New("missing certificate files")
	}

	_, err := tls.X509KeyPair(certData, keyData)
	if err != nil {
		return err
	}

	certPath, keyPath, err := service.fileService.StoreSSLCertPair(certData, keyData)
	if err != nil {
		return err
	}

	err = service.cacheInfo(certPath, keyPath, nil, false)
	if err != nil {
		return err
	}

	service.shutdownTrigger()

	return nil
}

// GetCACertificatePool gets the CA Certificate pem file and returns it as a CertPool
func (service *Service) GetCACertificatePool() *x509.CertPool {
	settings, _ := service.GetSSLSettings()
	if settings.CACertPath == "" {
		return nil
	}
	caCert, err := ioutil.ReadFile(settings.CACertPath)
	if err != nil {
		log.Printf("error reading CA cert in path %s: %s", settings.CACertPath, err)
		return nil
	}

	certPool := x509.NewCertPool()
	certPool.AppendCertsFromPEM(caCert)
	return certPool
}

func (service *Service) SetHTTPEnabled(httpEnabled bool) error {
	settings, err := service.dataStore.SSLSettings().Settings()
	if err != nil {
		return err
	}

	if settings.HTTPEnabled == httpEnabled {
		return nil
	}

	settings.HTTPEnabled = httpEnabled

	err = service.dataStore.SSLSettings().UpdateSettings(settings)
	if err != nil {
		return err
	}

	service.shutdownTrigger()

	return nil
}

func (service *Service) cacheCertificate(certPath, keyPath string) error {
	rawCert, err := tls.LoadX509KeyPair(certPath, keyPath)
	if err != nil {
		return err
	}

	service.rawCert = &rawCert

	return nil
}

func (service *Service) cacheInfo(certPath string, keyPath string, caCertPath *string, selfSigned bool) error {
	err := service.cacheCertificate(certPath, keyPath)
	if err != nil {
		return err
	}

	settings, err := service.dataStore.SSLSettings().Settings()
	if err != nil {
		return err
	}

	settings.CertPath = certPath
	settings.KeyPath = keyPath
	settings.SelfSigned = selfSigned
	if caCertPath != nil {
		settings.CACertPath = *caCertPath
	}

	err = service.dataStore.SSLSettings().UpdateSettings(settings)
	if err != nil {
		return err
	}

	return nil
}
