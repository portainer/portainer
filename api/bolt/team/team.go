package team

import (
	"fmt"
	"github.com/sirupsen/logrus"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/errors"
	"github.com/portainer/portainer/api/bolt/internal"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "teams"
)

// Service represents a service for managing environment(endpoint) data.
type Service struct {
	connection *internal.DbConnection
}

// NewService creates a new instance of a service.
func NewService(connection *internal.DbConnection) (*Service, error) {
	err := internal.CreateBucket(connection, BucketName)
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
	identifier := internal.Itob(int(ID))

	err := internal.GetObject(service.connection, BucketName, identifier, &team)
	if err != nil {
		return nil, err
	}

	return &team, nil
}

// TeamByName returns a team by name.
func (service *Service) TeamByName(name string) (*portainer.Team, error) {
	var t *portainer.Team

	stop := fmt.Errorf("ok")
	err := internal.GetAll(
		service.connection,
		BucketName,
		func(obj interface{}) error {
			team, ok := obj.(portainer.Team)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to Team object")
				return fmt.Errorf("Failed to convert to Team object: %s", obj)
			}
			if strings.EqualFold(t.Name, name) {
				t = &team
				return stop
			}
			return nil
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

	err := internal.GetAll(
		service.connection,
		BucketName,
		func(obj interface{}) error {
			team, ok := obj.(portainer.Team)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to Team object")
				return fmt.Errorf("Failed to convert to Team object: %s", obj)
			}
			teams = append(teams, team)
			return nil
		})

	return teams, err
}

// UpdateTeam saves a Team.
func (service *Service) UpdateTeam(ID portainer.TeamID, team *portainer.Team) error {
	identifier := internal.Itob(int(ID))
	return internal.UpdateObject(service.connection, BucketName, identifier, team)
}

// CreateTeam creates a new Team.
func (service *Service) Create(team *portainer.Team) error {
	return internal.CreateObject(
		service.connection,
		BucketName,
		func(id uint64) (int, interface{}) {
			team.ID = portainer.TeamID(id)
			return int(team.ID), team
		},
	)
}

// DeleteTeam deletes a Team.
func (service *Service) DeleteTeam(ID portainer.TeamID) error {
	identifier := internal.Itob(int(ID))
	return internal.DeleteObject(service.connection, BucketName, identifier)
}
