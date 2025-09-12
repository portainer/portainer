package customtemplate_test

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/stretchr/testify/require"
)

func TestCustomTemplateCreate(t *testing.T) {
	_, ds := datastore.MustNewTestStore(t, true, false)
	require.NotNil(t, ds)

	require.NoError(t, ds.CustomTemplate().Create(&portainer.CustomTemplate{ID: 1}))
	e, err := ds.CustomTemplate().Read(1)
	require.NoError(t, err)
	require.Equal(t, portainer.CustomTemplateID(1), e.ID)
}
