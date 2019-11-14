package exec

import (
	"bytes"
	"encoding/json"
	"errors"
	"log"
	"os/exec"
	"path"
	"runtime"
	"strconv"
	"strings"
	"time"

	"github.com/coreos/go-semver/semver"

	"github.com/orcaman/concurrent-map"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/client"
)

var extensionDownloadBaseURL = "https://portainer-io-assets.sfo2.digitaloceanspaces.com/extensions/"

var extensionBinaryMap = map[portainer.ExtensionID]string{
	portainer.RegistryManagementExtension:  "extension-registry-management",
	portainer.OAuthAuthenticationExtension: "extension-oauth-authentication",
	portainer.RBACExtension:                "extension-rbac",
}

// ExtensionManager represents a service used to
// manage extension processes.
type ExtensionManager struct {
	processes        cmap.ConcurrentMap
	fileService      portainer.FileService
	extensionService portainer.ExtensionService
}

// NewExtensionManager returns a pointer to an ExtensionManager
func NewExtensionManager(fileService portainer.FileService, extensionService portainer.ExtensionService) *ExtensionManager {
	return &ExtensionManager{
		processes:        cmap.New(),
		fileService:      fileService,
		extensionService: extensionService,
	}
}

func processKey(ID portainer.ExtensionID) string {
	return strconv.Itoa(int(ID))
}

func buildExtensionURL(extension *portainer.Extension) string {
	extensionURL := extensionDownloadBaseURL
	extensionURL += extensionBinaryMap[extension.ID]
	extensionURL += "-" + runtime.GOOS + "-" + runtime.GOARCH
	extensionURL += "-" + extension.Version
	extensionURL += ".zip"
	return extensionURL
}

func buildExtensionPath(binaryPath string, extension *portainer.Extension) string {

	extensionFilename := extensionBinaryMap[extension.ID]
	extensionFilename += "-" + runtime.GOOS + "-" + runtime.GOARCH
	extensionFilename += "-" + extension.Version

	if runtime.GOOS == "windows" {
		extensionFilename += ".exe"
	}

	extensionPath := path.Join(
		binaryPath,
		extensionFilename)

	return extensionPath
}

// FetchExtensionDefinitions will fetch the list of available
// extension definitions from the official Portainer assets server
func (manager *ExtensionManager) FetchExtensionDefinitions() ([]portainer.Extension, error) {
	extensionData, err := client.Get(portainer.ExtensionDefinitionsURL, 30)
	if err != nil {
		return nil, err
	}

	var extensions []portainer.Extension
	err = json.Unmarshal(extensionData, &extensions)
	if err != nil {
		return nil, err
	}

	return extensions, nil
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
	extensions, err := manager.extensionService.Extensions()
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

				err := manager.extensionService.Persist(&extension)
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
		return nil, errors.New("Invalid extension license key")
	}

	output := string(cmdOutput.Bytes())

	return strings.Split(output, "|"), nil
}

func (manager *ExtensionManager) startExtensionProcess(extension *portainer.Extension, binaryPath string) error {
	extensionProcess := exec.Command(binaryPath, "-license", extension.License.LicenseKey)
	err := extensionProcess.Start()
	if err != nil {
		return err
	}

	time.Sleep(3 * time.Second)

	manager.processes.Set(processKey(extension.ID), extensionProcess)
	return nil
}
