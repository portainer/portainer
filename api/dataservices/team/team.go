package team

import (
	"fmt"
	"strings"

	"github.com/portainer/portainer/api/dataservices/errors"
	"github.com/sirupsen/logrus"

	portainer "github.com/portainer/portainer/api"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "teams"
)

// Service represents a service for managing environment(endpoint) data.
type Service struct {
	connection portainer.Connection
}

func (service *Service) BucketName() string {
	return BucketName
}

// NewService creates a new instance of a service.
func NewService(connection portainer.Connection) (*Service, error) {
	err := connection.SetServiceName(BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		connection: connection,
	}, nil
}

// Team returns a Team by ID
func (service *Service) Team(ID portainer.TeamID) (*portainer.Team, error) {
	var team portainer.Team
	identifier := service.connection.ConvertToKey(int(ID))

	err := service.connection.GetObject(BucketName, identifier, &team)
	if err != nil {
		return nil, err
	}

	return &team, nil
}

// TeamByName returns a team by name.
func (service *Service) TeamByName(name string) (*portainer.Team, error) {
	var t *portainer.Team

	stop := fmt.Errorf("ok")
	err := service.connection.GetAll(
		BucketName,
		&portainer.Team{},
		func(obj interface{}) (interface{}, error) {
			team, ok := obj.(*portainer.Team)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to Team object")
				return nil, fmt.Errorf("Failed to convert to Team object: %s", obj)
			}
			if strings.EqualFold(team.Name, name) {
				t = team
				return nil, stop
			}
			return &portainer.Team{}, nil
		})
	if err == stop {
		return t, nil
	}
	if err == nil {
		return nil, errors.ErrObjectNotFound
	}

	return nil, err
}

// Teams return an array containing all the teams.
func (service *Service) Teams() ([]portainer.Team, error) {
	var teams = make([]portainer.Team, 0)

	err := service.connection.GetAll(
		BucketName,
		&portainer.Team{},
		func(obj interface{}) (interface{}, error) {
			team, ok := obj.(*portainer.Team)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to Team object")
				return nil, fmt.Errorf("Failed to convert to Team object: %s", obj)
			}
			teams = append(teams, *team)
			return &portainer.Team{}, nil
		})

	return teams, err
}

// UpdateTeam saves a Team.
func (service *Service) UpdateTeam(ID portainer.TeamID, team *portainer.Team) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.UpdateObject(BucketName, identifier, team)
}

// CreateTeam creates a new Team.
func (service *Service) Create(team *portainer.Team) error {
	return service.connection.CreateObject(
		BucketName,
		func(id uint64) (int, interface{}) {
			team.ID = portainer.TeamID(id)
			return int(team.ID), team
		},
	)
}

// DeleteTeam deletes a Team.
func (service *Service) DeleteTeam(ID portainer.TeamID) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.DeleteObject(BucketName, identifier)
}
