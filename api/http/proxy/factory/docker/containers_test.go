package docker

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"

	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/require"
)

func TestDecorateContainerCreationOperation_BindMounts(t *testing.T) {
	t.Parallel()

	admin := portainer.User{ID: 1, Username: "admin", Role: portainer.AdministratorRole}
	regularUser := portainer.User{ID: 2, Username: "user", Role: portainer.StandardUserRole}

	_, ds := datastore.MustNewTestStore(t, true, false)

	err := ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
		err := tx.User().Create(&admin)
		require.NoError(t, err)

		err = tx.User().Create(&regularUser)
		require.NoError(t, err)

		err = tx.Endpoint().Create(&portainer.Endpoint{
			ID:   1,
			Name: "test",
			SecuritySettings: portainer.EndpointSecuritySettings{
				AllowBindMountsForRegularUsers: false,
			},
		})
		require.NoError(t, err)

		return nil
	})
	require.NoError(t, err)

	srv, version := mockDockerAPIServer(t, RoutesDefinition{
		{http.MethodPost, "/containers/create"}: map[string]any{"Id": "abc123", "Warnings": []any{}},
	})
	defer srv.Close()

	transport := &Transport{
		endpoint:      &portainer.Endpoint{ID: 1, URL: srv.URL},
		dataStore:     ds,
		HTTPTransport: &http.Transport{},
	}

	adminToken := portainer.TokenData{ID: admin.ID, Username: admin.Username, Role: admin.Role}
	userToken := portainer.TokenData{ID: regularUser.ID, Username: regularUser.Username, Role: regularUser.Role}

	makeRequest := func(token portainer.TokenData, body any) *http.Request {
		bodyBytes, err := json.Marshal(body)
		require.NoError(t, err)

		req := httptest.NewRequest(http.MethodPost, srv.URL+"/v"+version+"/containers/create", bytes.NewReader(bodyBytes))
		req = req.WithContext(security.StoreTokenData(req, &token))

		return req
	}

	// Admin bypasses security checks
	req := makeRequest(adminToken, map[string]any{
		"HostConfig": map[string]any{
			"Mounts": []map[string]any{{"Type": "bind", "Source": "/", "Target": "/host"}},
		},
	})
	resp, err := transport.decorateContainerCreationOperation(req, containerObjectIdentifier, portainer.ContainerResourceControl)
	require.NoError(t, err)
	require.NotNil(t, resp)

	err = resp.Body.Close()
	require.NoError(t, err)

	// HostConfig.Binds with an absolute path is blocked for regular users
	req = makeRequest(userToken, map[string]any{
		"HostConfig": map[string]any{
			"Binds": []string{"/:/host:ro"},
		},
	})
	resp, err = transport.decorateContainerCreationOperation(req, containerObjectIdentifier, portainer.ContainerResourceControl)
	require.ErrorIs(t, err, ErrBindMountsForbidden)
	require.NotNil(t, resp)
	require.Equal(t, http.StatusForbidden, resp.StatusCode)

	err = resp.Body.Close()
	require.NoError(t, err)

	// HostConfig.Mounts with type bind is blocked for regular users
	req = makeRequest(userToken, map[string]any{
		"HostConfig": map[string]any{
			"Mounts": []map[string]any{{"Type": "bind", "Source": "/", "Target": "/host"}},
		},
	})
	resp, err = transport.decorateContainerCreationOperation(req, containerObjectIdentifier, portainer.ContainerResourceControl)
	require.ErrorIs(t, err, ErrBindMountsForbidden)
	require.NotNil(t, resp)
	require.Equal(t, http.StatusForbidden, resp.StatusCode)

	err = resp.Body.Close()
	require.NoError(t, err)

	// HostConfig.Mounts with a non-bind type is allowed for regular users
	req = makeRequest(userToken, map[string]any{
		"HostConfig": map[string]any{
			"Mounts": []map[string]any{{"Type": "volume", "Source": "myvolume", "Target": "/data"}},
		},
	})
	resp, err = transport.decorateContainerCreationOperation(req, containerObjectIdentifier, portainer.ContainerResourceControl)
	require.NoError(t, err)
	require.NotNil(t, resp)

	err = resp.Body.Close()
	require.NoError(t, err)
}
