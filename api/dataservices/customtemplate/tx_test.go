package customtemplate_test

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/stretchr/testify/require"
)

func TestCustomTemplateCreateTx(t *testing.T) {
	_, ds := datastore.MustNewTestStore(t, true, false)
	require.NotNil(t, ds)

	require.NoError(t, ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.CustomTemplate().Create(&portainer.CustomTemplate{ID: 1})
	}))

	var template *portainer.CustomTemplate
	require.NoError(t, ds.ViewTx(func(tx dataservices.DataStoreTx) error {
		var err error
		template, err = tx.CustomTemplate().Read(1)
		return err
	}))

	require.Equal(t, portainer.CustomTemplateID(1), template.ID)
}
