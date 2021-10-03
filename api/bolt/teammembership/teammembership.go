package teammembership

import (
	"fmt"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/internal"
	"github.com/sirupsen/logrus"

	"github.com/boltdb/bolt"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "team_membership"
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

// TeamMembership returns a TeamMembership object by ID
func (service *Service) TeamMembership(ID portainer.TeamMembershipID) (*portainer.TeamMembership, error) {
	var membership portainer.TeamMembership
	identifier := internal.Itob(int(ID))

	err := internal.GetObject(service.connection, BucketName, identifier, &membership)
	if err != nil {
		return nil, err
	}

	return &membership, nil
}

// TeamMemberships return an array containing all the TeamMembership objects.
func (service *Service) TeamMemberships() ([]portainer.TeamMembership, error) {
	var memberships = make([]portainer.TeamMembership, 0)

	err := internal.GetAll(
		service.connection,
		BucketName,
		func(obj interface{}) error {
			membership, ok := obj.(portainer.TeamMembership)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to TeamMembership object")
				return fmt.Errorf("Failed to convert to TeamMembership object: %s", obj)
			}
			memberships = append(memberships, membership)
			return nil
		})

	return memberships, err
}

// TeamMembershipsByUserID return an array containing all the TeamMembership objects where the specified userID is present.
func (service *Service) TeamMembershipsByUserID(userID portainer.UserID) ([]portainer.TeamMembership, error) {
	var memberships = make([]portainer.TeamMembership, 0)

	err := internal.GetAll(
		service.connection,
		BucketName,
		func(obj interface{}) error {
			membership, ok := obj.(portainer.TeamMembership)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to TeamMembership object")
				return fmt.Errorf("Failed to convert to TeamMembership object: %s", obj)
			}
			if membership.UserID == userID {
				memberships = append(memberships, membership)
			}
			return nil
		})

	return memberships, err
}

// TeamMembershipsByTeamID return an array containing all the TeamMembership objects where the specified teamID is present.
func (service *Service) TeamMembershipsByTeamID(teamID portainer.TeamID) ([]portainer.TeamMembership, error) {
	var memberships = make([]portainer.TeamMembership, 0)

	err := internal.GetAll(
		service.connection,
		BucketName,
		func(obj interface{}) error {
			membership, ok := obj.(portainer.TeamMembership)
			if !ok {
				logrus.WithField("obj", obj).Errorf("Failed to convert to TeamMembership object")
				return fmt.Errorf("Failed to convert to TeamMembership object: %s", obj)
			}
			if membership.TeamID == teamID {
				memberships = append(memberships, membership)
			}
			return nil
		})

	return memberships, err
}

// UpdateTeamMembership saves a TeamMembership object.
func (service *Service) UpdateTeamMembership(ID portainer.TeamMembershipID, membership *portainer.TeamMembership) error {
	identifier := internal.Itob(int(ID))
	return internal.UpdateObject(service.connection, BucketName, identifier, membership)
}

// CreateTeamMembership creates a new TeamMembership object.
func (service *Service) Create(membership *portainer.TeamMembership) error {
	return internal.CreateObject(
		service.connection,
		BucketName,
		func(id uint64) (int, interface{}) {
			membership.ID = portainer.TeamMembershipID(id)
			return int(membership.ID), membership
		},
	)
}

// DeleteTeamMembership deletes a TeamMembership object.
func (service *Service) DeleteTeamMembership(ID portainer.TeamMembershipID) error {
	identifier := internal.Itob(int(ID))
	return internal.DeleteObject(service.connection, BucketName, identifier)
}

// DeleteTeamMembershipByUserID deletes all the TeamMembership object associated to a UserID.
func (service *Service) DeleteTeamMembershipByUserID(userID portainer.UserID) error {
	return service.connection.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var membership portainer.TeamMembership
			err := internal.UnmarshalObject(v, &membership)
			if err != nil {
				return err
			}

			if membership.UserID == userID {
				err := bucket.Delete(internal.Itob(int(membership.ID)))
				if err != nil {
					return err
				}
			}
		}

		return nil
	})
}

// DeleteTeamMembershipByTeamID deletes all the TeamMembership object associated to a TeamID.
func (service *Service) DeleteTeamMembershipByTeamID(teamID portainer.TeamID) error {
	return service.connection.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var membership portainer.TeamMembership
			err := internal.UnmarshalObject(v, &membership)
			if err != nil {
				return err
			}

			if membership.TeamID == teamID {
				err := bucket.Delete(internal.Itob(int(membership.ID)))
				if err != nil {
					return err
				}
			}
		}

		return nil
	})
}
