package exec

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path"
	"regexp"
	"runtime"
	"strconv"
	"strings"
	"time"

	"github.com/coreos/go-semver/semver"

	"github.com/orcaman/concurrent-map"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/client"
)

var extensionDownloadBaseURL = portainer.AssetsServerURL + "/extensions/"
var extensionVersionRegexp = regexp.MustCompile(`\d+(\.\d+)+`)

var extensionBinaryMap = map[portainer.ExtensionID]string{}

// ExtensionManager represents a service used to
// manage extension processes.
type ExtensionManager struct {
	processes   cmap.ConcurrentMap
	fileService portainer.FileService
	dataStore   portainer.DataStore
}

// NewExtensionManager returns a pointer to an ExtensionManager
func NewExtensionManager(fileService portainer.FileService, dataStore portainer.DataStore) *ExtensionManager {
	return &ExtensionManager{
		processes:   cmap.New(),
		fileService: fileService,
		dataStore:   dataStore,
	}
}

func processKey(ID portainer.ExtensionID) string {
	return strconv.Itoa(int(ID))
}

func buildExtensionURL(extension *portainer.Extension) string {
	return fmt.Sprintf("%s%s-%s-%s-%s.zip", extensionDownloadBaseURL, extensionBinaryMap[extension.ID], runtime.GOOS, runtime.GOARCH, extension.Version)
}

func buildExtensionPath(binaryPath string, extension *portainer.Extension) string {
	extensionFilename := fmt.Sprintf("%s-%s-%s-%s", extensionBinaryMap[extension.ID], runtime.GOOS, runtime.GOARCH, extension.Version)
	if runtime.GOOS == "windows" {
		extensionFilename += ".exe"
	}

	extensionPath := path.Join(
		binaryPath,
		extensionFilename)

	return extensionPath
}

// FetchExtensionDefinitions will fetch the list of available
// extension definitions from the official Portainer assets server.
// If it cannot retrieve the data from the Internet it will fallback to the locally cached
// manifest file.
func (manager *ExtensionManager) FetchExtensionDefinitions() ([]portainer.Extension, error) {
	var extensionData []byte

	extensionData, err := client.Get(portainer.ExtensionDefinitionsURL, 5)
	if err != nil {
		log.Printf("[WARN] [exec,extensions] [message: unable to retrieve extensions manifest via Internet. Extensions will be retrieved from local cache and might not be up to date] [err: %s]", err)

		extensionData, err = manager.fileService.GetFileContent(portainer.LocalExtensionManifestFile)
		if err != nil {
			return nil, err
		}
	}

	var extensions []portainer.Extension
	err = json.Unmarshal(extensionData, &extensions)
	if err != nil {
		return nil, err
	}

	return extensions, nil
}

// InstallExtension will install the extension from an archive. It will extract the extension version number from
// the archive file name first and return an error if the file name is not valid (cannot find extension version).
// It will then extract the archive and execute the EnableExtension function to enable the extension.
// Since we're missing information about this extension (stored on Portainer.io server) we need to assume
// default information based on the extension ID.
func (manager *ExtensionManager) InstallExtension(extension *portainer.Extension, licenseKey string, archiveFileName string, extensionArchive []byte) error {
	extensionVersion := extensionVersionRegexp.FindString(archiveFileName)
	if extensionVersion == "" {
		return errors.New("invalid extension archive filename: unable to retrieve extension version")
	}

	err := manager.fileService.ExtractExtensionArchive(extensionArchive)
	if err != nil {
		return err
	}

	extension.ShortDescription = "Extension enabled offline"
	extension.Version = extensionVersion
	extension.Available = true

	return manager.EnableExtension(extension, licenseKey)
}

// EnableExtension will check for the existence of the extension binary on the filesystem
// first. If it does not exist, it will download it from the official Portainer assets server.
// After installing the binary on the filesystem, it will execute the binary in license check
// mode to validate the extension license. If the license is valid, it will then start
// the extension process and register it in the processes map.
func (manager *ExtensionManager) EnableExtension(extension *portainer.Extension, licenseKey string) error {
	extensionBinaryPath := buildExtensionPath(manager.fileService.GetBinaryFolder(), extension)
	extensionBinaryExists, err := manager.fileService.FileExists(extensionBinaryPath)
	if err != nil {
		return err
	}

	if !extensionBinaryExists {
		err := manager.downloadExtension(extension)
		if err != nil {
			return err
		}
	}

	licenseDetails, err := validateLicense(extensionBinaryPath, licenseKey)
	if err != nil {
		return err
	}

	extension.License = portainer.LicenseInformation{
		LicenseKey: licenseKey,
		Company:    licenseDetails[0],
		Expiration: licenseDetails[1],
		Valid:      true,
	}
	extension.Version = licenseDetails[2]

	return manager.startExtensionProcess(extension, extensionBinaryPath)
}

// DisableExtension will retrieve the process associated to the extension
// from the processes map and kill the process. It will then remove the process
// from the processes map and remove the binary associated to the extension
// from the filesystem
func (manager *ExtensionManager) DisableExtension(extension *portainer.Extension) error {
	process, ok := manager.processes.Get(processKey(extension.ID))
	if !ok {
		return nil
	}

	err := process.(*exec.Cmd).Process.Kill()
	if err != nil {
		return err
	}

	manager.processes.Remove(processKey(extension.ID))

	extensionBinaryPath := buildExtensionPath(manager.fileService.GetBinaryFolder(), extension)
	return manager.fileService.RemoveDirectory(extensionBinaryPath)
}

// StartExtensions will retrieve the extensions definitions from the Internet and check if a new version of each
// extension is available. If so, it will automatically install the new version of the extension. If no update is
// available it will simply start the extension.
// The purpose of this function is to be ran at startup, as such most of the error handling won't block the program execution
// and will log warning messages instead.
func (manager *ExtensionManager) StartExtensions() error {
	extensions, err := manager.dataStore.Extension().Extensions()
	if err != nil {
		return err
	}

	definitions, err := manager.FetchExtensionDefinitions()
	if err != nil {
		log.Printf("[WARN] [exec,extensions] [message: unable to retrieve extension information from Internet. Skipping extensions update check.] [err: %s]", err)
		return nil
	}

	return manager.updateAndStartExtensions(extensions, definitions)
}

func (manager *ExtensionManager) updateAndStartExtensions(extensions []portainer.Extension, definitions []portainer.Extension) error {
	for _, definition := range definitions {
		for _, extension := range extensions {
			if extension.ID == definition.ID {
				definitionVersion := semver.New(definition.Version)
				extensionVersion := semver.New(extension.Version)

				if extensionVersion.LessThan(*definitionVersion) {
					log.Printf("[INFO] [exec,extensions] [message: new version detected, updating extension] [extension: %s] [current_version: %s] [available_version: %s]", extension.Name, extension.Version, definition.Version)
					err := manager.UpdateExtension(&extension, definition.Version)
					if err != nil {
						log.Printf("[WARN] [exec,extensions] [message: unable to update extension automatically] [extension: %s] [current_version: %s] [available_version: %s] [err: %s]", extension.Name, extension.Version, definition.Version, err)
					}
				} else {
					err := manager.EnableExtension(&extension, extension.License.LicenseKey)
					if err != nil {
						log.Printf("[WARN] [exec,extensions] [message: unable to start extension] [extension: %s] [err: %s]", extension.Name, err)
						extension.Enabled = false
						extension.License.Valid = false
					}
				}

				err := manager.dataStore.Extension().Persist(&extension)
				if err != nil {
					return err
				}

				break
			}
		}
	}

	return nil
}

// UpdateExtension will download the new extension binary from the official Portainer assets
// server, disable the previous extension via DisableExtension, trigger a license check
// and then start the extension process and add it to the processes map
func (manager *ExtensionManager) UpdateExtension(extension *portainer.Extension, version string) error {
	oldVersion := extension.Version

	extension.Version = version
	err := manager.downloadExtension(extension)
	if err != nil {
		return err
	}

	extension.Version = oldVersion
	err = manager.DisableExtension(extension)
	if err != nil {
		return err
	}

	extension.Version = version
	extensionBinaryPath := buildExtensionPath(manager.fileService.GetBinaryFolder(), extension)

	licenseDetails, err := validateLicense(extensionBinaryPath, extension.License.LicenseKey)
	if err != nil {
		return err
	}

	extension.Version = licenseDetails[2]

	return manager.startExtensionProcess(extension, extensionBinaryPath)
}

func (manager *ExtensionManager) downloadExtension(extension *portainer.Extension) error {
	extensionURL := buildExtensionURL(extension)

	data, err := client.Get(extensionURL, 30)
	if err != nil {
		return err
	}

	return manager.fileService.ExtractExtensionArchive(data)
}

func validateLicense(binaryPath, licenseKey string) ([]string, error) {
	licenseCheckProcess := exec.Command(binaryPath, "-license", licenseKey, "-check")
	cmdOutput := &bytes.Buffer{}
	licenseCheckProcess.Stdout = cmdOutput

	err := licenseCheckProcess.Run()
	if err != nil {
		log.Printf("[DEBUG] [exec,extension] [message: unable to run extension process] [err: %s]", err)
		return nil, errors.New("invalid extension license key")
	}

	output := string(cmdOutput.Bytes())

	return strings.Split(output, "|"), nil
}

func (manager *ExtensionManager) startExtensionProcess(extension *portainer.Extension, binaryPath string) error {
	extensionProcess := exec.Command(binaryPath, "-license", extension.License.LicenseKey)
	extensionProcess.Stdout = os.Stdout
	extensionProcess.Stderr = os.Stderr

	err := extensionProcess.Start()
	if err != nil {
		log.Printf("[DEBUG] [exec,extension] [message: unable to start extension process] [err: %s]", err)
		return err
	}

	time.Sleep(3 * time.Second)

	manager.processes.Set(processKey(extension.ID), extensionProcess)
	return nil
}
