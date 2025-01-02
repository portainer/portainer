package teams

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/portainer/portainer/api/datastore"

	"github.com/stretchr/testify/require"
	"golang.org/x/sync/errgroup"
)

func TestConcurrentTeamCreation(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, true, false)

	h := &Handler{
		DataStore: store,
	}

	tcp := teamCreatePayload{
		Name: "portainer",
	}

	m, err := json.Marshal(tcp)
	require.NoError(t, err)

	errGroup := &errgroup.Group{}

	n := 100

	for range n {
		errGroup.Go(func() error {
			req, err := http.NewRequest(http.MethodPost, "/teams", bytes.NewReader(m))
			if err != nil {
				return err
			}

			if err := h.teamCreate(httptest.NewRecorder(), req); err != nil {
				return err
			}

			return nil
		})
	}

	err = errGroup.Wait()
	require.Error(t, err)

	teams, err := store.Team().ReadAll()
	require.NotEmpty(t, teams)
	require.NoError(t, err)

	teamCreated := false
	for _, team := range teams {
		if team.Name == tcp.Name {
			require.False(t, teamCreated)
			teamCreated = true
		}
	}

	require.True(t, teamCreated)
}
