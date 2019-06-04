package migrator

import (
	"github.com/boltdb/bolt"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/internal"
)

func (m *Migrator) updateResourceControlsToDBVersion2() error {
	legacyResourceControls, err := m.retrieveLegacyResourceControls()
	if err != nil {
		return err
	}

	for _, resourceControl := range legacyResourceControls {
		resourceControl.SubResourceIDs = []string{}
		resourceControl.TeamAccesses = []portainer.TeamResourceAccess{}

		owner, err := m.userService.User(resourceControl.OwnerID)
		if err != nil {
			return err
		}

		if owner.Role == portainer.AdministratorRole {
			resourceControl.AdministratorsOnly = true
			resourceControl.UserAccesses = []portainer.UserResourceAccess{}
		} else {
			resourceControl.AdministratorsOnly = false
			userAccess := portainer.UserResourceAccess{
				UserID:      resourceControl.OwnerID,
				AccessLevel: portainer.ReadWriteAccessLevel,
			}
			resourceControl.UserAccesses = []portainer.UserResourceAccess{userAccess}
		}

		err = m.resourceControlService.CreateResourceControl(&resourceControl)
		if err != nil {
			return err
		}
	}

	return nil
}

func (m *Migrator) updateEndpointsToDBVersion2() error {
	legacyEndpoints, err := m.endpointService.Endpoints()
	if err != nil {
		return err
	}

	for _, endpoint := range legacyEndpoints {
		endpoint.AuthorizedTeams = []portainer.TeamID{}
		err = m.endpointService.UpdateEndpoint(endpoint.ID, &endpoint)
		if err != nil {
			return err
		}
	}

	return nil
}

func (m *Migrator) retrieveLegacyResourceControls() ([]portainer.ResourceControl, error) {
	legacyResourceControls := make([]portainer.ResourceControl, 0)
	err := m.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte("containerResourceControl"))
		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var resourceControl portainer.ResourceControl
			err := internal.UnmarshalObject(v, &resourceControl)
			if err != nil {
				return err
			}
			resourceControl.Type = portainer.ContainerResourceControl
			legacyResourceControls = append(legacyResourceControls, resourceControl)
		}

		bucket = tx.Bucket([]byte("serviceResourceControl"))
		cursor = bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var resourceControl portainer.ResourceControl
			err := internal.UnmarshalObject(v, &resourceControl)
			if err != nil {
				return err
			}
			resourceControl.Type = portainer.ServiceResourceControl
			legacyResourceControls = append(legacyResourceControls, resourceControl)
		}

		bucket = tx.Bucket([]byte("volumeResourceControl"))
		cursor = bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var resourceControl portainer.ResourceControl
			err := internal.UnmarshalObject(v, &resourceControl)
			if err != nil {
				return err
			}
			resourceControl.Type = portainer.VolumeResourceControl
			legacyResourceControls = append(legacyResourceControls, resourceControl)
		}
		return nil
	})
	return legacyResourceControls, err
}
