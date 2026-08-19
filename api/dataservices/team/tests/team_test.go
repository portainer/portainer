package tests

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices/errors"
	"github.com/portainer/portainer/api/datastore"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type teamBuilder struct {
	t     *testing.T
	count int
	store *datastore.Store
}

func (b *teamBuilder) createNew(name string) *portainer.Team {
	b.count++
	team := &portainer.Team{
		ID:   portainer.TeamID(b.count),
		Name: name,
	}

	err := b.store.Team().Create(team)
	assert.NoError(b.t, err)

	return team
}

func Test_teamByName(t *testing.T) {
	t.Parallel()
	t.Run("When store is empty should return ErrObjectNotFound", func(t *testing.T) {
		_, store := datastore.MustNewTestStore(t, false, true)

		_, err := store.Team().TeamByName("name")
		require.ErrorIs(t, err, errors.ErrObjectNotFound)

	})

	t.Run("When there is no object with the same name should return ErrObjectNotFound", func(t *testing.T) {
		_, store := datastore.MustNewTestStore(t, false, true)

		teamBuilder := teamBuilder{
			t:     t,
			store: store,
			count: 0,
		}

		teamBuilder.createNew("name1")

		_, err := store.Team().TeamByName("name")
		require.ErrorIs(t, err, errors.ErrObjectNotFound)
	})

	t.Run("When there is an object with the same name should return the object", func(t *testing.T) {
		_, store := datastore.MustNewTestStore(t, false, true)

		teamBuilder := teamBuilder{
			t:     t,
			store: store,
			count: 0,
		}

		expectedTeam := teamBuilder.createNew("name1")

		team, err := store.Team().TeamByName("name1")
		require.NoError(t, err, "TeamByName should succeed")
		assert.Equal(t, expectedTeam, team)
	})
}
