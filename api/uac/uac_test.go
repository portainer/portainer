package uac

import (
	"testing"

	"github.com/docker/docker/api/types/container"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/docker/consts"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/stretchr/testify/require"
)

func TestCanBypassUAC(t *testing.T) {
	t.Parallel()
	is := require.New(t)

	admin := &portainer.User{Role: portainer.AdministratorRole}
	user := &portainer.User{Role: portainer.StandardUserRole}

	is.False(canBypassUAC(nil))
	is.False(canBypassUAC(user))
	is.True(canBypassUAC(admin))
}

func TestFilterByResourceControl(t *testing.T) {
	t.Parallel()
	is := require.New(t)

	ok, store := datastore.MustNewTestStore(t, true, false)
	is.True(ok)
	is.NotNil(store)

	endpointID := portainer.EndpointID(1)
	stackRCID := StackResourceControlID(endpointID, "stack")

	is.NoError(store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		is.NoError(tx.ResourceControl().Create(authorization.NewPrivateResourceControl(stackRCID, portainer.StackResourceControl, 2)))

		is.NoError(tx.ResourceControl().Create(authorization.NewAdministratorsOnlyResourceControl("admin", portainer.ContainerResourceControl)))
		is.NoError(tx.ResourceControl().Create(authorization.NewPrivateResourceControl("private", portainer.ContainerResourceControl, 2)))
		is.NoError(tx.ResourceControl().Create(authorization.NewPublicResourceControl("public", portainer.ContainerResourceControl)))
		is.NoError(tx.ResourceControl().Create(authorization.NewSystemResourceControl("system", portainer.ContainerResourceControl)))
		return nil
	}))

	admin := &portainer.User{ID: 1, Role: portainer.AdministratorRole}
	std := &portainer.User{ID: 2, Role: portainer.StandardUserRole}
	std2 := &portainer.User{ID: 3, Role: portainer.StandardUserRole}

	containers := []container.Summary{{ID: "admin"}, {ID: "private"}, {ID: "public"}, {ID: "system"},
		{ID: "bylabel", Labels: map[string]string{consts.ComposeStackNameLabel: "stack"}},
	}

	is.NoError(store.ViewTx(func(tx dataservices.DataStoreTx) error {
		c, err := FilterByResourceControl(containers, admin, []portainer.TeamMembership{}, ContainerResourceControlGetter(tx, endpointID))
		is.NoError(err)
		is.Len(c, len(containers))

		c, err = FilterByResourceControl(containers, std, []portainer.TeamMembership{}, ContainerResourceControlGetter(tx, endpointID))
		is.NoError(err)
		is.Len(c, 4)
		is.Contains(c, container.Summary{ID: "private"})
		is.Contains(c, container.Summary{ID: "public"})
		is.Contains(c, container.Summary{ID: "system"})
		is.Contains(c, container.Summary{ID: "bylabel", Labels: map[string]string{consts.ComposeStackNameLabel: "stack"}})

		c, err = FilterByResourceControl(containers, std2, []portainer.TeamMembership{}, ContainerResourceControlGetter(tx, endpointID))
		is.NoError(err)
		is.Len(c, 2)
		is.Contains(c, container.Summary{ID: "public"})
		is.Contains(c, container.Summary{ID: "system"})

		return nil
	}))

}
