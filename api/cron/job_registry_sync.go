package cron

import (
	"encoding/json"
	"io/ioutil"
	"log"

	"github.com/portainer/portainer"
)

// RegistrySyncJobRunner is used to run a RegistrySyncJob
type RegistrySyncJobRunner struct {
	schedule *portainer.Schedule
	context  *RegistrySyncJobContext
}

// RegistrySyncJobContext represents the context of execution of a RegistrySyncJob
type RegistrySyncJobContext struct {
	registryService  portainer.RegistryService
	registryFilePath string
}

// NewRegistrySyncJobContext returns a new context that can be used to execute a RegistrySyncJob
func NewRegistrySyncJobContext(registryService portainer.RegistryService, registryFilePath string) *RegistrySyncJobContext {
	return &RegistrySyncJobContext{
		registryService:  registryService,
		registryFilePath: registryFilePath,
	}
}

// NewRegistrySyncJobRunner returns a new runner that can be scheduled
func NewRegistrySyncJobRunner(schedule *portainer.Schedule, context *RegistrySyncJobContext) *RegistrySyncJobRunner {
	return &RegistrySyncJobRunner{
		schedule: schedule,
		context:  context,
	}
}

type registrySynchronization struct {
	registrysToCreate []*portainer.Registry
	registrysToUpdate []*portainer.Registry
	registrysToDelete []*portainer.Registry
}

type fileRegistry struct {
	Type     string `json:"Type"`
	Name     string `json:"Name"`
	URL      string `json:"URL"`
	Username string `json:"Username,omitempty"`
	Password string `json:"Password,omitempty"`
}

// GetSchedule returns the schedule associated to the runner
func (runner *RegistrySyncJobRunner) GetSchedule() *portainer.Schedule {
	return runner.schedule
}

// Run triggers the execution of the registry synchronization process.
func (runner *RegistrySyncJobRunner) Run() {
	log.Printf("Registry sync")

	data, err := ioutil.ReadFile(runner.context.registryFilePath)
	if registrySyncError(err) {
		return
	}

	var fileRegistrys []fileRegistry
	err = json.Unmarshal(data, &fileRegistrys)
	if registrySyncError(err) {
		return
	}

	if len(fileRegistrys) == 0 {
		log.Println("background job error (registry synchronization). External registry source is empty")
		return
	}

	storedRegistrys, err := runner.context.registryService.Registries()
	if registrySyncError(err) {
		return
	}

	convertedFileRegistrys := convertFileRegistrys(fileRegistrys)

	sync := prepareRegistrySyncData(storedRegistrys, convertedFileRegistrys)
	if sync.requireSync() {
		err = runner.context.registryService.Synchronize(sync.registrysToCreate, sync.registrysToUpdate, sync.registrysToDelete)
		if registrySyncError(err) {
			return
		}
		log.Printf("Registry synchronization ended. [created: %v] [updated: %v] [deleted: %v]", len(sync.registrysToCreate), len(sync.registrysToUpdate), len(sync.registrysToDelete))
	}
}

func registrySyncError(err error) bool {
	if err != nil {
		log.Printf("background job error (registry synchronization). Unable to synchronize registrys (err=%s)\n", err)
		return true
	}
	return false
}

func isValidRegistry(registry *portainer.Registry) bool {
	if registry.Name != "" && registry.URL != "" {
		return true
	}
	return false
}

func convertFileRegistrys(fileRegistrys []fileRegistry) []portainer.Registry {
	convertedRegistrys := make([]portainer.Registry, 0)

	for _, e := range fileRegistrys {
		registry := portainer.Registry{
			Type:     portainer.CustomRegistry,
			Name:     e.Name,
			URL:      e.URL,
			Username: e.Username,
			Password: e.Password,
		}
		registry.Authentication = registry.Username != ""
		convertedRegistrys = append(convertedRegistrys, registry)
	}

	return convertedRegistrys
}

func registryExists(registry *portainer.Registry, registrys []portainer.Registry) int {
	for idx, v := range registrys {
		if registry.Name == v.Name && isValidRegistry(&v) {
			return idx
		}
	}
	return -1
}

func mergeRegistryIfRequired(original, updated *portainer.Registry) *portainer.Registry {
	var registry *portainer.Registry
	if original.URL != updated.URL || original.Username != updated.Username ||
		updated.Password != original.Password || original.Authentication != updated.Authentication {
		registry = original
		registry.URL = updated.URL
		registry.Username = updated.Username
		registry.Password = updated.Password
		registry.Authentication = updated.Authentication
	}
	return registry
}

func (sync registrySynchronization) requireSync() bool {
	if len(sync.registrysToCreate) != 0 || len(sync.registrysToUpdate) != 0 || len(sync.registrysToDelete) != 0 {
		return true
	}
	return false
}

func prepareRegistrySyncData(storedRegistrys, fileRegistrys []portainer.Registry) *registrySynchronization {
	registrysToCreate := make([]*portainer.Registry, 0)
	registrysToUpdate := make([]*portainer.Registry, 0)
	registrysToDelete := make([]*portainer.Registry, 0)

	for idx := range storedRegistrys {
		fidx := registryExists(&storedRegistrys[idx], fileRegistrys)
		if fidx != -1 {
			registry := mergeRegistryIfRequired(&storedRegistrys[idx], &fileRegistrys[fidx])
			if registry != nil {
				log.Printf("New definition for a stored registry found in file, updating database. [name: %v] [url: %v]\n", registry.Name, registry.URL)
				registrysToUpdate = append(registrysToUpdate, registry)
			}
		} else {
			log.Printf("Stored registry not found in file (definition might be invalid), removing from database. [name: %v] [url: %v]", storedRegistrys[idx].Name, storedRegistrys[idx].URL)
			registrysToDelete = append(registrysToDelete, &storedRegistrys[idx])
		}
	}

	for idx, registry := range fileRegistrys {
		if !isValidRegistry(&registry) {
			log.Printf("Invalid file registry definition, skipping. [name: %v] [url: %v]", registry.Name, registry.URL)
			continue
		}
		sidx := registryExists(&fileRegistrys[idx], storedRegistrys)
		if sidx == -1 {
			log.Printf("File registry not found in database, adding to database. [name: %v] [url: %v]", fileRegistrys[idx].Name, fileRegistrys[idx].URL)
			registrysToCreate = append(registrysToCreate, &fileRegistrys[idx])
		}
	}

	return &registrySynchronization{
		registrysToCreate: registrysToCreate,
		registrysToUpdate: registrysToUpdate,
		registrysToDelete: registrysToDelete,
	}
}
