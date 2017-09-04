package cron

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"os"
	"strings"

	"github.com/portainer/portainer"
)

type (
	endpointSyncJob struct {
		logger           *log.Logger
		endpointService  portainer.EndpointService
		endpointFilePath string
	}

	synchronization struct {
		endpointsToCreate []*portainer.Endpoint
		endpointsToUpdate []*portainer.Endpoint
		endpointsToDelete []*portainer.Endpoint
	}

	fileEndpoint struct {
		Name      string `json:"Name"`
		URL       string `json:"URL"`
		TLS       bool   `json:"TLS,omitempty"`
		TLSCACert string `json:"TLSCACert,omitempty"`
		TLSCert   string `json:"TLSCert,omitempty"`
		TLSKey    string `json:"TLSKey,omitempty"`
	}
)

const (
	// ErrEmptyEndpointArray is an error raised when the external endpoint source array is empty.
	ErrEmptyEndpointArray = portainer.Error("External endpoint source is empty")
)

func newEndpointSyncJob(endpointFilePath string, endpointService portainer.EndpointService) endpointSyncJob {
	return endpointSyncJob{
		logger:           log.New(os.Stderr, "", log.LstdFlags),
		endpointService:  endpointService,
		endpointFilePath: endpointFilePath,
	}
}

func endpointSyncError(err error, logger *log.Logger) bool {
	if err != nil {
		logger.Printf("Endpoint synchronization error: %s", err)
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
			endpoint.TLSConfig.TLSSkipVerify = false
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
		(updated.TLSConfig.TLS && original.TLSConfig.TLSCACertPath != updated.TLSConfig.TLSCACertPath) ||
		(updated.TLSConfig.TLS && original.TLSConfig.TLSCertPath != updated.TLSConfig.TLSCertPath) ||
		(updated.TLSConfig.TLS && original.TLSConfig.TLSKeyPath != updated.TLSConfig.TLSKeyPath) {
		endpoint = original
		endpoint.URL = updated.URL
		if updated.TLSConfig.TLS {
			endpoint.TLSConfig.TLS = true
			endpoint.TLSConfig.TLSCACertPath = updated.TLSConfig.TLSCACertPath
			endpoint.TLSConfig.TLSCertPath = updated.TLSConfig.TLSCertPath
			endpoint.TLSConfig.TLSKeyPath = updated.TLSConfig.TLSKeyPath
		} else {
			endpoint.TLSConfig.TLS = false
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

// TMP: endpointSyncJob method to access logger, should be generic
func (job endpointSyncJob) prepareSyncData(storedEndpoints, fileEndpoints []portainer.Endpoint) *synchronization {
	endpointsToCreate := make([]*portainer.Endpoint, 0)
	endpointsToUpdate := make([]*portainer.Endpoint, 0)
	endpointsToDelete := make([]*portainer.Endpoint, 0)

	for idx := range storedEndpoints {
		fidx := endpointExists(&storedEndpoints[idx], fileEndpoints)
		if fidx != -1 {
			endpoint := mergeEndpointIfRequired(&storedEndpoints[idx], &fileEndpoints[fidx])
			if endpoint != nil {
				job.logger.Printf("New definition for a stored endpoint found in file, updating database. [name: %v] [url: %v]\n", endpoint.Name, endpoint.URL)
				endpointsToUpdate = append(endpointsToUpdate, endpoint)
			} else {
				job.logger.Printf("No change detected for a stored endpoint. [name: %v] [url: %v]\n", storedEndpoints[idx].Name, storedEndpoints[idx].URL)
			}
		} else {
			job.logger.Printf("Stored endpoint not found in file (definition might be invalid), removing from database. [name: %v] [url: %v]", storedEndpoints[idx].Name, storedEndpoints[idx].URL)
			endpointsToDelete = append(endpointsToDelete, &storedEndpoints[idx])
		}
	}

	for idx, endpoint := range fileEndpoints {
		if !isValidEndpoint(&endpoint) {
			job.logger.Printf("Invalid file endpoint definition, skipping. [name: %v] [url: %v]", endpoint.Name, endpoint.URL)
			continue
		}
		sidx := endpointExists(&fileEndpoints[idx], storedEndpoints)
		if sidx == -1 {
			job.logger.Printf("File endpoint not found in database, adding to database. [name: %v] [url: %v]", fileEndpoints[idx].Name, fileEndpoints[idx].URL)
			endpointsToCreate = append(endpointsToCreate, &fileEndpoints[idx])
		}
	}

	return &synchronization{
		endpointsToCreate: endpointsToCreate,
		endpointsToUpdate: endpointsToUpdate,
		endpointsToDelete: endpointsToDelete,
	}
}

func (job endpointSyncJob) Sync() error {
	data, err := ioutil.ReadFile(job.endpointFilePath)
	if endpointSyncError(err, job.logger) {
		return err
	}

	var fileEndpoints []fileEndpoint
	err = json.Unmarshal(data, &fileEndpoints)
	if endpointSyncError(err, job.logger) {
		return err
	}

	if len(fileEndpoints) == 0 {
		return ErrEmptyEndpointArray
	}

	storedEndpoints, err := job.endpointService.Endpoints()
	if endpointSyncError(err, job.logger) {
		return err
	}

	convertedFileEndpoints := convertFileEndpoints(fileEndpoints)

	sync := job.prepareSyncData(storedEndpoints, convertedFileEndpoints)
	if sync.requireSync() {
		err = job.endpointService.Synchronize(sync.endpointsToCreate, sync.endpointsToUpdate, sync.endpointsToDelete)
		if endpointSyncError(err, job.logger) {
			return err
		}
		job.logger.Printf("Endpoint synchronization ended. [created: %v] [updated: %v] [deleted: %v]", len(sync.endpointsToCreate), len(sync.endpointsToUpdate), len(sync.endpointsToDelete))
	}
	return nil
}

func (job endpointSyncJob) Run() {
	job.logger.Println("Endpoint synchronization job started.")
	err := job.Sync()
	endpointSyncError(err, job.logger)
}
