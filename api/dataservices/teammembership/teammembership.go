package teammembership

import (
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

func (service *Service) Tx(tx portainer.Transaction) ServiceTx {
	return ServiceTx{
		service: service,
		tx:      tx,
	}
}

// TeamMembership returns a TeamMembership object by ID
func (service *Service) TeamMembership(ID portainer.TeamMembershipID) (*portainer.TeamMembership, error) {
	var obj portainer.TeamMembership

	err := service.connection.GetByID(int(ID), &obj)
	if err != nil {
		return nil, err
	}

	return &obj, nil
}

// TeamMemberships return an array containing all the TeamMembership objects.
func (service *Service) TeamMemberships() ([]portainer.TeamMembership, error) {
	var memberships = make([]portainer.TeamMembership, 0)

	db := service.connection.GetDB()
	tx := db.Find(&memberships)
	if tx.Error != nil {
		return nil, tx.Error
	}

	return memberships, nil
}

// TeamMembershipsByUserID return an array containing all the TeamMembership objects where the specified userID is present.
func (service *Service) TeamMembershipsByUserID(userID portainer.UserID) ([]portainer.TeamMembership, error) {
	var memberships = make([]portainer.TeamMembership, 0)

	db := service.connection.GetDB()
	tx := db.Find(&memberships, `user_id = ?`, userID)
	if tx.Error != nil {
		return nil, tx.Error
	}

	return memberships, nil
}

// TeamMembershipsByTeamID return an array containing all the TeamMembership objects where the specified teamID is present.
func (service *Service) TeamMembershipsByTeamID(teamID portainer.TeamID) ([]portainer.TeamMembership, error) {
	var memberships = make([]portainer.TeamMembership, 0)

	db := service.connection.GetDB()
	tx := db.Find(&memberships, `team_id = ?`, teamID)
	if tx.Error != nil {
		return nil, tx.Error
	}

	return memberships, nil
}

// UpdateTeamMembership saves a TeamMembership object.
func (service *Service) UpdateTeamMembership(ID portainer.TeamMembershipID, membership *portainer.TeamMembership) error {
	db := service.connection.GetDB()

	membership.ID = ID
	tx := db.Save(&membership)
	if tx.Error != nil {
		return tx.Error
	}

	return nil
}

// CreateTeamMembership creates a new TeamMembership object.
func (service *Service) Create(membership *portainer.TeamMembership) error {
	db := service.connection.GetDB()
	tx := db.Create(&membership)
	if tx.Error != nil {
		return tx.Error
	}
	return nil
}

// DeleteTeamMembership deletes a TeamMembership object.
func (service *Service) DeleteTeamMembership(ID portainer.TeamMembershipID) error {
	return service.connection.DeleteByID(int(ID), &portainer.TeamMembership{})
}

// DeleteTeamMembershipByUserID deletes all the TeamMembership object associated to a UserID.
func (service *Service) DeleteTeamMembershipByUserID(userID portainer.UserID) error {
	db := service.connection.GetDB()
	return db.Model(&portainer.TeamMembership{}).Delete("user_id = ?", userID).Error
}

// DeleteTeamMembershipByTeamID deletes all the TeamMembership object associated to a TeamID.
func (service *Service) DeleteTeamMembershipByTeamID(teamID portainer.TeamID) error {
	db := service.connection.GetDB()
	return db.Model(&portainer.TeamMembership{}).Delete("team_id = ?", teamID).Error
}

func (service *Service) DeleteTeamMembershipByTeamIDAndUserID(teamID portainer.TeamID, userID portainer.UserID) error {
	db := service.connection.GetDB()
	return db.Model(&portainer.TeamMembership{}).Delete("team_id = ? AND user_id = ?", teamID, userID).Error
}
