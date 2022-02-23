package registry

import (
	"fmt"
	"github.com/portainer/portainer/api/database"

	"github.com/sirupsen/logrus"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "registries"
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

// Registry returns an registry by ID.
func (service *Service) Registry(ID RegistryID) (*Registry, error) {
	var registry Registry
	identifier := service.connection.ConvertToKey(int(ID))

	err := service.connection.GetObject(BucketName, identifier, &registry)
	if err != nil {
		return nil, err
	}

	return &registry, nil
}

// Registries returns an array containing all the registries.
func (service *Service) Registries() ([]Registry, error) {
	var registries = make([]Registry, 0)

	err := service.connection.GetAll(
		BucketName,
		&Registry{},
		func(obj interface{}) (interface{}, error) {
			registry, ok := obj.(*Registry)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to Registry object")
				return nil, fmt.Errorf("Failed to convert to Registry object: %s", obj)
			}
			registries = append(registries, *registry)
			return &Registry{}, nil
		})

	return registries, err
}

// CreateRegistry creates a new registry.
func (service *Service) Create(registry *Registry) error {
	return service.connection.CreateObject(
		BucketName,
		func(id uint64) (int, interface{}) {
			registry.ID = RegistryID(id)
			return int(registry.ID), registry
		},
	)
}

// UpdateRegistry updates an registry.
func (service *Service) UpdateRegistry(ID RegistryID, registry *Registry) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.UpdateObject(BucketName, identifier, registry)
}

// DeleteRegistry deletes an registry.
func (service *Service) DeleteRegistry(ID RegistryID) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.DeleteObject(BucketName, identifier)
}

// Registry represents a Docker registry with all the info required to connect to it
type Registry struct {
	// Registry Identifier
	ID RegistryID `json:"Id" example:"1"`
	// Registry Type (1 - Quay, 2 - Azure, 3 - Custom, 4 - Gitlab, 5 - ProGet, 6 - DockerHub, 7 - ECR)
	Type RegistryType `json:"Type" enums:"1,2,3,4,5,6,7"`
	// Registry Name
	Name string `json:"Name" example:"my-registry"`
	// URL or IP address of the Docker registry
	URL string `json:"URL" example:"registry.mydomain.tld:2375"`
	// Base URL, introduced for ProGet registry
	BaseURL string `json:"BaseURL" example:"registry.mydomain.tld:2375"`
	// Is authentication against this registry enabled
	Authentication bool `json:"Authentication" example:"true"`
	// Username or AccessKeyID used to authenticate against this registry
	Username string `json:"Username" example:"registry user"`
	// Password or SecretAccessKey used to authenticate against this registry
	Password                string                           `json:"Password,omitempty" example:"registry_password"`
	ManagementConfiguration *RegistryManagementConfiguration `json:"ManagementConfiguration"`
	Gitlab                  GitlabRegistryData               `json:"Gitlab"`
	Quay                    QuayRegistryData                 `json:"Quay"`
	Ecr                     EcrData                          `json:"Ecr"`
	RegistryAccesses        RegistryAccesses                 `json:"RegistryAccesses"`

	// Deprecated fields
	// Deprecated in DBVersion == 31
	UserAccessPolicies database.UserAccessPolicies `json:"UserAccessPolicies"`
	// Deprecated in DBVersion == 31
	TeamAccessPolicies database.TeamAccessPolicies `json:"TeamAccessPolicies"`

	// Deprecated in DBVersion == 18
	AuthorizedUsers []database.UserID `json:"AuthorizedUsers"`
	// Deprecated in DBVersion == 18
	AuthorizedTeams []database.TeamID `json:"AuthorizedTeams"`

	// Stores temporary access token
	AccessToken       string `json:"AccessToken,omitempty"`
	AccessTokenExpiry int64  `json:"AccessTokenExpiry,omitempty"`
}

type RegistryAccesses map[database.EndpointID]RegistryAccessPolicies

type RegistryAccessPolicies struct {
	UserAccessPolicies database.UserAccessPolicies `json:"UserAccessPolicies"`
	TeamAccessPolicies database.TeamAccessPolicies `json:"TeamAccessPolicies"`
	Namespaces         []string                    `json:"Namespaces"`
}

// RegistryID represents a registry identifier
type RegistryID int

// RegistryManagementConfiguration represents a configuration that can be used to query the registry API via the registry management extension.
type RegistryManagementConfiguration struct {
	Type              RegistryType              `json:"Type"`
	Authentication    bool                      `json:"Authentication"`
	Username          string                    `json:"Username"`
	Password          string                    `json:"Password"`
	TLSConfig         database.TLSConfiguration `json:"TLSConfig"`
	Ecr               EcrData                   `json:"Ecr"`
	AccessToken       string                    `json:"AccessToken,omitempty"`
	AccessTokenExpiry int64                     `json:"AccessTokenExpiry,omitempty"`
}

// RegistryType represents a type of registry
type RegistryType int

// GitlabRegistryData represents data required for gitlab registry to work
type GitlabRegistryData struct {
	ProjectID   int    `json:"ProjectId"`
	InstanceURL string `json:"InstanceURL"`
	ProjectPath string `json:"ProjectPath"`
}

// QuayRegistryData represents data required for Quay registry to work
type QuayRegistryData struct {
	UseOrganisation  bool   `json:"UseOrganisation"`
	OrganisationName string `json:"OrganisationName"`
}

// EcrData represents data required for ECR registry
type EcrData struct {
	Region string `json:"Region" example:"ap-southeast-2"`
}
