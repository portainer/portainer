package file

import (
	"strconv"

	"github.com/portainer/portainer"

	"io"
	"os"
	"path"
)

const (
	// TLSStorePath represents the subfolder where TLS files are stored in the file store folder.
	TLSStorePath = "tls"
	// TLSCACertFile represents the name on disk for a TLS CA file.
	TLSCACertFile = "ca.pem"
	// TLSCertFile represents the name on disk for a TLS certificate file.
	TLSCertFile = "cert.pem"
	// TLSKeyFile represents the name on disk for a TLS key file.
	TLSKeyFile = "key.pem"
)

// Service represents a service for managing files.
type Service struct {
	fileStorePath string
}

// NewService initializes a new service.
func NewService(fileStorePath string) (*Service, error) {
	service := &Service{
		fileStorePath: fileStorePath,
	}

	err := service.createFolderInStoreIfNotExist(TLSStorePath)
	if err != nil {
		return nil, err
	}

	return service, nil
}

// StoreTLSFile creates a subfolder in the TLSStorePath and stores a new file with the content from r.
func (service *Service) StoreTLSFile(endpointID portainer.EndpointID, fileType portainer.TLSFileType, r io.Reader) error {
	ID := strconv.Itoa(int(endpointID))
	endpointStorePath := path.Join(TLSStorePath, ID)
	err := service.createFolderInStoreIfNotExist(endpointStorePath)
	if err != nil {
		return err
	}

	var fileName string
	switch fileType {
	case portainer.TLSFileCA:
		fileName = TLSCACertFile
	case portainer.TLSFileCert:
		fileName = TLSCertFile
	case portainer.TLSFileKey:
		fileName = TLSKeyFile
	default:
		return portainer.ErrUndefinedTLSFileType
	}

	tlsFilePath := path.Join(endpointStorePath, fileName)
	err = service.createFileInStore(tlsFilePath, r)
	if err != nil {
		return err
	}
	return nil
}

// GetPathForTLSFile returns the absolute path to a specific TLS file for an endpoint.
func (service *Service) GetPathForTLSFile(endpointID portainer.EndpointID, fileType portainer.TLSFileType) (string, error) {
	var fileName string
	switch fileType {
	case portainer.TLSFileCA:
		fileName = TLSCACertFile
	case portainer.TLSFileCert:
		fileName = TLSCertFile
	case portainer.TLSFileKey:
		fileName = TLSKeyFile
	default:
		return "", portainer.ErrUndefinedTLSFileType
	}
	ID := strconv.Itoa(int(endpointID))
	return path.Join(service.fileStorePath, TLSStorePath, ID, fileName), nil
}

// DeleteTLSFiles deletes a folder containing the TLS files for an endpoint.
func (service *Service) DeleteTLSFiles(endpointID portainer.EndpointID) error {
	ID := strconv.Itoa(int(endpointID))
	endpointPath := path.Join(service.fileStorePath, TLSStorePath, ID)
	err := os.RemoveAll(endpointPath)
	if err != nil {
		return err
	}
	return nil
}

// createFolderInStoreIfNotExist creates a new folder in the file store if it doesn't exists on the file system.
func (service *Service) createFolderInStoreIfNotExist(name string) error {
	path := path.Join(service.fileStorePath, name)
	_, err := os.Stat(path)
	if os.IsNotExist(err) {
		os.Mkdir(path, 0600)
	} else if err != nil {
		return err
	}
	return nil
}

// createFile creates a new file in the file store with the content from r.
func (service *Service) createFileInStore(filePath string, r io.Reader) error {
	path := path.Join(service.fileStorePath, filePath)
	out, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0600)
	if err != nil {
		return err
	}
	defer out.Close()
	_, err = io.Copy(out, r)
	if err != nil {
		return err
	}
	return nil
}
