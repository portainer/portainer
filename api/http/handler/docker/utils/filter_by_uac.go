package utils

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/slicesx"
)

// filterByResourceControl filters a list of items based on the user's role and the resource control associated to the item.
func FilterByResourceControl[T any](tx dataservices.DataStoreTx, items []T, rcType portainer.ResourceControlType, securityContext *security.RestrictedRequestContext, idGetter func(T) string) ([]T, error) {
	if securityContext.IsAdmin {
		return items, nil
	}

	userTeamIDs := slicesx.Map(securityContext.UserMemberships, func(membership portainer.TeamMembership) portainer.TeamID {
		return membership.TeamID
	})

	filteredItems := make([]T, 0)
	for _, item := range items {
		resourceControl, err := tx.ResourceControl().ResourceControlByResourceIDAndType(idGetter(item), portainer.ContainerResourceControl)
		if err != nil {
			return nil, fmt.Errorf("Unable to retrieve resource control: %w", err)
		}

		if resourceControl == nil || authorization.UserCanAccessResource(securityContext.UserID, userTeamIDs, resourceControl) {
			filteredItems = append(filteredItems, item)
		}

	}

	return filteredItems, nil
}
