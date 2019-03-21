package filesystem

import (
	"bytes"
	"encoding/json"
	"encoding/pem"
	"io/ioutil"

	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/archive"

	"io"
	"os"
	"path"
)

const (
	// TLSStorePath represents the subfolder where TLS files are stored in the file store folder.
	TLSStorePath = "tls"
	// LDAPStorePath represents the subfolder where LDAP TLS files are stored in the TLSStorePath.
	LDAPStorePath = "ldap"
	// TLSCACertFile represents the name on disk for a TLS CA file.
	TLSCACertFile = "ca.pem"
	// TLSCertFile represents the name on disk for a TLS certificate file.
	TLSCertFile = "cert.pem"
	// TLSKeyFile represents the name on disk for a TLS key file.
	TLSKeyFile = "key.pem"
	// ComposeStorePath represents the subfolder where compose files are stored in the file store folder.
	ComposeStorePath = "compose"
	// ComposeFileDefaultName represents the default name of a compose file.
	ComposeFileDefaultName = "docker-compose.yml"
	// PrivateKeyFile represents the name on disk of the file containing the private key.
	PrivateKeyFile = "portainer.key"
	// PublicKeyFile represents the name on disk of the file containing the public key.
	PublicKeyFile = "portainer.pub"
	// BinaryStorePath represents the subfolder where binaries are stored in the file store folder.
	BinaryStorePath = "bin"
	// ScheduleStorePath represents the subfolder where schedule files are stored.
	ScheduleStorePath = "schedules"
	// ExtensionRegistryManagementStorePath represents the subfolder where files related to the
	// registry management extension are stored.
	ExtensionRegistryManagementStorePath = "extensions"
)

// Service represents a service for managing files and directories.
type Service struct {
	dataStorePath string
	fileStorePath string
}

// NewService initializes a new service. It creates a data directory and a directory to store files
// inside this directory if they don't exist.
func NewService(dataStorePath, fileStorePath string) (*Service, error) {
	service := &Service{
		dataStorePath: dataStorePath,
		fileStorePath: path.Join(dataStorePath, fileStorePath),
	}

	err := os.MkdirAll(dataStorePath, 0755)
	if err != nil {
		return nil, err
	}

	err = service.createDirectoryInStore(TLSStorePath)
	if err != nil {
		return nil, err
	}

	err = service.createDirectoryInStore(ComposeStorePath)
	if err != nil {
		return nil, err
	}

	err = service.createDirectoryInStore(BinaryStorePath)
	if err != nil {
		return nil, err
	}

	return service, nil
}

// GetBinaryFolder returns the full path to the binary store on the filesystem
func (service *Service) GetBinaryFolder() string {
	return path.Join(service.fileStorePath, BinaryStorePath)
}

// ExtractExtensionArchive extracts the content of an extension archive
// specified as raw data into the binary store on the filesystem
func (service *Service) ExtractExtensionArchive(data []byte) error {
	err := archive.UnzipArchive(data, path.Join(service.fileStorePath, BinaryStorePath))
	if err != nil {
		return err
	}

	return nil
}

// RemoveDirectory removes a directory on the filesystem.
func (service *Service) RemoveDirectory(directoryPath string) error {
	return os.RemoveAll(directoryPath)
}

// GetStackProjectPath returns the absolute path on the FS for a stack based
// on its identifier.
func (service *Service) GetStackProjectPath(stackIdentifier string) string {
	return path.Join(service.fileStorePath, ComposeStorePath, stackIdentifier)
}

// StoreStackFileFromBytes creates a subfolder in the ComposeStorePath and stores a new file from bytes.
// It returns the path to the folder where the file is stored.
func (service *Service) StoreStackFileFromBytes(stackIdentifier, fileName string, data []byte) (string, error) {
	stackStorePath := path.Join(ComposeStorePath, stackIdentifier)
	err := service.createDirectoryInStore(stackStorePath)
	if err != nil {
		return "", err
	}

	composeFilePath := path.Join(stackStorePath, fileName)
	r := bytes.NewReader(data)

	err = service.createFileInStore(composeFilePath, r)
	if err != nil {
		return "", err
	}

	return path.Join(service.fileStorePath, stackStorePath), nil
}

// StoreRegistryManagementFileFromBytes creates a subfolder in the
// ExtensionRegistryManagementStorePath and stores a new file from bytes.
// It returns the path to the folder where the file is stored.
func (service *Service) StoreRegistryManagementFileFromBytes(folder, fileName string, data []byte) (string, error) {
	extensionStorePath := path.Join(ExtensionRegistryManagementStorePath, folder)
	err := service.createDirectoryInStore(extensionStorePath)
	if err != nil {
		return "", err
	}

	file := path.Join(extensionStorePath, fileName)
	r := bytes.NewReader(data)

	err = service.createFileInStore(file, r)
	if err != nil {
		return "", err
	}

	return path.Join(service.fileStorePath, file), nil
}

// StoreTLSFileFromBytes creates a folder in the TLSStorePath and stores a new file from bytes.
// It returns the path to the newly created file.
func (service *Service) StoreTLSFileFromBytes(folder string, fileType portainer.TLSFileType, data []byte) (string, error) {
	storePath := path.Join(TLSStorePath, folder)
	err := service.createDirectoryInStore(storePath)
	if err != nil {
		return "", err
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
		return "", portainer.ErrUndefinedTLSFileType
	}

	tlsFilePath := path.Join(storePath, fileName)
	r := bytes.NewReader(data)
	err = service.createFileInStore(tlsFilePath, r)
	if err != nil {
		return "", err
	}
	return path.Join(service.fileStorePath, tlsFilePath), nil
}

// GetPathForTLSFile returns the absolute path to a specific TLS file for an endpoint.
func (service *Service) GetPathForTLSFile(folder string, fileType portainer.TLSFileType) (string, error) {
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
	return path.Join(service.fileStorePath, TLSStorePath, folder, fileName), nil
}

// DeleteTLSFiles deletes a folder in the TLS store path.
func (service *Service) DeleteTLSFiles(folder string) error {
	storePath := path.Join(service.fileStorePath, TLSStorePath, folder)
	err := os.RemoveAll(storePath)
	if err != nil {
		return err
	}
	return nil
}

// DeleteTLSFile deletes a specific TLS file from a folder.
func (service *Service) DeleteTLSFile(folder string, fileType portainer.TLSFileType) error {
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

	filePath := path.Join(service.fileStorePath, TLSStorePath, folder, fileName)

	err := os.Remove(filePath)
	if err != nil {
		return err
	}
	return nil
}

// GetFileContent returns the content of a file as bytes.
func (service *Service) GetFileContent(filePath string) ([]byte, error) {
	content, err := ioutil.ReadFile(filePath)
	if err != nil {
		return nil, err
	}

	return content, nil
}

// Rename renames a file or directory
func (service *Service) Rename(oldPath, newPath string) error {
	return os.Rename(oldPath, newPath)
}

// WriteJSONToFile writes JSON to the specified file.
func (service *Service) WriteJSONToFile(path string, content interface{}) error {
	jsonContent, err := json.Marshal(content)
	if err != nil {
		return err
	}

	return ioutil.WriteFile(path, jsonContent, 0644)
}

// FileExists checks for the existence of the specified file.
func (service *Service) FileExists(filePath string) (bool, error) {
	if _, err := os.Stat(filePath); err != nil {
		if os.IsNotExist(err) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

// KeyPairFilesExist checks for the existence of the key files.
func (service *Service) KeyPairFilesExist() (bool, error) {
	privateKeyPath := path.Join(service.dataStorePath, PrivateKeyFile)
	exists, err := service.FileExists(privateKeyPath)
	if err != nil {
		return false, err
	}
	if !exists {
		return false, nil
	}

	publicKeyPath := path.Join(service.dataStorePath, PublicKeyFile)
	exists, err = service.FileExists(publicKeyPath)
	if err != nil {
		return false, err
	}
	if !exists {
		return false, nil
	}

	return true, nil
}

// StoreKeyPair store the specified keys content as PEM files on disk.
func (service *Service) StoreKeyPair(private, public []byte, privatePEMHeader, publicPEMHeader string) error {
	err := service.createPEMFileInStore(private, privatePEMHeader, PrivateKeyFile)
	if err != nil {
		return err
	}

	err = service.createPEMFileInStore(public, publicPEMHeader, PublicKeyFile)
	if err != nil {
		return err
	}

	return nil
}

// LoadKeyPair retrieve the content of both key files on disk.
func (service *Service) LoadKeyPair() ([]byte, []byte, error) {
	privateKey, err := service.getContentFromPEMFile(PrivateKeyFile)
	if err != nil {
		return nil, nil, err
	}

	publicKey, err := service.getContentFromPEMFile(PublicKeyFile)
	if err != nil {
		return nil, nil, err
	}

	return privateKey, publicKey, nil
}

// createDirectoryInStore creates a new directory in the file store
func (service *Service) createDirectoryInStore(name string) error {
	path := path.Join(service.fileStorePath, name)
	return os.MkdirAll(path, 0700)
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

func (service *Service) createPEMFileInStore(content []byte, fileType, filePath string) error {
	path := path.Join(service.fileStorePath, filePath)
	block := &pem.Block{Type: fileType, Bytes: content}

	out, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0600)
	if err != nil {
		return err
	}
	defer out.Close()

	err = pem.Encode(out, block)
	if err != nil {
		return err
	}

	return nil
}

func (service *Service) getContentFromPEMFile(filePath string) ([]byte, error) {
	path := path.Join(service.fileStorePath, filePath)

	fileContent, err := ioutil.ReadFile(path)
	if err != nil {
		return nil, err
	}

	block, _ := pem.Decode(fileContent)
	return block.Bytes, nil
}

// GetScheduleFolder returns the absolute path on the filesystem for a schedule based
// on its identifier.
func (service *Service) GetScheduleFolder(identifier string) string {
	return path.Join(service.fileStorePath, ScheduleStorePath, identifier)
}

// StoreScheduledJobFileFromBytes creates a subfolder in the ScheduleStorePath and stores a new file from bytes.
// It returns the path to the folder where the file is stored.
func (service *Service) StoreScheduledJobFileFromBytes(identifier string, data []byte) (string, error) {
	scheduleStorePath := path.Join(ScheduleStorePath, identifier)
	err := service.createDirectoryInStore(scheduleStorePath)
	if err != nil {
		return "", err
	}

	filePath := path.Join(scheduleStorePath, createScheduledJobFileName(identifier))
	r := bytes.NewReader(data)
	err = service.createFileInStore(filePath, r)
	if err != nil {
		return "", err
	}

	return path.Join(service.fileStorePath, filePath), nil
}

func createScheduledJobFileName(identifier string) string {
	return "job_" + identifier + ".sh"
}
