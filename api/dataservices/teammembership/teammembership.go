package teammembership

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/sirupsen/logrus"
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
	err := connection.SetServiceName(BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		connection: connection,
	}, nil
}

// TeamMembership returns a TeamMembership object by ID
func (service *Service) TeamMembership(ID portainer.TeamMembershipID) (*portainer.TeamMembership, error) {
	var membership portainer.TeamMembership
	identifier := service.connection.ConvertToKey(int(ID))

	err := service.connection.GetObject(BucketName, identifier, &membership)
	if err != nil {
		return nil, err
	}

	return &membership, nil
}

// TeamMemberships return an array containing all the TeamMembership objects.
func (service *Service) TeamMemberships() ([]portainer.TeamMembership, error) {
	var memberships = make([]portainer.TeamMembership, 0)

	err := service.connection.GetAll(
		BucketName,
		&portainer.TeamMembership{},
		func(obj interface{}) (interface{}, error) {
			membership, ok := obj.(*portainer.TeamMembership)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to TeamMembership object")
				return nil, fmt.Errorf("Failed to convert to TeamMembership object: %s", obj)
			}
			memberships = append(memberships, *membership)
			return &portainer.TeamMembership{}, nil
		})

	return memberships, err
}

// TeamMembershipsByUserID return an array containing all the TeamMembership objects where the specified userID is present.
func (service *Service) TeamMembershipsByUserID(userID portainer.UserID) ([]portainer.TeamMembership, error) {
	var memberships = make([]portainer.TeamMembership, 0)

	err := service.connection.GetAll(
		BucketName,
		&portainer.TeamMembership{},
		func(obj interface{}) (interface{}, error) {
			membership, ok := obj.(*portainer.TeamMembership)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to TeamMembership object")
				return nil, fmt.Errorf("Failed to convert to TeamMembership object: %s", obj)
			}
			if membership.UserID == userID {
				memberships = append(memberships, *membership)
			}
			return &portainer.TeamMembership{}, nil
		})

	return memberships, err
}

// TeamMembershipsByTeamID return an array containing all the TeamMembership objects where the specified teamID is present.
func (service *Service) TeamMembershipsByTeamID(teamID portainer.TeamID) ([]portainer.TeamMembership, error) {
	var memberships = make([]portainer.TeamMembership, 0)

	err := service.connection.GetAll(
		BucketName,
		&portainer.TeamMembership{},
		func(obj interface{}) (interface{}, error) {
			membership, ok := obj.(*portainer.TeamMembership)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to TeamMembership object")
				return nil, fmt.Errorf("Failed to convert to TeamMembership object: %s", obj)
			}
			if membership.TeamID == teamID {
				memberships = append(memberships, *membership)
			}
			return &portainer.TeamMembership{}, nil
		})

	return memberships, err
}

// UpdateTeamMembership saves a TeamMembership object.
func (service *Service) UpdateTeamMembership(ID portainer.TeamMembershipID, membership *portainer.TeamMembership) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.UpdateObject(BucketName, identifier, membership)
}

// CreateTeamMembership creates a new TeamMembership object.
func (service *Service) Create(membership *portainer.TeamMembership) error {
	return service.connection.CreateObject(
		BucketName,
		func(id uint64) (int, interface{}) {
			membership.ID = portainer.TeamMembershipID(id)
			return int(membership.ID), membership
		},
	)
}

// DeleteTeamMembership deletes a TeamMembership object.
func (service *Service) DeleteTeamMembership(ID portainer.TeamMembershipID) error {
	identifier := service.connection.ConvertToKey(int(ID))
	return service.connection.DeleteObject(BucketName, identifier)
}

// DeleteTeamMembershipByUserID deletes all the TeamMembership object associated to a UserID.
func (service *Service) DeleteTeamMembershipByUserID(userID portainer.UserID) error {
	return service.connection.DeleteAllObjects(
		BucketName,
		func(obj interface{}) (id int, ok bool) {
			membership, ok := obj.(portainer.TeamMembership)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to TeamMembership object")
				//return fmt.Errorf("Failed to convert to TeamMembership object: %s", obj)
				return -1, false
			}
			if membership.UserID == userID {
				return int(membership.ID), true
			}
			return -1, false
		})
}

// DeleteTeamMembershipByTeamID deletes all the TeamMembership object associated to a TeamID.
func (service *Service) DeleteTeamMembershipByTeamID(teamID portainer.TeamID) error {
	return service.connection.DeleteAllObjects(
		BucketName,
		func(obj interface{}) (id int, ok bool) {
			membership, ok := obj.(portainer.TeamMembership)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to TeamMembership object")
				//return fmt.Errorf("Failed to convert to TeamMembership object: %s", obj)
				return -1, false
			}
			if membership.TeamID == teamID {
				return int(membership.ID), true
			}
			return -1, false
		})
}
