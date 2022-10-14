package team

import (
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
	return &Service{
		connection: connection,
	}, nil
}

// Team returns a Team by ID
func (service *Service) Team(ID portainer.TeamID) (*portainer.Team, error) {
	var team portainer.Team
	return &team, nil
}

// TeamByName returns a team by name.
func (service *Service) TeamByName(name string) (*portainer.Team, error) {
	return nil, nil
}

// Teams return an array containing all the teams.
func (service *Service) Teams() ([]portainer.Team, error) {
	var teams = make([]portainer.Team, 0)
	return teams, nil
}

// UpdateTeam saves a Team.
func (service *Service) UpdateTeam(ID portainer.TeamID, team *portainer.Team) error {
	return nil
}

// CreateTeam creates a new Team.
func (service *Service) Create(team *portainer.Team) error {
	return nil
}

// DeleteTeam deletes a Team.
func (service *Service) DeleteTeam(ID portainer.TeamID) error {
	return nil
}
