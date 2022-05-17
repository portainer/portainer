package migrator

import (
	"fmt"
	"log"

	"github.com/portainer/portainer/api/dataservices/errors"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/endpointutils"
	snapshotutils "github.com/portainer/portainer/api/internal/snapshot"
)

func (m *Migrator) migrateDBVersionToDB32() error {
	err := m.updateRegistriesToDB32()
	if err != nil {
		return err
	}

	err = m.updateDockerhubToDB32()
	if err != nil {
		return err
	}

	if err := m.updateVolumeResourceControlToDB32(); err != nil {
		return err
	}

	if err := m.kubeconfigExpiryToDB32(); err != nil {
		return err
	}

	if err := m.helmRepositoryURLToDB32(); err != nil {
		return err
	}

	return nil
}

func (m *Migrator) updateRegistriesToDB32() error {
	migrateLog.Info("- updating registries")
	registries, err := m.registryService.Registries()
	if err != nil {
		return err
	}

	endpoints, err := m.endpointService.Endpoints()
	if err != nil {
		return err
	}

	for _, registry := range registries {

		registry.RegistryAccesses = portainer.RegistryAccesses{}

		for _, endpoint := range endpoints {

			filteredUserAccessPolicies := portainer.UserAccessPolicies{}
			for userId, registryPolicy := range registry.UserAccessPolicies {
				if _, found := endpoint.UserAccessPolicies[userId]; found {
					filteredUserAccessPolicies[userId] = registryPolicy
				}
			}

			filteredTeamAccessPolicies := portainer.TeamAccessPolicies{}
			for teamId, registryPolicy := range registry.TeamAccessPolicies {
				if _, found := endpoint.TeamAccessPolicies[teamId]; found {
					filteredTeamAccessPolicies[teamId] = registryPolicy
				}
			}

			registry.RegistryAccesses[endpoint.ID] = portainer.RegistryAccessPolicies{
				UserAccessPolicies: filteredUserAccessPolicies,
				TeamAccessPolicies: filteredTeamAccessPolicies,
				Namespaces:         []string{},
			}
		}
		m.registryService.UpdateRegistry(registry.ID, &registry)
	}
	return nil
}

func (m *Migrator) updateDockerhubToDB32() error {
	migrateLog.Info("- updating dockerhub")
	dockerhub, err := m.dockerhubService.DockerHub()
	if err == errors.ErrObjectNotFound {
		return nil
	} else if err != nil {
		return err
	}

	if !dockerhub.Authentication {
		return nil
	}

	registry := &portainer.Registry{
		Type:             portainer.DockerHubRegistry,
		Name:             "Dockerhub (authenticated - migrated)",
		URL:              "docker.io",
		Authentication:   true,
		Username:         dockerhub.Username,
		Password:         dockerhub.Password,
		RegistryAccesses: portainer.RegistryAccesses{},
	}

	// The following code will make this function idempotent.
	// i.e. if run again, it will not change the data.  It will ensure that
	// we only have one migrated registry entry. Duplicates will be removed
	// if they exist and which has been happening due to earlier migration bugs
	migrated := false
	registries, _ := m.registryService.Registries()
	for _, r := range registries {
		if r.Type == registry.Type &&
			r.Name == registry.Name &&
			r.URL == registry.URL &&
			r.Authentication == registry.Authentication {

			if !migrated {
				// keep this one entry
				migrated = true
			} else {
				// delete subsequent duplicates
				m.registryService.DeleteRegistry(portainer.RegistryID(r.ID))
			}
		}
	}

	if migrated {
		return nil
	}

	endpoints, err := m.endpointService.Endpoints()
	if err != nil {
		return err
	}

	for _, endpoint := range endpoints {

		if endpoint.Type != portainer.KubernetesLocalEnvironment &&
			endpoint.Type != portainer.AgentOnKubernetesEnvironment &&
			endpoint.Type != portainer.EdgeAgentOnKubernetesEnvironment {

			userAccessPolicies := portainer.UserAccessPolicies{}
			for userId := range endpoint.UserAccessPolicies {
				if _, found := endpoint.UserAccessPolicies[userId]; found {
					userAccessPolicies[userId] = portainer.AccessPolicy{
						RoleID: 0,
					}
				}
			}

			teamAccessPolicies := portainer.TeamAccessPolicies{}
			for teamId := range endpoint.TeamAccessPolicies {
				if _, found := endpoint.TeamAccessPolicies[teamId]; found {
					teamAccessPolicies[teamId] = portainer.AccessPolicy{
						RoleID: 0,
					}
				}
			}

			registry.RegistryAccesses[endpoint.ID] = portainer.RegistryAccessPolicies{
				UserAccessPolicies: userAccessPolicies,
				TeamAccessPolicies: teamAccessPolicies,
				Namespaces:         []string{},
			}
		}
	}

	return m.registryService.Create(registry)
}

func (m *Migrator) updateVolumeResourceControlToDB32() error {
	migrateLog.Info("- updating resource controls")
	endpoints, err := m.endpointService.Endpoints()
	if err != nil {
		return fmt.Errorf("failed fetching environments: %w", err)
	}

	resourceControls, err := m.resourceControlService.ResourceControls()
	if err != nil {
		return fmt.Errorf("failed fetching resource controls: %w", err)
	}

	toUpdate := map[portainer.ResourceControlID]string{}
	volumeResourceControls := map[string]*portainer.ResourceControl{}

	for i := range resourceControls {
		resourceControl := resourceControls[i]
		if resourceControl.Type == portainer.VolumeResourceControl {
			volumeResourceControls[resourceControl.ResourceID] = &resourceControl
		}
	}

	for _, endpoint := range endpoints {
		if !endpointutils.IsDockerEndpoint(&endpoint) {
			continue
		}

		totalSnapshots := len(endpoint.Snapshots)
		if totalSnapshots == 0 {
			log.Println("[DEBUG] [volume migration] [message: no snapshot found]")
			continue
		}

		snapshot := endpoint.Snapshots[totalSnapshots-1]

		endpointDockerID, err := snapshotutils.FetchDockerID(snapshot)
		if err != nil {
			log.Printf("[WARN] [database,migrator,v31] [message: failed fetching environment docker id] [err: %s]", err)
			continue
		}

		if volumesData, done := snapshot.SnapshotRaw.Volumes.(map[string]interface{}); done {
			if volumesData["Volumes"] == nil {
				log.Println("[DEBUG] [volume migration] [message: no volume data found]")
				continue
			}

			findResourcesToUpdateForDB32(endpointDockerID, volumesData, toUpdate, volumeResourceControls)
		}
	}

	for _, resourceControl := range volumeResourceControls {
		if newResourceID, ok := toUpdate[resourceControl.ID]; ok {
			resourceControl.ResourceID = newResourceID
			err := m.resourceControlService.UpdateResourceControl(resourceControl.ID, resourceControl)
			if err != nil {
				return fmt.Errorf("failed updating resource control %d: %w", resourceControl.ID, err)
			}

		} else {
			err := m.resourceControlService.DeleteResourceControl(resourceControl.ID)
			if err != nil {
				return fmt.Errorf("failed deleting resource control %d: %w", resourceControl.ID, err)
			}
			log.Printf("[DEBUG] [volume migration] [message: legacy resource control(%s) has been deleted]", resourceControl.ResourceID)
		}
	}

	return nil
}

func findResourcesToUpdateForDB32(dockerID string, volumesData map[string]interface{}, toUpdate map[portainer.ResourceControlID]string, volumeResourceControls map[string]*portainer.ResourceControl) {
	volumes := volumesData["Volumes"].([]interface{})
	for _, volumeMeta := range volumes {
		volume := volumeMeta.(map[string]interface{})
		volumeName, nameExist := volume["Name"].(string)
		if !nameExist {
			continue
		}
		createTime, createTimeExist := volume["CreatedAt"].(string)
		if !createTimeExist {
			continue
		}

		oldResourceID := fmt.Sprintf("%s%s", volumeName, createTime)
		resourceControl, ok := volumeResourceControls[oldResourceID]

		if ok {
			toUpdate[resourceControl.ID] = fmt.Sprintf("%s_%s", volumeName, dockerID)
		}
	}
}

func (m *Migrator) kubeconfigExpiryToDB32() error {
	migrateLog.Info("- updating kubeconfig expiry")
	settings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}
	settings.KubeconfigExpiry = portainer.DefaultKubeconfigExpiry
	return m.settingsService.UpdateSettings(settings)
}

func (m *Migrator) helmRepositoryURLToDB32() error {
	migrateLog.Info("- setting default helm repository URL")
	settings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}
	settings.HelmRepositoryURL = portainer.DefaultHelmRepositoryURL
	return m.settingsService.UpdateSettings(settings)
}
