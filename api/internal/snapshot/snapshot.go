package snapshot

import (
	"log"
	"time"

	"github.com/portainer/portainer/api"
)

// Service repesents a service to manage system snapshots
type Service struct {
	dataStore                 portainer.DataStore
	refreshSignal             chan struct{}
	snapshotIntervalInSeconds float64
	snapshotter               portainer.Snapshotter
}

// NewService creates a new instance of a service
func NewService(snapshotInterval string, dataStore portainer.DataStore, snapshotter portainer.Snapshotter) (*Service, error) {
	snapshotFrequency, err := time.ParseDuration(snapshotInterval)
	if err != nil {
		return nil, err
	}

	return &Service{
		dataStore:                 dataStore,
		snapshotIntervalInSeconds: snapshotFrequency.Seconds(),
		snapshotter:               snapshotter,
	}, nil
}

// Start starts the service
func (service *Service) Start() {
	if service.refreshSignal != nil {
		return
	}

	service.refreshSignal = make(chan struct{})
	service.startSnapshotLoop()
}

func (service *Service) stop() {
	if service.refreshSignal == nil {
		return
	}

	close(service.refreshSignal)
}

// SetSnapshotInterval sets the snapshot interval and resets the service
func (service *Service) SetSnapshotInterval(snapshotInterval string) error {
	service.stop()

	snapshotFrequency, err := time.ParseDuration(snapshotInterval)
	if err != nil {
		return err
	}
	service.snapshotIntervalInSeconds = snapshotFrequency.Seconds()

	service.Start()

	return nil
}

func (service *Service) startSnapshotLoop() error {
	err := service.takeSnapshot()
	if err != nil {
		return err
	}

	ticker := time.NewTicker(time.Duration(service.snapshotIntervalInSeconds) * time.Second)
	go func() {
		for {
			select {
			case <-ticker.C:
				err := service.takeSnapshot()
				if err != nil {
					log.Printf("[ERROR] [internal,snapshot] [message: background schedule error (endpoint snapshot).] [error: %s]", err)
				}

			case <-service.refreshSignal:
				log.Println("[DEBUG] [internal,snapshot] [message: shutting down Snapshot service]")
				ticker.Stop()
				return
			}
		}
	}()

	return nil
}

func (service *Service) takeSnapshot() error {
	endpoints, err := service.dataStore.Endpoint().Endpoints()
	if err != nil {
		return err
	}

	for _, endpoint := range endpoints {
		if endpoint.Type == portainer.EdgeAgentEnvironment {
			continue
		}

		snapshot, snapshotError := service.snapshotter.CreateSnapshot(&endpoint)

		latestEndpointReference, err := service.dataStore.Endpoint().Endpoint(endpoint.ID)
		if latestEndpointReference == nil {
			log.Printf("background schedule error (endpoint snapshot). Endpoint not found inside the database anymore (endpoint=%s, URL=%s) (err=%s)\n", endpoint.Name, endpoint.URL, err)
			continue
		}

		latestEndpointReference.Status = portainer.EndpointStatusUp
		if snapshotError != nil {
			log.Printf("background schedule error (endpoint snapshot). Unable to create snapshot (endpoint=%s, URL=%s) (err=%s)\n", endpoint.Name, endpoint.URL, snapshotError)
			latestEndpointReference.Status = portainer.EndpointStatusDown
		}

		if snapshot != nil {
			latestEndpointReference.Snapshots = []portainer.Snapshot{*snapshot}
		}

		err = service.dataStore.Endpoint().UpdateEndpoint(latestEndpointReference.ID, latestEndpointReference)
		if err != nil {
			log.Printf("background schedule error (endpoint snapshot). Unable to update endpoint (endpoint=%s, URL=%s) (err=%s)\n", endpoint.Name, endpoint.URL, err)
			continue
		}
	}

	return nil
}
