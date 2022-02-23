package tests

import (
	"github.com/portainer/portainer/api/database"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/stretchr/testify/assert"
)

type teamBuilder struct {
	t     *testing.T
	count int
	store *datastore.Store
}

func (b *teamBuilder) createNew(name string) *portainer.Team {
	b.count++
	team := &portainer.Team{
		ID:   database.TeamID(b.count),
		Name: name,
	}

	err := b.store.Team().Create(team)
	assert.NoError(b.t, err)

	return team
}
