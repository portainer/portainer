package edge_test

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/roar"

	"github.com/rs/zerolog"
	"github.com/stretchr/testify/require"
)

const n = 1_000_000

func BenchmarkWriteEdgeGroupOld(b *testing.B) {
	zerolog.SetGlobalLevel(zerolog.ErrorLevel)

	_, store := datastore.MustNewTestStore(b, false, false)

	var endpointIDs []portainer.EndpointID

	for i := range n {
		endpointIDs = append(endpointIDs, portainer.EndpointID(i+1))
	}

	for b.Loop() {
		err := store.EdgeGroup().Create(&portainer.EdgeGroup{
			Name:      "Test Edge Group",
			Endpoints: endpointIDs,
		})
		require.NoError(b, err)
	}
}

func BenchmarkWriteEdgeGroupNew(b *testing.B) {
	zerolog.SetGlobalLevel(zerolog.ErrorLevel)

	_, store := datastore.MustNewTestStore(b, false, false)

	var ts []portainer.EndpointID

	for i := range n {
		ts = append(ts, portainer.EndpointID(i+1))
	}

	endpointIDs := roar.FromSlice(ts)

	for b.Loop() {
		err := store.EdgeGroup().Create(&portainer.EdgeGroup{
			Name:        "Test Edge Group",
			EndpointIDs: endpointIDs,
		})
		require.NoError(b, err)
	}
}

func BenchmarkReadEdgeGroupOld(b *testing.B) {
	zerolog.SetGlobalLevel(zerolog.ErrorLevel)

	_, store := datastore.MustNewTestStore(b, false, false)

	var endpointIDs []portainer.EndpointID

	for i := range n {
		endpointIDs = append(endpointIDs, portainer.EndpointID(i+1))
	}

	err := store.EdgeGroup().Create(&portainer.EdgeGroup{
		Name:      "Test Edge Group",
		Endpoints: endpointIDs,
	})
	require.NoError(b, err)

	for b.Loop() {
		_, err := store.EdgeGroup().ReadAll()
		require.NoError(b, err)
	}
}

func BenchmarkReadEdgeGroupNew(b *testing.B) {
	zerolog.SetGlobalLevel(zerolog.ErrorLevel)

	_, store := datastore.MustNewTestStore(b, false, false)

	var ts []portainer.EndpointID

	for i := range n {
		ts = append(ts, portainer.EndpointID(i+1))
	}

	endpointIDs := roar.FromSlice(ts)

	err := store.EdgeGroup().Create(&portainer.EdgeGroup{
		Name:        "Test Edge Group",
		EndpointIDs: endpointIDs,
	})
	require.NoError(b, err)

	for b.Loop() {
		_, err := store.EdgeGroup().ReadAll()
		require.NoError(b, err)
	}
}
