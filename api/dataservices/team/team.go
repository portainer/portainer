package team

import (
	"errors"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	dserrors "github.com/portainer/portainer/api/dataservices/errors"
)

// BucketName represents the name of the bucket where this service stores data.
const BucketName = "teams"

// Service represents a service for managing environment(endpoint) data.
type Service struct {
	dataservices.BaseDataService[portainer.Team, portainer.TeamID]
}

// NewService creates a new instance of a service.
func NewService(connection portainer.Connection) (*Service, error) {
	if err := connection.SetServiceName(BucketName); err != nil {
		return nil, err
	}

	return &Service{
		BaseDataService: dataservices.BaseDataService[portainer.Team, portainer.TeamID]{
			Bucket:     BucketName,
			Connection: connection,
		},
	}, nil
}

func (service *Service) Tx(tx portainer.Transaction) ServiceTx {
	return ServiceTx{
		BaseDataServiceTx: dataservices.BaseDataServiceTx[portainer.Team, portainer.TeamID]{
			Bucket:     BucketName,
			Connection: service.Connection,
			Tx:         tx,
		},
	}
}

// TeamByName returns a team by name.
func (service *Service) TeamByName(name string) (*portainer.Team, error) {
	var t portainer.Team

	err := service.Connection.GetAll(
		BucketName,
		&portainer.Team{},
		dataservices.FirstFn(&t, func(e portainer.Team) bool {
			return strings.EqualFold(e.Name, name)
		}),
	)

	if errors.Is(err, dataservices.ErrStop) {
		return &t, nil
	}

	if err == nil {
		return nil, dserrors.ErrObjectNotFound
	}

	return nil, err
}

// CreateTeam creates a new Team.
func (service *Service) Create(team *portainer.Team) error {
	return service.Connection.CreateObject(
		BucketName,
		func(id uint64) (int, any) {
			team.ID = portainer.TeamID(id)
			return int(team.ID), team
		},
	)
}
