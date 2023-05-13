package team

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
)

// Service represents a service for managing environment(endpoint) data.
type Service struct {
	connection portainer.Connection
}

// NewService creates a new instance of a service.
func NewService(connection portainer.Connection) (*Service, error) {
	return &Service{
		connection: connection,
	}, nil
}

// Team returns a Team by ID
func (service *Service) Team(ID portainer.TeamID) (*portainer.Team, error) {
	var obj portainer.Team

	err := service.connection.GetByID(int(ID), &obj)
	if err != nil {
		return nil, err
	}

	return &obj, nil
}

// TeamByName returns a team by name.
func (service *Service) TeamByName(name string) (*portainer.Team, error) {
	var team portainer.Team

	db := service.connection.GetDB()
	tx := db.First(&team, `name = ?`, name)
	if tx.Error != nil {
		return nil, tx.Error
	}

	return &team, nil
}

// Teams return an array containing all the teams.
func (service *Service) Teams() ([]portainer.Team, error) {
	var teams = make([]portainer.Team, 0)

	db := service.connection.GetDB()
	tx := db.Find(&teams)
	if tx.Error != nil {
		return nil, tx.Error
	}

	return teams, nil
}

// UpdateTeam saves a Team.
func (service *Service) UpdateTeam(ID portainer.TeamID, team *portainer.Team) error {
	db := service.connection.GetDB()
	team.ID = ID
	tx := db.Save(&team)
	if tx.Error != nil {
		return tx.Error
	}
	return nil
}

// CreateTeam creates a new Team.
func (service *Service) Create(team *portainer.Team) error {
	db := service.connection.GetDB()

	tx := db.Create(&team)
	if tx.Error != nil {
		fmt.Println(tx.Error)
		return tx.Error
	}

	return nil
}

// DeleteTeam deletes a Team.
func (service *Service) DeleteTeam(ID portainer.TeamID) error {
	db := service.connection.GetDB()
	tx := db.Model(&portainer.Team{}).Delete("id = ?", ID)
	if tx.Error != nil {
		return tx.Error
	}
	return nil
}
