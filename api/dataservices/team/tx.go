package team

import (
	"errors"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	dserrors "github.com/portainer/portainer/api/dataservices/errors"
)

type ServiceTx struct {
	dataservices.BaseDataServiceTx[portainer.Team, portainer.TeamID]
}

// TeamByName returns a team by name.
func (service ServiceTx) TeamByName(name string) (*portainer.Team, error) {
	var t portainer.Team

	err := service.Tx.GetAll(
		BucketName,
		&portainer.Team{},
		dataservices.FirstFn(&t, func(e portainer.Team) bool {
			return strings.EqualFold(e.Name, name)
		}),
	)

	if errors.Is(err, dataservices.ErrStop) {
		return &t, nil
	}

	if err == nil {
		return nil, dserrors.ErrObjectNotFound
	}

	return nil, err
}

// CreateTeam creates a new Team.
func (service ServiceTx) Create(team *portainer.Team) error {
	return service.Tx.CreateObject(
		BucketName,
		func(id uint64) (int, any) {
			team.ID = portainer.TeamID(id)
			return int(team.ID), team
		},
	)
}
