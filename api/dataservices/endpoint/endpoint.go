package endpoint

import (
	"fmt"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/database"
	"github.com/sirupsen/logrus"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "endpoints"
)

// Service represents a service for managing environment(endpoint) data.
type Service struct {
	connection database.Connection
}

func (service *Service) BucketName() string {
	return BucketName
}

// NewService creates a new instance of a service.
func NewService(connection database.Connection) (*Service, error) {
	err := connection.SetServiceName(BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		connection: connection,
	}, nil
}

// Endpoint returns an environment(endpoint) by ID.
func (service *Service) Endpoint(ID database.EndpointID) (*portainer.Endpoint, error) {
	var endpoint portainer.Endpoint
	identifier := service.connection.ConvertToKey(int(ID))

	err := service.connection.GetObject(BucketName, identifier, &endpoint)
	if err != nil {
		return nil, err
	}

	return &endpoint, nil
}

// UpdateEndpoint updates an environment(endpoint).
func (service *Service) UpdateEndpoint(ID database.EndpointID, endpoint *portainer.Endpoint) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.UpdateObject(BucketName, identifier, endpoint)
}

// DeleteEndpoint deletes an environment(endpoint).
func (service *Service) DeleteEndpoint(ID database.EndpointID) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.DeleteObject(BucketName, identifier)
}

// Endpoints return an array containing all the environments(endpoints).
func (service *Service) Endpoints() ([]portainer.Endpoint, error) {
	var endpoints = make([]portainer.Endpoint, 0)

	err := service.connection.GetAllWithJsoniter(
		BucketName,
		&portainer.Endpoint{},
		func(obj interface{}) (interface{}, error) {
			endpoint, ok := obj.(*portainer.Endpoint)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to Endpoint object")
				return nil, fmt.Errorf("failed to convert to Endpoint object: %s", obj)
			}
			endpoints = append(endpoints, *endpoint)
			return &portainer.Endpoint{}, nil
		})

	return endpoints, err
}

// CreateEndpoint assign an ID to a new environment(endpoint) and saves it.
func (service *Service) Create(endpoint *portainer.Endpoint) error {
	if int(endpoint.ID) == 0 {
		// TODO: hopefully this can become the only path
		endpoint.ID = database.EndpointID(service.getNextIdentifier())
	}
	return service.connection.CreateObjectWithSetSequence(BucketName, int(endpoint.ID), endpoint)
}

// GetNextIdentifier returns the next identifier for an environment(endpoint).
func (service *Service) getNextIdentifier() int {
	return service.connection.GetNextIdentifier(BucketName)
}

func (service *Service) NewDefault() *portainer.Endpoint {
	return &portainer.Endpoint{
		//ID:                 0,
		//Name:               "primary",
		//URL:                *flags.EndpointURL,
		//GroupID:            portainer.EndpointGroupID(1),
		//Type:               portainer.DockerEnvironment,
		TLSConfig: portainer.TLSConfiguration{
			TLS: false,
		},
		UserAccessPolicies: portainer.UserAccessPolicies{},
		TeamAccessPolicies: portainer.TeamAccessPolicies{},
		TagIDs:             []portainer.TagID{},
		Status:             portainer.EndpointStatusUp,
		Snapshots:          []portainer.DockerSnapshot{},
		Kubernetes:         kubernetesDefault(),

		SecuritySettings: portainer.EndpointSecuritySettings{
			AllowVolumeBrowserForRegularUsers: false,
			EnableHostManagementFeatures:      false,

			AllowSysctlSettingForRegularUsers:         true,
			AllowBindMountsForRegularUsers:            true,
			AllowPrivilegedModeForRegularUsers:        true,
			AllowHostNamespaceForRegularUsers:         true,
			AllowContainerCapabilitiesForRegularUsers: true,
			AllowDeviceMappingForRegularUsers:         true,
			AllowStackManagementForRegularUsers:       true,
		},
	}
}

func kubernetesDefault() portainer.KubernetesData {
	return portainer.KubernetesData{
		Configuration: portainer.KubernetesConfiguration{
			UseLoadBalancer:  false,
			UseServerMetrics: false,
			StorageClasses:   []portainer.KubernetesStorageClassConfig{},
			IngressClasses:   []portainer.KubernetesIngressClassConfig{},
		},
		Snapshots: []portainer.KubernetesSnapshot{},
	}
}
