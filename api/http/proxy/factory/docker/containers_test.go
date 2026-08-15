package docker

import (
	"bytes"
	"maps"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"

	"github.com/docker/docker/api/types/volume"
	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/require"
)

type containerCreationFixtures struct {
	dockerSrv  *httptest.Server
	version    string
	ds         dataservices.DataStore
	stdUser    portainer.User
	adminUser  portainer.User
	endpointID portainer.EndpointID
}

// newContainerCreationFixtures builds a mock Docker API server (with a
// /containers/create route and any extraRoutes, e.g. a /volumes/{name}
// route used by the existing-volume-reference tier) plus a matching
// endpoint with bind mounts restricted for regular users.
func newContainerCreationFixtures(t *testing.T, extraRoutes RoutesDefinition) *containerCreationFixtures {
	t.Helper()

	routes := RoutesDefinition{
		{http.MethodPost, "/containers/create"}: map[string]any{"Id": "abc123", "Warnings": []any{}},
	}
	maps.Copy(routes, extraRoutes)

	srv, version := mockDockerAPIServer(t, routes)
	t.Cleanup(srv.Close)

	_, store := datastore.MustNewTestStore(t, true, false)

	f := &containerCreationFixtures{
		dockerSrv:  srv,
		version:    version,
		ds:         store,
		stdUser:    portainer.User{ID: 1, Username: "std", Role: portainer.StandardUserRole},
		adminUser:  portainer.User{ID: 2, Username: "admin", Role: portainer.AdministratorRole},
		endpointID: portainer.EndpointID(1),
	}

	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		err := tx.User().Create(&f.stdUser)
		require.NoError(t, err)

		err = tx.User().Create(&f.adminUser)
		require.NoError(t, err)

		err = tx.Endpoint().Create(&portainer.Endpoint{
			ID:   f.endpointID,
			Name: "test-env",
			URL:  srv.URL,
			SecuritySettings: portainer.EndpointSecuritySettings{
				AllowBindMountsForRegularUsers: false,
			},
		})
		require.NoError(t, err)

		return nil
	})
	require.NoError(t, err)

	return f
}

func (f *containerCreationFixtures) newTransport() *Transport {
	return &Transport{
		endpoint:      &portainer.Endpoint{ID: f.endpointID, URL: f.dockerSrv.URL},
		dataStore:     f.ds,
		HTTPTransport: &http.Transport{},
	}
}

func (f *containerCreationFixtures) newRequest(t *testing.T, body map[string]any, user portainer.User) *http.Request {
	t.Helper()

	bodyBytes, err := json.Marshal(body)
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodPost, f.dockerSrv.URL+"/v"+f.version+"/containers/create", bytes.NewReader(bodyBytes))
	token := portainer.TokenData{ID: user.ID, Username: user.Username, Role: user.Role}

	return req.WithContext(security.StoreTokenData(req, &token))
}

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

func TestDecorateContainerCreationOperation_BindMountRestrictions(t *testing.T) {
	t.Parallel()

	f := func(extraRoutes RoutesDefinition, body map[string]any, asAdmin, wantForbidden bool) {
		t.Helper()

		fx := newContainerCreationFixtures(t, extraRoutes)

		user := fx.stdUser
		if asAdmin {
			user = fx.adminUser
		}

		resp, err := fx.newTransport().decorateContainerCreationOperation(fx.newRequest(t, body, user), containerObjectIdentifier, portainer.ContainerResourceControl)
		require.NotNil(t, resp)

		if wantForbidden {
			require.ErrorIs(t, err, ErrBindMountsForbidden)
			require.Equal(t, http.StatusForbidden, resp.StatusCode)

			return
		}

		require.NoError(t, err)
		require.NoError(t, resp.Body.Close())
	}

	// local driver's bind-mount trick inside HostConfig.Mounts is forbidden
	f(nil, map[string]any{
		"HostConfig": map[string]any{
			"Mounts": []map[string]any{{
				"Type":   "volume",
				"Target": "/host",
				"VolumeOptions": map[string]any{
					"DriverConfig": map[string]any{
						"Options": map[string]string{"type": "none", "o": "bind", "device": "/etc"},
					},
				},
			}},
		},
	}, false, true)

	// a real filesystem type mounted via a device is forbidden
	f(nil, map[string]any{
		"HostConfig": map[string]any{
			"Mounts": []map[string]any{{
				"Type":   "volume",
				"Target": "/host",
				"VolumeOptions": map[string]any{
					"DriverConfig": map[string]any{
						"Options": map[string]string{"type": "ext4", "device": "/dev/sda1"},
					},
				},
			}},
		},
	}, false, true)

	// VolumesFrom is forbidden for regular users
	f(nil, map[string]any{
		"HostConfig": map[string]any{"VolumesFrom": []string{"other-container"}},
	}, false, true)

	// VolumesFrom is allowed for admins
	f(nil, map[string]any{
		"HostConfig": map[string]any{"VolumesFrom": []string{"other-container"}},
	}, true, false)

	// a Windows drive-letter bind path is forbidden
	f(nil, map[string]any{
		"HostConfig": map[string]any{"Binds": []string{`C:\Users\Public:C:\data`}},
	}, false, true)

	// bind Type match is case-insensitive
	f(nil, map[string]any{
		"HostConfig": map[string]any{"Mounts": []map[string]any{{"Type": "BIND", "Source": "/", "Target": "/host"}}},
	}, false, true)

	// referencing an existing volume that is actually bind-backed is forbidden
	f(RoutesDefinition{
		{http.MethodGet, "/volumes/evilvol"}: volume.Volume{
			Name:    "evilvol",
			Driver:  "local",
			Options: map[string]string{"type": "none", "o": "bind", "device": "/etc"},
		},
	}, map[string]any{
		"HostConfig": map[string]any{"Binds": []string{"evilvol:/data"}},
	}, false, true)

	// referencing an existing normal volume is allowed
	f(RoutesDefinition{
		{http.MethodGet, "/volumes/normalvol"}: volume.Volume{Name: "normalvol", Driver: "local"},
	}, map[string]any{
		"HostConfig": map[string]any{"Binds": []string{"normalvol:/data"}},
	}, false, false)
}
