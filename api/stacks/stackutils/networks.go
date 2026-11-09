package stackutils

import (
	"cmp"
	"context"
	"errors"
	"fmt"
	"slices"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/docker/consts"
	"github.com/portainer/portainer/pkg/authorization"

	cerrdefs "github.com/containerd/errdefs"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/client"
)

const networkModeDefault = "default"

var ErrNetworkAccessForbidden = errors.New("forbidden to join this network")

var SystemNetworkNames = []string{"bridge", "host", "ingress", "nat", "none"}

type NetworkAccess struct {
	EndpointID       portainer.EndpointID
	UserID           portainer.UserID
	UserTeamIDs      []portainer.TeamID
	ResourceControls []portainer.ResourceControl
	Unrestricted     bool
}

func LoadNetworkAccess(teamMemberships dataservices.TeamMembershipService, resourceControls dataservices.ResourceControlService, endpointID portainer.EndpointID, userID portainer.UserID) (*NetworkAccess, error) {
	memberships, err := teamMemberships.TeamMembershipsByUserID(userID)
	if err != nil {
		return nil, err
	}

	controls, err := resourceControls.ReadAll()
	if err != nil {
		return nil, err
	}

	return &NetworkAccess{
		EndpointID:       endpointID,
		UserID:           userID,
		UserTeamIDs:      authorization.TeamIDs(memberships),
		ResourceControls: controls,
	}, nil
}

func needsNetworkAuthorization(name string) bool {
	return name != "" &&
		name != networkModeDefault &&
		!strings.HasPrefix(name, "container:") &&
		!strings.HasPrefix(name, "service:") &&
		!slices.Contains(SystemNetworkNames, name)
}

func ReferencedNetworkNames(candidates []string) []string {
	var names []string

	for _, name := range candidates {
		if needsNetworkAuthorization(name) && !slices.Contains(names, name) {
			names = append(names, name)
		}
	}

	return names
}

func (access *NetworkAccess) AuthorizeNetworks(ctx context.Context, dockerClient *client.Client, networkNames []string, allowMissing bool) error {
	for _, name := range networkNames {
		inspect, err := dockerClient.NetworkInspect(ctx, name, network.InspectOptions{})
		if allowMissing && cerrdefs.IsNotFound(err) {
			continue
		}

		if err != nil {
			return fmt.Errorf("network %q: %w", name, err)
		}

		if !access.canAccess(inspect) {
			return fmt.Errorf("network %q: %w", name, ErrNetworkAccessForbidden)
		}
	}

	return nil
}

func (access *NetworkAccess) canAccess(inspect network.Inspect) bool {
	if access.Unrestricted || slices.Contains(SystemNetworkNames, inspect.Name) {
		return true
	}

	resourceControl := authorization.GetResourceControlByResourceIDAndType(inspect.ID, portainer.NetworkResourceControl, access.ResourceControls)
	if stackName := cmp.Or(inspect.Labels[consts.SwarmStackNameLabel], inspect.Labels[consts.ComposeStackNameLabel]); resourceControl == nil && stackName != "" {
		resourceControl = authorization.GetResourceControlByResourceIDAndType(ResourceControlID(access.EndpointID, stackName), portainer.StackResourceControl, access.ResourceControls)
	}

	return authorization.UserCanAccessResource(access.UserID, access.UserTeamIDs, resourceControl)
}
