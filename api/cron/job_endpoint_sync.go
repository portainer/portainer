package cron

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"strings"

	"github.com/portainer/portainer/api"
)

// EndpointSyncJobRunner is used to run a EndpointSyncJob
type EndpointSyncJobRunner struct {
	schedule *portainer.Schedule
	context  *EndpointSyncJobContext
}

// EndpointSyncJobContext represents the context of execution of a EndpointSyncJob
type EndpointSyncJobContext struct {
	endpointService  portainer.EndpointService
	endpointFilePath string
}

// NewEndpointSyncJobContext returns a new context that can be used to execute a EndpointSyncJob
func NewEndpointSyncJobContext(endpointService portainer.EndpointService, endpointFilePath string) *EndpointSyncJobContext {
	return &EndpointSyncJobContext{
		endpointService:  endpointService,
		endpointFilePath: endpointFilePath,
	}
}

// NewEndpointSyncJobRunner returns a new runner that can be scheduled
func NewEndpointSyncJobRunner(schedule *portainer.Schedule, context *EndpointSyncJobContext) *EndpointSyncJobRunner {
	return &EndpointSyncJobRunner{
		schedule: schedule,
		context:  context,
	}
}

type synchronization struct {
	endpointsToCreate []*portainer.Endpoint
	endpointsToUpdate []*portainer.Endpoint
	endpointsToDelete []*portainer.Endpoint
}

type fileEndpoint struct {
	Name          string `json:"Name"`
	URL           string `json:"URL"`
	TLS           bool   `json:"TLS,omitempty"`
	TLSSkipVerify bool   `json:"TLSSkipVerify,omitempty"`
	TLSCACert     string `json:"TLSCACert,omitempty"`
	TLSCert       string `json:"TLSCert,omitempty"`
	TLSKey        string `json:"TLSKey,omitempty"`
}

// GetSchedule returns the schedule associated to the runner
func (runner *EndpointSyncJobRunner) GetSchedule() *portainer.Schedule {
	return runner.schedule
}

// Run triggers the execution of the endpoint synchronization process.
func (runner *EndpointSyncJobRunner) Run() {
	data, err := ioutil.ReadFile(runner.context.endpointFilePath)
	if endpointSyncError(err) {
		return
	}

	var fileEndpoints []fileEndpoint
	err = json.Unmarshal(data, &fileEndpoints)
	if endpointSyncError(err) {
		return
	}

	if len(fileEndpoints) == 0 {
		log.Println("background job error (endpoint synchronization). External endpoint source is empty")
		return
	}

	storedEndpoints, err := runner.context.endpointService.Endpoints()
	if endpointSyncError(err) {
		return
	}

	convertedFileEndpoints := convertFileEndpoints(fileEndpoints)

	sync := prepareSyncData(storedEndpoints, convertedFileEndpoints)
	if sync.requireSync() {
		err = runner.context.endpointService.Synchronize(sync.endpointsToCreate, sync.endpointsToUpdate, sync.endpointsToDelete)
		if endpointSyncError(err) {
			return
		}
		log.Printf("Endpoint synchronization ended. [created: %v] [updated: %v] [deleted: %v]", len(sync.endpointsToCreate), len(sync.endpointsToUpdate), len(sync.endpointsToDelete))
	}
}

func endpointSyncError(err error) bool {
	if err != nil {
		log.Printf("background job error (endpoint synchronization). Unable to synchronize endpoints (err=%s)\n", err)
		return true
	}
	return false
}

func isValidEndpoint(endpoint *portainer.Endpoint) bool {
	if endpoint.Name != "" && endpoint.URL != "" {
		if !strings.HasPrefix(endpoint.URL, "unix://") && !strings.HasPrefix(endpoint.URL, "tcp://") {
			return false
		}
		return true
	}
	return false
}

func convertFileEndpoints(fileEndpoints []fileEndpoint) []portainer.Endpoint {
	convertedEndpoints := make([]portainer.Endpoint, 0)

	for _, e := range fileEndpoints {
		endpoint := portainer.Endpoint{
			Name:      e.Name,
			URL:       e.URL,
			TLSConfig: portainer.TLSConfiguration{},
		}
		if e.TLS {
			endpoint.TLSConfig.TLS = true
			endpoint.TLSConfig.TLSSkipVerify = e.TLSSkipVerify
			endpoint.TLSConfig.TLSCACertPath = e.TLSCACert
			endpoint.TLSConfig.TLSCertPath = e.TLSCert
			endpoint.TLSConfig.TLSKeyPath = e.TLSKey
		}
		convertedEndpoints = append(convertedEndpoints, endpoint)
	}

	return convertedEndpoints
}

func endpointExists(endpoint *portainer.Endpoint, endpoints []portainer.Endpoint) int {
	for idx, v := range endpoints {
		if endpoint.Name == v.Name && isValidEndpoint(&v) {
			return idx
		}
	}
	return -1
}

func mergeEndpointIfRequired(original, updated *portainer.Endpoint) *portainer.Endpoint {
	var endpoint *portainer.Endpoint
	if original.URL != updated.URL || original.TLSConfig.TLS != updated.TLSConfig.TLS ||
		(updated.TLSConfig.TLS && original.TLSConfig.TLSSkipVerify != updated.TLSConfig.TLSSkipVerify) ||
		(updated.TLSConfig.TLS && original.TLSConfig.TLSCACertPath != updated.TLSConfig.TLSCACertPath) ||
		(updated.TLSConfig.TLS && original.TLSConfig.TLSCertPath != updated.TLSConfig.TLSCertPath) ||
		(updated.TLSConfig.TLS && original.TLSConfig.TLSKeyPath != updated.TLSConfig.TLSKeyPath) {
		endpoint = original
		endpoint.URL = updated.URL
		if updated.TLSConfig.TLS {
			endpoint.TLSConfig.TLS = true
			endpoint.TLSConfig.TLSSkipVerify = updated.TLSConfig.TLSSkipVerify
			endpoint.TLSConfig.TLSCACertPath = updated.TLSConfig.TLSCACertPath
			endpoint.TLSConfig.TLSCertPath = updated.TLSConfig.TLSCertPath
			endpoint.TLSConfig.TLSKeyPath = updated.TLSConfig.TLSKeyPath
		} else {
			endpoint.TLSConfig.TLS = false
			endpoint.TLSConfig.TLSSkipVerify = false
			endpoint.TLSConfig.TLSCACertPath = ""
			endpoint.TLSConfig.TLSCertPath = ""
			endpoint.TLSConfig.TLSKeyPath = ""
		}
	}
	return endpoint
}

func (sync synchronization) requireSync() bool {
	if len(sync.endpointsToCreate) != 0 || len(sync.endpointsToUpdate) != 0 || len(sync.endpointsToDelete) != 0 {
		return true
	}
	return false
}

func prepareSyncData(storedEndpoints, fileEndpoints []portainer.Endpoint) *synchronization {
	endpointsToCreate := make([]*portainer.Endpoint, 0)
	endpointsToUpdate := make([]*portainer.Endpoint, 0)
	endpointsToDelete := make([]*portainer.Endpoint, 0)

	for idx := range storedEndpoints {
		fidx := endpointExists(&storedEndpoints[idx], fileEndpoints)
		if fidx != -1 {
			endpoint := mergeEndpointIfRequired(&storedEndpoints[idx], &fileEndpoints[fidx])
			if endpoint != nil {
				log.Printf("New definition for a stored endpoint found in file, updating database. [name: %v] [url: %v]\n", endpoint.Name, endpoint.URL)
				endpointsToUpdate = append(endpointsToUpdate, endpoint)
			}
		} else {
			log.Printf("Stored endpoint not found in file (definition might be invalid), removing from database. [name: %v] [url: %v]", storedEndpoints[idx].Name, storedEndpoints[idx].URL)
			endpointsToDelete = append(endpointsToDelete, &storedEndpoints[idx])
		}
	}

	for idx, endpoint := range fileEndpoints {
		if !isValidEndpoint(&endpoint) {
			log.Printf("Invalid file endpoint definition, skipping. [name: %v] [url: %v]", endpoint.Name, endpoint.URL)
			continue
		}
		sidx := endpointExists(&fileEndpoints[idx], storedEndpoints)
		if sidx == -1 {
			log.Printf("File endpoint not found in database, adding to database. [name: %v] [url: %v]", fileEndpoints[idx].Name, fileEndpoints[idx].URL)
			endpointsToCreate = append(endpointsToCreate, &fileEndpoints[idx])
		}
	}

	return &synchronization{
		endpointsToCreate: endpointsToCreate,
		endpointsToUpdate: endpointsToUpdate,
		endpointsToDelete: endpointsToDelete,
	}
}
