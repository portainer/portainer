package password

import (
	"os"

	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"

	"github.com/sethvargo/go-password/password"
)

const passwordFile = ".pwd"

type service struct {
	cryptoService portainer.CryptoService
	fileService   portainer.FileService
}

// GeneratePassword generates a password and stores it in the filesystem, return a hash of the password
func GeneratePassword(cryptoService portainer.CryptoService, fileService portainer.FileService) (string, error) {
	pw := service{
		cryptoService: cryptoService,
		fileService:   fileService,
	}

	hash, err := pw.getHashFromPasswordFile()
	if err == nil {
		return hash, nil
	}

	return pw.generatePassword()
}

func (pw *service) getHashFromPasswordFile() (string, error) {

	if !pw.checkPasswordFile() {
		return "", errors.New("password file does not exist")
	}

	pwd, err := pw.loadPassword()
	if err != nil {
		return "", errors.Wrap(err, "failed to load password")
	}

	return pw.cryptoService.Hash(string(pwd))
}

func (pw *service) generatePassword() (string, error) {
	pwd, err := password.Generate(16, 4, 4, false, false)
	if err != nil {
		return "", err
	}

	hash, err := pw.cryptoService.Hash(pwd)
	if err != nil {
		return "", errors.Wrap(err, "failed to hash password")
	}

	pw.savePassword(pwd)

	pw.fileService.WriteToFile(passwordFile, []byte(hash))

	return hash, nil
}

func (pw *service) savePassword(pwd string) error {
	return pw.fileService.WriteToFile(passwordFile, []byte(pwd))
}

func (pw *service) loadPassword() ([]byte, error) {
	return pw.fileService.GetFileContent("", passwordFile)
}

func (pw *service) checkPasswordFile() bool {
	_, err := pw.fileService.FileExists(passwordFile)
	return !os.IsNotExist(err)
}
