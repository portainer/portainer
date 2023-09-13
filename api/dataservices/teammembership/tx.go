package teammembership

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"

	"github.com/rs/zerolog/log"
)

type ServiceTx struct {
	dataservices.BaseDataServiceTx[portainer.TeamMembership, portainer.TeamMembershipID]
}

// TeamMembershipsByUserID return an array containing all the TeamMembership objects where the specified userID is present.
func (service ServiceTx) TeamMembershipsByUserID(userID portainer.UserID) ([]portainer.TeamMembership, error) {
	var memberships = make([]portainer.TeamMembership, 0)

	return memberships, service.Tx.GetAll(
		BucketName,
		&portainer.TeamMembership{},
		dataservices.FilterFn(&memberships, func(e portainer.TeamMembership) bool {
			return e.UserID == userID
		}),
	)
}

// TeamMembershipsByTeamID return an array containing all the TeamMembership objects where the specified teamID is present.
func (service ServiceTx) TeamMembershipsByTeamID(teamID portainer.TeamID) ([]portainer.TeamMembership, error) {
	var memberships = make([]portainer.TeamMembership, 0)

	return memberships, service.Tx.GetAll(
		BucketName,
		&portainer.TeamMembership{},
		dataservices.FilterFn(&memberships, func(e portainer.TeamMembership) bool {
			return e.TeamID == teamID
		}),
	)
}

// CreateTeamMembership creates a new TeamMembership object.
func (service ServiceTx) Create(membership *portainer.TeamMembership) error {
	return service.Tx.CreateObject(
		BucketName,
		func(id uint64) (int, interface{}) {
			membership.ID = portainer.TeamMembershipID(id)
			return int(membership.ID), membership
		},
	)
}

// DeleteTeamMembershipByUserID deletes all the TeamMembership object associated to a UserID.
func (service ServiceTx) DeleteTeamMembershipByUserID(userID portainer.UserID) error {
	return service.Tx.DeleteAllObjects(
		BucketName,
		&portainer.TeamMembership{},
		func(obj interface{}) (id int, ok bool) {
			membership, ok := obj.(portainer.TeamMembership)
			if !ok {
				log.Debug().Str("obj", fmt.Sprintf("%#v", obj)).Msg("failed to convert to TeamMembership object")
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
func (service ServiceTx) DeleteTeamMembershipByTeamID(teamID portainer.TeamID) error {
	return service.Tx.DeleteAllObjects(
		BucketName,
		&portainer.TeamMembership{},
		func(obj interface{}) (id int, ok bool) {
			membership, ok := obj.(portainer.TeamMembership)
			if !ok {
				log.Debug().Str("obj", fmt.Sprintf("%#v", obj)).Msg("failed to convert to TeamMembership object")
				//return fmt.Errorf("Failed to convert to TeamMembership object: %s", obj)
				return -1, false
			}

			if membership.TeamID == teamID {
				return int(membership.ID), true
			}

			return -1, false
		})
}

func (service ServiceTx) DeleteTeamMembershipByTeamIDAndUserID(teamID portainer.TeamID, userID portainer.UserID) error {
	return service.Tx.DeleteAllObjects(
		BucketName,
		&portainer.TeamMembership{},
		func(obj interface{}) (id int, ok bool) {
			membership, ok := obj.(portainer.TeamMembership)
			if !ok {
				log.Debug().Str("obj", fmt.Sprintf("%#v", obj)).Msg("failed to convert to TeamMembership object")
				//return fmt.Errorf("Failed to convert to TeamMembership object: %s", obj)
				return -1, false
			}

			if membership.TeamID == teamID && membership.UserID == userID {
				return int(membership.ID), true
			}

			return -1, false
		})
}
