package snapshot

import (
	"context"
	"crypto/tls"
	"errors"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/agent"
	"github.com/portainer/portainer/api/crypto"
	"github.com/portainer/portainer/api/dataservices"

	"github.com/rs/zerolog/log"
)

// Service repesents a service to manage environment(endpoint) snapshots.
// It provides an interface to start background snapshots as well as
// specific Docker/Kubernetes environment(endpoint) snapshot methods.
type Service struct {
	dataStore                 dataservices.DataStore
	snapshotIntervalCh        chan time.Duration
	snapshotIntervalInSeconds float64
	dockerSnapshotter         portainer.DockerSnapshotter
	kubernetesSnapshotter     portainer.KubernetesSnapshotter
	shutdownCtx               context.Context
}

// NewService creates a new instance of a service
func NewService(snapshotIntervalFromFlag string, dataStore dataservices.DataStore, dockerSnapshotter portainer.DockerSnapshotter, kubernetesSnapshotter portainer.KubernetesSnapshotter, shutdownCtx context.Context) (*Service, error) {
	interval, err := parseSnapshotFrequency(snapshotIntervalFromFlag, dataStore)
	if err != nil {
		return nil, err
	}

	return &Service{
		dataStore:                 dataStore,
		snapshotIntervalCh:        make(chan time.Duration),
		snapshotIntervalInSeconds: interval,
		dockerSnapshotter:         dockerSnapshotter,
		kubernetesSnapshotter:     kubernetesSnapshotter,
		shutdownCtx:               shutdownCtx,
	}, nil
}

func parseSnapshotFrequency(snapshotInterval string, dataStore dataservices.DataStore) (float64, error) {
	if snapshotInterval == "" {
		settings, err := dataStore.Settings().Settings()
		if err != nil {
			return 0, err
		}
		snapshotInterval = settings.SnapshotInterval
		if snapshotInterval == "" {
			snapshotInterval = portainer.DefaultSnapshotInterval
		}
	}
	snapshotFrequency, err := time.ParseDuration(snapshotInterval)
	if err != nil {
		return 0, err
	}
	return snapshotFrequency.Seconds(), nil
}

// Start will start a background routine to execute periodic snapshots of environments(endpoints)
func (service *Service) Start() {
	go service.startSnapshotLoop()
}

// SetSnapshotInterval sets the snapshot interval and resets the service
func (service *Service) SetSnapshotInterval(snapshotInterval string) error {
	interval, err := time.ParseDuration(snapshotInterval)
	if err != nil {
		return err
	}

	service.snapshotIntervalCh <- interval

	return nil
}

// SupportDirectSnapshot checks whether an environment(endpoint) can be used to trigger a direct a snapshot.
// It is mostly true for all environments(endpoints) except Edge and Azure environments(endpoints).
func SupportDirectSnapshot(endpoint *portainer.Endpoint) bool {
	switch endpoint.Type {
	case portainer.EdgeAgentOnDockerEnvironment, portainer.EdgeAgentOnKubernetesEnvironment, portainer.AzureEnvironment:
		return false
	}
	return true
}

// SnapshotEndpoint will create a snapshot of the environment(endpoint) based on the environment(endpoint) type.
// If the snapshot is a success, it will be associated to the environment(endpoint).
func (service *Service) SnapshotEndpoint(endpoint *portainer.Endpoint) error {
	if endpoint.Type == portainer.AgentOnDockerEnvironment || endpoint.Type == portainer.AgentOnKubernetesEnvironment {
		var err error
		var tlsConfig *tls.Config
		if endpoint.TLSConfig.TLS {
			tlsConfig, err = crypto.CreateTLSConfigurationFromDisk(endpoint.TLSConfig.TLSCACertPath, endpoint.TLSConfig.TLSCertPath, endpoint.TLSConfig.TLSKeyPath, endpoint.TLSConfig.TLSSkipVerify)
			if err != nil {
				return err
			}
		}

		_, version, err := agent.GetAgentVersionAndPlatform(endpoint.URL, tlsConfig)
		if err != nil {
			return err
		}

		endpoint.Agent.Version = version
	}

	switch endpoint.Type {
	case portainer.AzureEnvironment:
		return nil
	case portainer.KubernetesLocalEnvironment, portainer.AgentOnKubernetesEnvironment, portainer.EdgeAgentOnKubernetesEnvironment:
		return service.snapshotKubernetesEndpoint(endpoint)
	}

	return service.snapshotDockerEndpoint(endpoint)
}

func (service *Service) Create(snapshot portainer.Snapshot) error {
	return service.dataStore.Snapshot().Create(&snapshot)
}

func (service *Service) FillSnapshotData(endpoint *portainer.Endpoint) error {
	snapshot, err := service.dataStore.Snapshot().Snapshot(endpoint.ID)
	if service.dataStore.IsErrObjectNotFound(err) {
		endpoint.Snapshots = []portainer.DockerSnapshot{}
		endpoint.Kubernetes.Snapshots = []portainer.KubernetesSnapshot{}

		return nil
	}

	if err != nil {
		return err
	}

	if snapshot.Docker != nil {
		endpoint.Snapshots = []portainer.DockerSnapshot{*snapshot.Docker}
	}

	if snapshot.Kubernetes != nil {
		endpoint.Kubernetes.Snapshots = []portainer.KubernetesSnapshot{*snapshot.Kubernetes}
	}

	return nil
}

func (service *Service) snapshotKubernetesEndpoint(endpoint *portainer.Endpoint) error {
	kubernetesSnapshot, err := service.kubernetesSnapshotter.CreateSnapshot(endpoint)
	if err != nil {
		return err
	}

	if kubernetesSnapshot != nil {
		snapshot := &portainer.Snapshot{EndpointID: endpoint.ID, Kubernetes: kubernetesSnapshot}

		return service.dataStore.Snapshot().Create(snapshot)
	}

	return nil
}

func (service *Service) snapshotDockerEndpoint(endpoint *portainer.Endpoint) error {
	dockerSnapshot, err := service.dockerSnapshotter.CreateSnapshot(endpoint)
	if err != nil {
		return err
	}

	if dockerSnapshot != nil {
		snapshot := &portainer.Snapshot{EndpointID: endpoint.ID, Docker: dockerSnapshot}

		return service.dataStore.Snapshot().Create(snapshot)
	}

	return nil
}

func (service *Service) startSnapshotLoop() {
	ticker := time.NewTicker(time.Duration(service.snapshotIntervalInSeconds) * time.Second)

	err := service.snapshotEndpoints()
	if err != nil {
		log.Error().Err(err).Msg("background schedule error (environment snapshot)")
	}

	for {
		select {
		case <-ticker.C:
			err := service.snapshotEndpoints()
			if err != nil {
				log.Error().Err(err).Msg("background schedule error (environment snapshot)")
			}
		case <-service.shutdownCtx.Done():
			log.Debug().Msg("shutting down snapshotting")
			ticker.Stop()
			return
		case interval := <-service.snapshotIntervalCh:
			ticker.Reset(interval)
		}
	}
}

func (service *Service) snapshotEndpoints() error {
	endpoints, err := service.dataStore.Endpoint().Endpoints()
	if err != nil {
		return err
	}

	for _, endpoint := range endpoints {
		if !SupportDirectSnapshot(&endpoint) {
			continue
		}

		snapshotError := service.SnapshotEndpoint(&endpoint)

		latestEndpointReference, err := service.dataStore.Endpoint().Endpoint(endpoint.ID)
		if latestEndpointReference == nil {
			log.Debug().
				Str("endpoint", endpoint.Name).
				Str("URL", endpoint.URL).Err(err).
				Msg("background schedule error (environment snapshot), environment not found inside the database anymore")

			continue
		}

		latestEndpointReference.Status = portainer.EndpointStatusUp
		if snapshotError != nil {
			log.Debug().
				Str("endpoint", endpoint.Name).
				Str("URL", endpoint.URL).Err(err).
				Msg("background schedule error (environment snapshot), unable to create snapshot")

			latestEndpointReference.Status = portainer.EndpointStatusDown
		}

		latestEndpointReference.Agent.Version = endpoint.Agent.Version

		err = service.dataStore.Endpoint().UpdateEndpoint(latestEndpointReference.ID, latestEndpointReference)
		if err != nil {
			log.Debug().
				Str("endpoint", endpoint.Name).
				Str("URL", endpoint.URL).Err(err).
				Msg("background schedule error (environment snapshot), unable to update environment")

			continue
		}
	}

	return nil
}

// FetchDockerID fetches info.Swarm.Cluster.ID if environment(endpoint) is swarm and info.ID otherwise
func FetchDockerID(snapshot portainer.DockerSnapshot) (string, error) {
	info := snapshot.SnapshotRaw.Info

	if !snapshot.Swarm {
		return info.ID, nil
	}

	swarmInfo := info.Swarm
	if swarmInfo.Cluster == nil {
		return "", errors.New("swarm environment is missing cluster info snapshot")
	}

	clusterInfo := swarmInfo.Cluster
	return clusterInfo.ID, nil
}
