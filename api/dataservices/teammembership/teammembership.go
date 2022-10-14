package teammembership

import (
	portainer "github.com/portainer/portainer/api"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "team_membership"
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

// TeamMembership returns a TeamMembership object by ID
func (service *Service) TeamMembership(ID portainer.TeamMembershipID) (*portainer.TeamMembership, error) {
	var membership portainer.TeamMembership
	return &membership, nil
}

// TeamMemberships return an array containing all the TeamMembership objects.
func (service *Service) TeamMemberships() ([]portainer.TeamMembership, error) {
	var memberships = make([]portainer.TeamMembership, 0)
	return memberships, nil
}

// TeamMembershipsByUserID return an array containing all the TeamMembership objects where the specified userID is present.
func (service *Service) TeamMembershipsByUserID(userID portainer.UserID) ([]portainer.TeamMembership, error) {
	var memberships = make([]portainer.TeamMembership, 0)
	return memberships, nil
}

// TeamMembershipsByTeamID return an array containing all the TeamMembership objects where the specified teamID is present.
func (service *Service) TeamMembershipsByTeamID(teamID portainer.TeamID) ([]portainer.TeamMembership, error) {
	var memberships = make([]portainer.TeamMembership, 0)
	return memberships, nil
}

// UpdateTeamMembership saves a TeamMembership object.
func (service *Service) UpdateTeamMembership(ID portainer.TeamMembershipID, membership *portainer.TeamMembership) error {
	return nil
}

// CreateTeamMembership creates a new TeamMembership object.
func (service *Service) Create(membership *portainer.TeamMembership) error {
	return nil
}

// DeleteTeamMembership deletes a TeamMembership object.
func (service *Service) DeleteTeamMembership(ID portainer.TeamMembershipID) error {
	return nil
}

// DeleteTeamMembershipByUserID deletes all the TeamMembership object associated to a UserID.
func (service *Service) DeleteTeamMembershipByUserID(userID portainer.UserID) error {
	return nil
}

// DeleteTeamMembershipByTeamID deletes all the TeamMembership object associated to a TeamID.
func (service *Service) DeleteTeamMembershipByTeamID(teamID portainer.TeamID) error {
	return nil
}
