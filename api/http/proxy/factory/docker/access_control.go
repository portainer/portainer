package docker

import (
	"log"
	"strings"

	"github.com/portainer/portainer/api"
)

const (
	resourceLabelForPortainerTeamResourceControl   = "io.portainer.accesscontrol.teams"
	resourceLabelForPortainerUserResourceControl   = "io.portainer.accesscontrol.users"
	resourceLabelForPortainerPublicResourceControl = "io.portainer.accesscontrol.public"
	resourceLabelForDockerSwarmStackName           = "com.docker.stack.namespace"
	resourceLabelForDockerServiceID                = "com.docker.swarm.service.id"
	resourceLabelForDockerComposeStackName         = "com.docker.compose.project"
)

type resourceLabelSelector func(map[string]interface{}) map[string]interface{}

func (transport *Transport) newResourceControlFromPortainerLabels(labelsObject map[string]interface{}, resourceID string, resourceType portainer.ResourceControlType) (*portainer.ResourceControl, error) {
	if labelsObject[resourceLabelForPortainerPublicResourceControl] != nil {
		resourceControl := portainer.NewPublicResourceControl(resourceID, resourceType)

		err := transport.resourceControlService.CreateResourceControl(resourceControl)
		if err != nil {
			return nil, err
		}

		return resourceControl, nil
	}

	teamNames := make([]string, 0)
	userNames := make([]string, 0)
	if labelsObject[resourceLabelForPortainerTeamResourceControl] != nil {
		concatenatedTeamNames := labelsObject[resourceLabelForPortainerTeamResourceControl].(string)
		teamNames = strings.Split(concatenatedTeamNames, ",")
	}

	if labelsObject[resourceLabelForPortainerUserResourceControl] != nil {
		concatenatedUserNames := labelsObject[resourceLabelForPortainerUserResourceControl].(string)
		userNames = strings.Split(concatenatedUserNames, ",")
	}

	if len(teamNames) > 0 || len(userNames) > 0 {
		teamIDs := make([]portainer.TeamID, 0)
		userIDs := make([]portainer.UserID, 0)

		for _, name := range teamNames {
			team, err := transport.teamService.TeamByName(name)
			if err != nil {
				log.Printf("[WARN] [http,proxy,docker] [message: unknown team name in access control label, ignoring access control rule for this team] [name: %s] [resource_id: %s]", name, resourceID)
				continue
			}

			teamIDs = append(teamIDs, team.ID)
		}

		for _, name := range userNames {
			user, err := transport.userService.UserByUsername(name)
			if err != nil {
				log.Printf("[WARN] [http,proxy,docker] [message: unknown user name in access control label, ignoring access control rule for this user] [name: %s] [resource_id: %s]", name, resourceID)
				continue
			}

			userIDs = append(userIDs, user.ID)
		}

		resourceControl := portainer.NewRestrictedResourceControl(resourceID, resourceType, userIDs, teamIDs)

		err := transport.resourceControlService.CreateResourceControl(resourceControl)
		if err != nil {
			return nil, err
		}

		return resourceControl, nil
	}

	return nil, nil
}

func (transport *Transport) createPrivateResourceControl(resourceIdentifier string, resourceType portainer.ResourceControlType, userID portainer.UserID) (*portainer.ResourceControl, error) {
	resourceControl := portainer.NewPrivateResourceControl(resourceIdentifier, resourceType, userID)

	err := transport.resourceControlService.CreateResourceControl(resourceControl)
	if err != nil {
		log.Printf("[ERROR] [http,proxy,docker,transport] [message: unable to persist resource control] [err: %s]", err)
		return nil, err
	}

	return resourceControl, nil
}

func (transport *Transport) getInheritedResourceControlFromServiceOrStack(resourceIdentifier string, resourceType portainer.ResourceControlType, resourceControls []portainer.ResourceControl) (*portainer.ResourceControl, error) {

	switch resourceType {
	case portainer.ContainerResourceControl:
		return getInheritedResourceControlFromContainerLabels(transport.dockerClient, resourceIdentifier, resourceControls)
	case portainer.NetworkResourceControl:
		return getInheritedResourceControlFromNetworkLabels(transport.dockerClient, resourceIdentifier, resourceControls)
	case portainer.VolumeResourceControl:
		return getInheritedResourceControlFromVolumeLabels(transport.dockerClient, resourceIdentifier, resourceControls)
	case portainer.ServiceResourceControl:
		return getInheritedResourceControlFromServiceLabels(transport.dockerClient, resourceIdentifier, resourceControls)
	case portainer.ConfigResourceControl:
		return getInheritedResourceControlFromConfigLabels(transport.dockerClient, resourceIdentifier, resourceControls)
	case portainer.SecretResourceControl:
		return getInheritedResourceControlFromSecretLabels(transport.dockerClient, resourceIdentifier, resourceControls)
	}

	return nil, nil
}

func decorateObject(object map[string]interface{}, resourceControl *portainer.ResourceControl) map[string]interface{} {
	if object["Portainer"] == nil {
		object["Portainer"] = make(map[string]interface{})
	}

	portainerMetadata := object["Portainer"].(map[string]interface{})
	portainerMetadata["ResourceControl"] = resourceControl
	return object
}
