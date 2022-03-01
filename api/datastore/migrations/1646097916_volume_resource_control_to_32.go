package migrations

import (
	"fmt"
	"log"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore/migrations/types"
	"github.com/portainer/portainer/api/internal/endpointutils"
	snapshotutils "github.com/portainer/portainer/api/internal/snapshot"
)

func init() {
	migrator.AddMigration(types.Migration{
		Version:   31,
		Timestamp: 1646097916,
		Up:        v31_up_volume_resource_control_to_32,
		Down:      v31_down_volume_resource_control_to_32,
		Name:      "volume resource control to 32",
	})
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

func v31_up_volume_resource_control_to_32() error {
	endpoints, err := migrator.store.EndpointService.Endpoints()
	if err != nil {
		return fmt.Errorf("failed fetching environments: %w", err)
	}

	resourceControls, err := migrator.store.ResourceControlService.ResourceControls()
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
			err := migrator.store.ResourceControlService.UpdateResourceControl(resourceControl.ID, resourceControl)
			if err != nil {
				return fmt.Errorf("failed updating resource control %d: %w", resourceControl.ID, err)
			}

		} else {
			err := migrator.store.ResourceControlService.DeleteResourceControl(resourceControl.ID)
			if err != nil {
				return fmt.Errorf("failed deleting resource control %d: %w", resourceControl.ID, err)
			}
			log.Printf("[DEBUG] [volume migration] [message: legacy resource control(%s) has been deleted]", resourceControl.ResourceID)
		}
	}

	return nil
}

func v31_down_volume_resource_control_to_32() error {
	return nil
}
