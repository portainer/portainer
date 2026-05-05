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

	"github.com/docker/docker/api/types/volume"
	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/require"
)

const volumeCreationAPIVersion = "1.51"

type volumeCreationFixtures struct {
	dockerSrv  *httptest.Server
	ds         dataservices.DataStore
	stdUser    portainer.User
	adminUser  portainer.User
	endpointID portainer.EndpointID
}

func newVolumeCreationFixtures(t *testing.T) *volumeCreationFixtures {
	t.Helper()

	dockerSrv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodHead && r.URL.Path == "/_ping" {
			w.Header().Add("Api-Version", volumeCreationAPIVersion)
			_, _ = w.Write([]byte{})

			return
		}

		if r.Method == http.MethodPost {
			data, err := json.Marshal(map[string]string{"Name": "test-volume"})
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)

				return
			}

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusCreated)
			_, _ = w.Write(data)

			return
		}

		http.NotFound(w, r)
	}))
	t.Cleanup(dockerSrv.Close)

	_, store := datastore.MustNewTestStore(t, true, false)

	f := &volumeCreationFixtures{
		dockerSrv:  dockerSrv,
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

		err = tx.Endpoint().Create(&portainer.Endpoint{ID: f.endpointID, Name: "test-env"})
		require.NoError(t, err)

		return nil
	})
	require.NoError(t, err)

	return f
}

func (f *volumeCreationFixtures) setSecuritySettings(t *testing.T, settings portainer.EndpointSecuritySettings) {
	t.Helper()

	err := f.ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.Endpoint().UpdateEndpoint(f.endpointID, &portainer.Endpoint{
			ID:               f.endpointID,
			Name:             "test-env",
			SecuritySettings: settings,
		})
	})
	require.NoError(t, err)
}

func (f *volumeCreationFixtures) newTransport() *Transport {
	return &Transport{
		endpoint:      &portainer.Endpoint{ID: f.endpointID},
		dataStore:     f.ds,
		HTTPTransport: &http.Transport{},
	}
}

func (f *volumeCreationFixtures) newRequest(t *testing.T, body volume.CreateOptions, user portainer.User) *http.Request {
	t.Helper()

	data, err := json.Marshal(body)
	require.NoError(t, err)

	req, err := http.NewRequestWithContext(
		t.Context(),
		http.MethodPost,
		f.dockerSrv.URL+"/v"+volumeCreationAPIVersion+"/volumes/create",
		bytes.NewReader(data),
	)
	require.NoError(t, err)

	return req.WithContext(security.StoreTokenData(req, &portainer.TokenData{
		ID:       user.ID,
		Username: user.Username,
		Role:     user.Role,
	}))
}

func TestDecorateVolumeResourceCreationOperation_BindDriverOptForbidden(t *testing.T) {
	t.Parallel()

	f := newVolumeCreationFixtures(t)
	f.setSecuritySettings(t, portainer.EndpointSecuritySettings{
		AllowBindMountsForRegularUsers: false,
	})

	body := volume.CreateOptions{
		Name:   "evil-volume",
		Driver: "local",
		DriverOpts: map[string]string{
			"type":   "bind",
			"device": "/etc",
			"o":      "bind",
		},
	}

	resp, err := f.newTransport().decorateVolumeResourceCreationOperation(f.newRequest(t, body, f.stdUser), portainer.VolumeResourceControl)
	require.ErrorIs(t, err, ErrBindMountsForbidden)
	require.NotNil(t, resp)
	require.Equal(t, http.StatusForbidden, resp.StatusCode)
	err = resp.Body.Close()
	require.NoError(t, err)
}

func TestDecorateVolumeResourceCreationOperation_BindDriverOptAllowedForAdmin(t *testing.T) {
	t.Parallel()

	f := newVolumeCreationFixtures(t)
	f.setSecuritySettings(t, portainer.EndpointSecuritySettings{
		AllowBindMountsForRegularUsers: false,
	})

	body := volume.CreateOptions{
		Name:   "admin-volume",
		Driver: "local",
		DriverOpts: map[string]string{
			"type":   "bind",
			"device": "/etc",
		},
	}

	resp, err := f.newTransport().decorateVolumeResourceCreationOperation(f.newRequest(t, body, f.adminUser), portainer.VolumeResourceControl)
	require.NotErrorIs(t, err, ErrBindMountsForbidden)
	require.NotNil(t, resp)
	require.NotEqual(t, http.StatusForbidden, resp.StatusCode)
	err = resp.Body.Close()
	require.NoError(t, err)
}

func TestDecorateVolumeResourceCreationOperation_BindDriverOptAllowedWhenSettingPermissive(t *testing.T) {
	t.Parallel()

	f := newVolumeCreationFixtures(t)
	f.setSecuritySettings(t, portainer.EndpointSecuritySettings{
		AllowBindMountsForRegularUsers: true,
	})

	body := volume.CreateOptions{
		Name:   "allowed-volume",
		Driver: "local",
		DriverOpts: map[string]string{
			"type":   "bind",
			"device": "/data",
		},
	}

	resp, err := f.newTransport().decorateVolumeResourceCreationOperation(f.newRequest(t, body, f.stdUser), portainer.VolumeResourceControl)
	require.NotErrorIs(t, err, ErrBindMountsForbidden)
	require.NotNil(t, resp)
	require.NotEqual(t, http.StatusForbidden, resp.StatusCode)
	err = resp.Body.Close()
	require.NoError(t, err)
}

func TestDecorateVolumeResourceCreationOperation_NonBindDriverOptNotForbidden(t *testing.T) {
	t.Parallel()

	f := newVolumeCreationFixtures(t)
	f.setSecuritySettings(t, portainer.EndpointSecuritySettings{
		AllowBindMountsForRegularUsers: false,
	})

	body := volume.CreateOptions{
		Name:   "normal-volume",
		Driver: "local",
		DriverOpts: map[string]string{
			"type": "tmpfs",
		},
	}

	resp, err := f.newTransport().decorateVolumeResourceCreationOperation(f.newRequest(t, body, f.stdUser), portainer.VolumeResourceControl)
	require.NotErrorIs(t, err, ErrBindMountsForbidden)
	require.NotNil(t, resp)
	require.NotEqual(t, http.StatusForbidden, resp.StatusCode)
	err = resp.Body.Close()
	require.NoError(t, err)
}
