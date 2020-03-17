package migrator

import (
	"strconv"
	"strings"

	"github.com/boltdb/bolt"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/internal"
	"github.com/portainer/portainer/api/bolt/stack"
)

func (m *Migrator) updateEndpointsToVersion12() error {
	legacyEndpoints, err := m.endpointService.Endpoints()
	if err != nil {
		return err
	}

	for _, endpoint := range legacyEndpoints {
		endpoint.Tags = []portainer.TagID{}

		err = m.endpointService.UpdateEndpoint(endpoint.ID, &endpoint)
		if err != nil {
			return err
		}
	}

	return nil
}

func (m *Migrator) updateEndpointGroupsToVersion12() error {
	legacyEndpointGroups, err := m.endpointGroupService.EndpointGroups()
	if err != nil {
		return err
	}

	for _, group := range legacyEndpointGroups {
		group.Tags = []portainer.TagID{}

		err = m.endpointGroupService.UpdateEndpointGroup(group.ID, &group)
		if err != nil {
			return err
		}
	}

	return nil
}

type legacyStack struct {
	ID          string               `json:"Id"`
	Name        string               `json:"Name"`
	EndpointID  portainer.EndpointID `json:"EndpointId"`
	SwarmID     string               `json:"SwarmId"`
	EntryPoint  string               `json:"EntryPoint"`
	Env         []portainer.Pair     `json:"Env"`
	ProjectPath string
}

func (m *Migrator) updateStacksToVersion12() error {
	legacyStacks, err := m.retrieveLegacyStacks()
	if err != nil {
		return err
	}

	for _, legacyStack := range legacyStacks {
		err := m.convertLegacyStack(&legacyStack)
		if err != nil {
			return err
		}
	}

	return nil
}

func (m *Migrator) convertLegacyStack(s *legacyStack) error {
	stackID := m.stackService.GetNextIdentifier()
	stack := &portainer.Stack{
		ID:         portainer.StackID(stackID),
		Name:       s.Name,
		Type:       portainer.DockerSwarmStack,
		SwarmID:    s.SwarmID,
		EndpointID: 0,
		EntryPoint: s.EntryPoint,
		Env:        s.Env,
	}

	stack.ProjectPath = strings.Replace(s.ProjectPath, s.ID, strconv.Itoa(stackID), 1)
	err := m.fileService.Rename(s.ProjectPath, stack.ProjectPath)
	if err != nil {
		return err
	}

	err = m.deleteLegacyStack(s.ID)
	if err != nil {
		return err
	}

	return m.stackService.CreateStack(stack)
}

func (m *Migrator) deleteLegacyStack(legacyID string) error {
	return m.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(stack.BucketName))
		return bucket.Delete([]byte(legacyID))
	})
}

func (m *Migrator) retrieveLegacyStacks() ([]legacyStack, error) {
	var legacyStacks = make([]legacyStack, 0)
	err := m.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(stack.BucketName))
		cursor := bucket.Cursor()

		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var stack legacyStack
			err := internal.UnmarshalObject(v, &stack)
			if err != nil {
				return err
			}
			legacyStacks = append(legacyStacks, stack)
		}

		return nil
	})

	return legacyStacks, err
}
