package endpointutils

import (
	"errors"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/kubernetes/cli"
	"github.com/portainer/portainer/pkg/endpoints"

	log "github.com/rs/zerolog/log"
)

var (
	IsLocalEndpoint      = endpoints.IsLocalEndpoint
	IsKubernetesEndpoint = endpoints.IsKubernetesEndpoint
	IsDockerEndpoint     = endpoints.IsDockerEndpoint
	IsEdgeEndpoint       = endpoints.IsEdgeEndpoint
	IsAgentEndpoint      = endpoints.IsAgentEndpoint
	EndpointSet          = endpoints.EndpointSet
)

// EndpointPlatformType returns the type of the endpoint based on the environment and container engine
func EndpointPlatformType(endpoint *portainer.Endpoint) portainer.PlatformType {
	switch endpoint.Type {
	case portainer.DockerEnvironment, portainer.AgentOnDockerEnvironment, portainer.EdgeAgentOnDockerEnvironment:
		if endpoint.ContainerEngine == portainer.ContainerEnginePodman {
			return portainer.PodmanPlatformType
		}
		return portainer.DockerPlatformType
	case portainer.KubernetesLocalEnvironment, portainer.AgentOnKubernetesEnvironment, portainer.EdgeAgentOnKubernetesEnvironment:
		return portainer.KubernetesPlatformType
	case portainer.AzureEnvironment:
		return portainer.AzurePlatformType
	}
	return portainer.UnknownPlatformType
}

// FilterByExcludeIDs receives an environment(endpoint) array and returns a filtered array using an excludeIds param
func FilterByExcludeIDs(endpoints []portainer.Endpoint, excludeIds []portainer.EndpointID) []portainer.Endpoint {
	if len(excludeIds) == 0 {
		return endpoints
	}

	filteredEndpoints := make([]portainer.Endpoint, 0)

	idsSet := make(map[portainer.EndpointID]bool)
	for _, id := range excludeIds {
		idsSet[id] = true
	}

	for _, endpoint := range endpoints {
		if !idsSet[endpoint.ID] {
			filteredEndpoints = append(filteredEndpoints, endpoint)
		}
	}

	return filteredEndpoints
}

func InitialIngressClassDetection(tx dataservices.DataStoreTx, endpoint *portainer.Endpoint, factory *cli.ClientFactory) {
	if endpoint.Kubernetes.Flags.IsServerIngressClassDetected {
		return
	}

	defer func() {
		endpoint.Kubernetes.Flags.IsServerIngressClassDetected = true

		if err := tx.Endpoint().UpdateEndpoint(endpoint.ID, endpoint); err != nil {
			log.Debug().Err(err).Msg("unable to store found IngressClasses inside the database")
		}
	}()

	cli, err := factory.GetPrivilegedKubeClient(endpoint)
	if err != nil {
		log.Debug().Err(err).Msg("unable to create kubernetes client for ingress class detection")

		return
	}

	controllers, err := cli.GetIngressControllers()
	if err != nil {
		log.Debug().Err(err).Msg("failed to fetch ingressclasses")

		return
	}

	var updatedClasses []portainer.KubernetesIngressClassConfig
	for i := range controllers {
		var updatedClass portainer.KubernetesIngressClassConfig
		updatedClass.Name = controllers[i].ClassName
		updatedClass.Type = controllers[i].Type
		updatedClasses = append(updatedClasses, updatedClass)
	}

	endpoint.Kubernetes.Configuration.IngressClasses = updatedClasses
}

func InitialMetricsDetection(tx dataservices.DataStoreTx, endpoint *portainer.Endpoint, factory *cli.ClientFactory) {
	if endpoint.Kubernetes.Flags.IsServerMetricsDetected {
		return
	}

	defer func() {
		endpoint.Kubernetes.Flags.IsServerMetricsDetected = true
		if err := tx.Endpoint().UpdateEndpoint(endpoint.ID, endpoint); err != nil {
			log.Debug().Err(err).Msg("unable to enable UseServerMetrics inside the database")
		}
	}()

	cli, err := factory.GetPrivilegedKubeClient(endpoint)
	if err != nil {
		log.Debug().Err(err).Msg("unable to create kubernetes client for initial metrics detection")

		return
	}

	if _, err := cli.GetMetrics(); err != nil {
		log.Debug().Err(err).Msg("unable to fetch metrics: leaving metrics collection disabled.")

		return
	}

	endpoint.Kubernetes.Configuration.UseServerMetrics = true
}

func storageDetect(tx dataservices.DataStoreTx, endpoint *portainer.Endpoint, factory *cli.ClientFactory) error {
	if endpoint.Kubernetes.Flags.IsServerStorageDetected {
		return nil
	}

	defer func() {
		endpoint.Kubernetes.Flags.IsServerStorageDetected = true
		if err := tx.Endpoint().UpdateEndpoint(endpoint.ID, endpoint); err != nil {
			log.Info().Err(err).Msg("unable to enable storage class inside the database")
		}
	}()

	cli, err := factory.GetPrivilegedKubeClient(endpoint)
	if err != nil {
		log.Debug().Err(err).Msg("unable to create Kubernetes client for initial storage detection")

		return err
	}

	storage, err := cli.GetStorage()
	if err != nil {
		log.Debug().Err(err).Msg("unable to fetch storage classes: leaving storage classes disabled")

		return err
	} else if len(storage) == 0 {
		log.Info().Err(err).Msg("zero storage classes found: they may be still building, retrying in 30 seconds")

		return errors.New("zero storage classes found: they may be still building, retrying in 30 seconds")
	}

	endpoint.Kubernetes.Configuration.StorageClasses = storage

	return nil
}

func InitialStorageDetection(tx dataservices.DataStoreTx, dataStore dataservices.DataStore, endpoint *portainer.Endpoint, factory *cli.ClientFactory) {
	log.Info().Msg("attempting to detect storage classes in the cluster")
	err := storageDetect(tx, endpoint, factory)
	if err == nil {
		return
	}
	log.Err(err).Msg("error while detecting storage classes")

	endpointID := endpoint.ID
	go func() {
		// Retry after 30 seconds if the initial detection failed.
		log.Info().Msg("retrying storage detection in 30 seconds")
		time.Sleep(30 * time.Second)

		err := dataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
			endpoint, err := tx.Endpoint().Endpoint(endpointID)
			if err != nil {
				return err
			}

			return storageDetect(tx, endpoint, factory)
		})
		log.Err(err).Msg("final error while detecting storage classes")
	}()
}

func UpdateEdgeEndpointHeartbeat(endpoint *portainer.Endpoint, settings *portainer.Settings) {
	if !IsEdgeEndpoint(endpoint) {
		return
	}

	endpoint.Heartbeat = GetHeartbeatStatus(endpoint, settings)
}

func GetHeartbeatStatus(endpoint *portainer.Endpoint, settings *portainer.Settings) bool {
	checkInInterval := getEndpointCheckinInterval(endpoint, settings)
	return time.Now().Unix()-endpoint.LastCheckInDate <= int64(checkInInterval*2+20)
}

func getEndpointCheckinInterval(endpoint *portainer.Endpoint, settings *portainer.Settings) int {
	if !endpoint.Edge.AsyncMode {
		if endpoint.EdgeCheckinInterval > 0 {
			return endpoint.EdgeCheckinInterval
		}

		return settings.EdgeAgentCheckinInterval
	}

	defaultInterval := 60
	intervals := [][]int{
		{endpoint.Edge.PingInterval, settings.Edge.PingInterval},
		{endpoint.Edge.CommandInterval, settings.Edge.CommandInterval},
		{endpoint.Edge.SnapshotInterval, settings.Edge.SnapshotInterval},
	}

	for i := range intervals {
		effectiveInterval := intervals[i][0]
		if effectiveInterval <= 0 {
			effectiveInterval = intervals[i][1]
		}

		if effectiveInterval > 0 && effectiveInterval < defaultInterval {
			defaultInterval = effectiveInterval
		}
	}

	return defaultInterval
}

func InitializeEdgeEndpointRelation(endpoint *portainer.Endpoint, tx dataservices.DataStoreTx) error {
	if !IsEdgeEndpoint(endpoint) {
		return nil
	}

	relation := &portainer.EndpointRelation{
		EndpointID: endpoint.ID,
		EdgeStacks: make(map[portainer.EdgeStackID]bool),
	}

	return tx.EndpointRelation().Create(relation)
}
