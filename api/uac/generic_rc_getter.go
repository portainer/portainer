package uac

import (
	"strings"

	"github.com/docker/docker/api/types/swarm"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/docker/consts"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/slicesx"
	"github.com/rs/zerolog/log"
)

type rcServiceLike interface {
	ResourceControlByResourceIDAndType(resourceID string, resourceType portainer.ResourceControlType) (*portainer.ResourceControl, error)
}

type teamServiceLike interface {
	TeamByName(name string) (*portainer.Team, error)
}

type userServiceLike interface {
	UserIDByUsername(name string) (portainer.UserID, error)
}

type txLike[
	RCS rcServiceLike,
	TS teamServiceLike,
	US userServiceLike,
] interface {
	ResourceControl() RCS
	Team() TS
	User() US
}

type ResourceContext[T any] struct {
	RCType       portainer.ResourceControlType
	IDGetter     func(T) string
	LabelsGetter func(T) map[string]string
}

func genericResourcControlGetter[
	T any,
	TX txLike[RCS, TS, US],
	RCS rcServiceLike,
	TS teamServiceLike,
	US userServiceLike,
](
	tx TX,
	endpointID portainer.EndpointID,
	context ResourceContext[T],
) func(T) (*portainer.ResourceControl, error) {
	return func(item T) (*portainer.ResourceControl, error) {
		resourceID := context.IDGetter(item)
		resourceType := context.RCType

		if rc, err := tx.ResourceControl().ResourceControlByResourceIDAndType(
			resourceID, resourceType,
		); err != nil && !dataservices.IsErrObjectNotFound(err) {
			return nil, err
		} else if rc != nil {
			return rc, nil
		}

		if context.LabelsGetter == nil {
			return authorization.NewEmptyRestrictedResourceControl(resourceID, resourceType), nil
		}

		labels := context.LabelsGetter(item)
		if labels == nil {
			return authorization.NewEmptyRestrictedResourceControl(resourceID, resourceType), nil
		}

		if serviceId, ok := labels[consts.SwarmServiceIDLabel]; ok {
			if rc, err := tx.ResourceControl().ResourceControlByResourceIDAndType(
				ServiceResourceControlID(swarm.Service{ID: serviceId}),
				portainer.ServiceResourceControl,
			); err != nil && !dataservices.IsErrObjectNotFound(err) {
				return nil, err
			} else if rc != nil {
				return rc, nil
			}
		}

		if stackName, ok := labels[consts.SwarmStackNameLabel]; ok {
			if rc, err := tx.ResourceControl().ResourceControlByResourceIDAndType(
				StackResourceControlID(endpointID, stackName),
				portainer.StackResourceControl,
			); err != nil && !dataservices.IsErrObjectNotFound(err) {
				return nil, err
			} else if rc != nil {
				return rc, nil
			}
		}

		if stackName, ok := labels[consts.ComposeStackNameLabel]; ok {
			if rc, err := tx.ResourceControl().ResourceControlByResourceIDAndType(
				StackResourceControlID(endpointID, stackName),
				portainer.StackResourceControl,
			); err != nil && !dataservices.IsErrObjectNotFound(err) {
				return nil, err
			} else if rc != nil {
				return rc, nil
			}
		}

		return rcFromPortainerLabels(tx, labels, resourceID, resourceType)
	}
}

const (
	publicRCLabel = "io.portainer.accesscontrol.public"
	userRCLabel   = "io.portainer.accesscontrol.users"
	teamRCLabel   = "io.portainer.accesscontrol.teams"
)

// translation of rules from transport.newResourceControlFromPortainerLabels(resourceLabelsObject, resourceIdentifier, resourceType)
func rcFromPortainerLabels[
	TX txLike[RCS, TS, US],
	RCS rcServiceLike,
	TS teamServiceLike,
	US userServiceLike,
](
	tx TX, labels map[string]string, resourceID string, resourceType portainer.ResourceControlType,
) (*portainer.ResourceControl, error) {
	if _, ok := labels[publicRCLabel]; ok {
		return authorization.NewPublicResourceControl(resourceID, resourceType), nil
	}

	teamNames := make([]string, 0)
	userNames := make([]string, 0)

	if teams, ok := labels[teamRCLabel]; ok {
		teamNames = getUniqueElements(teams)
	}

	if users, ok := labels[userRCLabel]; ok {
		userNames = getUniqueElements(users)
	}

	if len(teamNames) == 0 && len(userNames) == 0 {
		return authorization.NewEmptyRestrictedResourceControl(resourceID, resourceType), nil
	}

	teamIDs := make([]portainer.TeamID, 0)
	userIDs := make([]portainer.UserID, 0)
	for _, name := range teamNames {
		team, err := tx.Team().TeamByName(name)
		if err != nil {
			log.Warn().
				Str("name", name).
				Str("resource_id", resourceID).
				Msg("unknown team name in access control label, ignoring access control rule for this team")

			continue
		}

		teamIDs = append(teamIDs, team.ID)
	}

	for _, name := range userNames {
		userID, err := tx.User().UserIDByUsername(name)
		if err != nil {
			log.Warn().
				Str("name", name).
				Str("resource_id", resourceID).
				Msg("unknown user name in access control label, ignoring access control rule for this user")
			continue
		}

		userIDs = append(userIDs, userID)
	}

	return authorization.NewRestrictedResourceControl(resourceID, resourceType, userIDs, teamIDs), nil
}

func getUniqueElements(items string) []string {
	xs := strings.Split(items, ",")
	xs = slicesx.Map(xs, strings.TrimSpace)
	xs = slicesx.FilterInPlace(xs, func(x string) bool { return len(x) > 0 })

	return slicesx.Unique(xs)
}
