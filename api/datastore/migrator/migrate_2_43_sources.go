package migrator

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/slicesx"
	"github.com/rs/zerolog/log"
)

// DB accesses enforcement are trying to restrict accesses as much as possible
// but because accesses are applied sequentially, we want the accesses to be more open on migration
// so that users retain their accesses
func ApplyUACOnSourceUpdate_2_43_0(source *portainer.Source,
	users []portainer.UserID, teams []portainer.TeamID,
	public bool, adminOnly bool,
	ownerId portainer.UserID,
) {
	// sources already public should remain public
	// OR
	// the resource using this source is public, so the source should be public
	if source.Public || public {
		source.Public = true
		source.AdministratorsOnly = false
		source.UserAccesses = []portainer.UserID{}
		source.TeamAccesses = []portainer.TeamID{}
		return
	}

	// add users and teams to source accesses only if the incoming resource is not admninonly
	// to avoid saving leftover user/teams from adminonly resources
	if !adminOnly {
		source.UserAccesses = slicesx.Unique(append(source.UserAccesses, users...))
		source.TeamAccesses = slicesx.Unique(append(source.TeamAccesses, teams...))
	}

	// regardless of the incoming resource's ResourceControl values (func params)
	// no accesses means adminonly source not owned by anyone
	// we don't want users to own sources they don't have access to
	// neither we want to default them to public
	// all in all as we are doing an update it's probably redundant, but just in case...
	if len(source.UserAccesses) == 0 && len(source.TeamAccesses) == 0 {
		source.AdministratorsOnly = true
		source.OwnerID = 0
		return
	}

	// if owner of the incoming resource (ownerid) is the only one with access, we give the ownership to the user.
	// The source could previously be adminonly so we change that as well as we want the most open situation
	if len(source.UserAccesses) == 1 && len(source.TeamAccesses) == 0 && ownerId == source.UserAccesses[0] {
		source.OwnerID = ownerId
		source.AdministratorsOnly = false
		return
	}

	// Anything else will have multiple accesses (multiple teams or users), from multiple resources (source update flow)
	// So we remove the ownership of the source in case it existed
	// Scenario:
	// - source created for resource owned by Bob
	// - now we try to update with the RC from an admin-owned resource, shared to other users/teams
	// - we don't want Bob to own the source anymore
	source.OwnerID = 0

}

func GetValuesForUsersFromResourceOwnershipAndAccesses_2_43_0(
	rc *portainer.ResourceControl,
	getCreator func() (portainer.UserID, portainer.UserRole, error),
	getCreatorMemberships func(portainer.UserID) ([]portainer.TeamMembership, error),
) (
	users []portainer.UserID, teams []portainer.TeamID,
	public bool, adminOnly bool,
	ownerId portainer.UserID,
) {
	users = []portainer.UserID{}
	teams = []portainer.TeamID{}
	public = false
	adminOnly = true

	if rc == nil {
		return
	}

	adminOnly = rc.AdministratorsOnly
	public = rc.Public

	if adminOnly || public {
		return
	}

	// only transfer users/teams when the stack is not admin nor public
	// this allows avoiding transfering access of sources to users/teams that don't have real access to the stack
	// but that may have had their accesses retained in DB

	users = slicesx.Map(rc.UserAccesses, func(ura portainer.UserResourceAccess) portainer.UserID { return ura.UserID })
	teams = slicesx.Map(rc.TeamAccesses, func(tra portainer.TeamResourceAccess) portainer.TeamID { return tra.TeamID })

	userId, userRole, err := getCreator()
	if err != nil {
		log.Error().Err(err).Msgf("failed to read user when migrating to source")
		return
	}

	// we don't want to save the ownerid if the user is admin
	// this avoids admins taking ownership of a new source
	if userRole == portainer.AdministratorRole {
		return
	}

	// We also don't want to get the ownerid if the user doesn't have access to the resource anymore
	userTeams, err := getCreatorMemberships(userId)
	if err != nil {
		log.Error().Err(err).Msgf("failed to read user %d teams when migrating source", userId)
		return
	}

	teamIds := slicesx.Map(userTeams, func(membership portainer.TeamMembership) portainer.TeamID { return membership.TeamID })
	if authorization.UserCanAccessResource(userId, teamIds, rc) {
		ownerId = userId
	}

	return
}
