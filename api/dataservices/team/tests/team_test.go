package tests

import (
	"testing"

	"github.com/portainer/portainer/api/dataservices/errors"
	"github.com/portainer/portainer/api/datastore"
	"github.com/stretchr/testify/assert"
)

func Test_teamByName(t *testing.T) {
	t.Run("When store is empty should return ErrObjectNotFound", func(t *testing.T) {
		_, store := datastore.MustNewTestStore(t, true, true)

		_, err := store.Team().TeamByName("name")
		assert.ErrorIs(t, err, errors.ErrObjectNotFound)

	})

	t.Run("When there is no object with the same name should return ErrObjectNotFound", func(t *testing.T) {
		_, store := datastore.MustNewTestStore(t, true, true)

		teamBuilder := teamBuilder{
			t:     t,
			store: store,
			count: 0,
		}

		teamBuilder.createNew("name1")

		_, err := store.Team().TeamByName("name")
		assert.ErrorIs(t, err, errors.ErrObjectNotFound)
	})

	t.Run("When there is an object with the same name should return the object", func(t *testing.T) {
		_, store := datastore.MustNewTestStore(t, true, true)

		teamBuilder := teamBuilder{
			t:     t,
			store: store,
			count: 0,
		}

		expectedTeam := teamBuilder.createNew("name1")

		team, err := store.Team().TeamByName("name1")
		assert.NoError(t, err, "TeamByName should succeed")
		assert.Equal(t, expectedTeam, team)
	})
}
