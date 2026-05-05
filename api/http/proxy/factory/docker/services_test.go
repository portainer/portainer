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

	"github.com/docker/docker/api/types/mount"
	"github.com/docker/docker/api/types/swarm"
	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/require"
)

const serviceCreationAPIVersion = "1.51"

type serviceCreationFixtures struct {
	dockerSrv  *httptest.Server
	ds         dataservices.DataStore
	stdUser    portainer.User
	adminUser  portainer.User
	endpointID portainer.EndpointID
}

func newServiceCreationFixtures(t *testing.T) *serviceCreationFixtures {
	t.Helper()

	const serviceID = "some-service-id"

	dockerSrv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodHead && r.URL.Path == "/_ping" {
			w.Header().Add("Api-Version", serviceCreationAPIVersion)
			_, _ = w.Write([]byte{})

			return
		}

		if r.Method == http.MethodPost {
			data, err := json.Marshal(map[string]string{"ID": serviceID})
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

	f := &serviceCreationFixtures{
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

func (f *serviceCreationFixtures) setSecuritySettings(t *testing.T, settings portainer.EndpointSecuritySettings) {
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

func (f *serviceCreationFixtures) newTransport() *Transport {
	return &Transport{
		endpoint:      &portainer.Endpoint{ID: f.endpointID},
		dataStore:     f.ds,
		HTTPTransport: &http.Transport{},
	}
}

func (f *serviceCreationFixtures) newRequest(t *testing.T, spec swarm.ServiceSpec, user portainer.User) *http.Request {
	t.Helper()

	data, err := json.Marshal(spec)
	require.NoError(t, err)

	req, err := http.NewRequestWithContext(
		t.Context(),
		http.MethodPost,
		f.dockerSrv.URL+"/v"+serviceCreationAPIVersion+"/services/create",
		bytes.NewReader(data),
	)
	require.NoError(t, err)

	return req.WithContext(security.StoreTokenData(req, &portainer.TokenData{
		ID:       user.ID,
		Username: user.Username,
		Role:     user.Role,
	}))
}

var (
	restrictiveSettings = portainer.EndpointSecuritySettings{
		AllowContainerCapabilitiesForRegularUsers: false,
		AllowSysctlSettingForRegularUsers:         false,
		AllowBindMountsForRegularUsers:            false,
	}

	permissiveSettings = portainer.EndpointSecuritySettings{
		AllowContainerCapabilitiesForRegularUsers: true,
		AllowSysctlSettingForRegularUsers:         true,
		AllowBindMountsForRegularUsers:            true,
	}
)

func TestDecorateServiceCreationOperation_CapabilityAddForbidden(t *testing.T) {
	t.Parallel()

	f := newServiceCreationFixtures(t)
	f.setSecuritySettings(t, restrictiveSettings)

	spec := swarm.ServiceSpec{
		TaskTemplate: swarm.TaskSpec{
			ContainerSpec: &swarm.ContainerSpec{
				CapabilityAdd: []string{"NET_ADMIN"},
			},
		},
	}

	resp, err := f.newTransport().decorateServiceCreationOperation(f.newRequest(t, spec, f.stdUser))
	require.ErrorIs(t, err, ErrContainerCapabilitiesForbidden)
	require.NotNil(t, resp)
	require.Equal(t, http.StatusForbidden, resp.StatusCode)

	err = resp.Body.Close()
	require.NoError(t, err)
}

func TestDecorateServiceCreationOperation_CapabilityDropForbidden(t *testing.T) {
	t.Parallel()

	f := newServiceCreationFixtures(t)
	f.setSecuritySettings(t, restrictiveSettings)

	spec := swarm.ServiceSpec{
		TaskTemplate: swarm.TaskSpec{
			ContainerSpec: &swarm.ContainerSpec{
				CapabilityDrop: []string{"MKNOD"},
			},
		},
	}

	resp, err := f.newTransport().decorateServiceCreationOperation(f.newRequest(t, spec, f.stdUser))
	require.ErrorIs(t, err, ErrContainerCapabilitiesForbidden)
	require.NotNil(t, resp)
	require.Equal(t, http.StatusForbidden, resp.StatusCode)

	err = resp.Body.Close()
	require.NoError(t, err)
}

func TestDecorateServiceCreationOperation_CapabilitiesAllowed(t *testing.T) {
	t.Parallel()

	f := newServiceCreationFixtures(t)
	f.setSecuritySettings(t, permissiveSettings)

	spec := swarm.ServiceSpec{
		TaskTemplate: swarm.TaskSpec{
			ContainerSpec: &swarm.ContainerSpec{
				CapabilityAdd: []string{"NET_ADMIN"},
			},
		},
	}

	resp, err := f.newTransport().decorateServiceCreationOperation(f.newRequest(t, spec, f.stdUser))
	require.NoError(t, err)
	require.NotNil(t, resp)
	require.NotEqual(t, http.StatusForbidden, resp.StatusCode)

	err = resp.Body.Close()
	require.NoError(t, err)
}

func TestDecorateServiceCreationOperation_NoCapabilitiesAllowed(t *testing.T) {
	t.Parallel()

	f := newServiceCreationFixtures(t)
	f.setSecuritySettings(t, restrictiveSettings)

	var spec swarm.ServiceSpec

	resp, err := f.newTransport().decorateServiceCreationOperation(f.newRequest(t, spec, f.stdUser))
	require.NotErrorIs(t, err, ErrContainerCapabilitiesForbidden)
	require.NotNil(t, resp)
	require.NotEqual(t, http.StatusForbidden, resp.StatusCode)

	err = resp.Body.Close()
	require.NoError(t, err)
}

func TestDecorateServiceCreationOperation_SysctlForbidden(t *testing.T) {
	t.Parallel()

	f := newServiceCreationFixtures(t)
	f.setSecuritySettings(t, restrictiveSettings)

	spec := swarm.ServiceSpec{
		TaskTemplate: swarm.TaskSpec{
			ContainerSpec: &swarm.ContainerSpec{
				Sysctls: map[string]string{"net.ipv4.ip_forward": "1"},
			},
		},
	}

	resp, err := f.newTransport().decorateServiceCreationOperation(f.newRequest(t, spec, f.stdUser))
	require.ErrorIs(t, err, ErrSysCtlSettingsForbidden)
	require.NotNil(t, resp)
	require.Equal(t, http.StatusForbidden, resp.StatusCode)

	err = resp.Body.Close()
	require.NoError(t, err)
}

func TestDecorateServiceCreationOperation_SysctlAllowed(t *testing.T) {
	t.Parallel()

	f := newServiceCreationFixtures(t)
	f.setSecuritySettings(t, permissiveSettings)

	spec := swarm.ServiceSpec{
		TaskTemplate: swarm.TaskSpec{
			ContainerSpec: &swarm.ContainerSpec{
				Sysctls: map[string]string{"net.ipv4.ip_forward": "1"},
			},
		},
	}

	resp, err := f.newTransport().decorateServiceCreationOperation(f.newRequest(t, spec, f.stdUser))
	require.NoError(t, err)
	require.NotNil(t, resp)
	require.NotEqual(t, http.StatusForbidden, resp.StatusCode)

	err = resp.Body.Close()
	require.NoError(t, err)
}

func TestDecorateServiceCreationOperation_BindMountForbidden(t *testing.T) {
	t.Parallel()

	f := newServiceCreationFixtures(t)
	f.setSecuritySettings(t, restrictiveSettings)

	spec := swarm.ServiceSpec{
		TaskTemplate: swarm.TaskSpec{
			ContainerSpec: &swarm.ContainerSpec{
				Mounts: []mount.Mount{{Type: mount.TypeBind}},
			},
		},
	}

	resp, err := f.newTransport().decorateServiceCreationOperation(f.newRequest(t, spec, f.stdUser))
	require.ErrorIs(t, err, ErrBindMountsForbidden)
	require.NotNil(t, resp)
	require.Equal(t, http.StatusForbidden, resp.StatusCode)

	err = resp.Body.Close()
	require.NoError(t, err)
}

func TestDecorateServiceCreationOperation_NonBindMountNotForbidden(t *testing.T) {
	t.Parallel()

	f := newServiceCreationFixtures(t)

	f.setSecuritySettings(t, portainer.EndpointSecuritySettings{
		AllowContainerCapabilitiesForRegularUsers: true,
		AllowSysctlSettingForRegularUsers:         true,
		AllowBindMountsForRegularUsers:            false,
	})

	spec := swarm.ServiceSpec{
		TaskTemplate: swarm.TaskSpec{
			ContainerSpec: &swarm.ContainerSpec{
				Mounts: []mount.Mount{{Type: mount.TypeVolume}},
			},
		},
	}

	resp, err := f.newTransport().decorateServiceCreationOperation(f.newRequest(t, spec, f.stdUser))
	require.NotErrorIs(t, err, ErrBindMountsForbidden)
	require.NotNil(t, resp)
	require.NotEqual(t, http.StatusForbidden, resp.StatusCode)

	err = resp.Body.Close()
	require.NoError(t, err)
}

func TestDecorateServiceCreationOperation_BindMountAllowed(t *testing.T) {
	t.Parallel()

	f := newServiceCreationFixtures(t)
	f.setSecuritySettings(t, permissiveSettings)

	spec := swarm.ServiceSpec{
		TaskTemplate: swarm.TaskSpec{
			ContainerSpec: &swarm.ContainerSpec{
				Mounts: []mount.Mount{{Type: mount.TypeBind}},
			},
		},
	}

	resp, err := f.newTransport().decorateServiceCreationOperation(f.newRequest(t, spec, f.stdUser))
	require.NoError(t, err)
	require.NotNil(t, resp)
	require.NotEqual(t, http.StatusForbidden, resp.StatusCode)

	err = resp.Body.Close()
	require.NoError(t, err)
}

func TestDecorateServiceCreationOperation_AdminBypassesAllSecurityChecks(t *testing.T) {
	t.Parallel()

	f := newServiceCreationFixtures(t)
	f.setSecuritySettings(t, restrictiveSettings)

	spec := swarm.ServiceSpec{
		TaskTemplate: swarm.TaskSpec{
			ContainerSpec: &swarm.ContainerSpec{
				CapabilityAdd:  []string{"NET_ADMIN"},
				CapabilityDrop: []string{"MKNOD"},
				Sysctls:        map[string]string{"net.ipv4.ip_forward": "1"},
				Mounts:         []mount.Mount{{Type: mount.TypeBind}},
			},
		},
	}

	resp, err := f.newTransport().decorateServiceCreationOperation(f.newRequest(t, spec, f.adminUser))
	require.NotErrorIs(t, err, ErrContainerCapabilitiesForbidden)
	require.NotErrorIs(t, err, ErrSysCtlSettingsForbidden)
	require.NotErrorIs(t, err, ErrBindMountsForbidden)
	require.NotNil(t, resp)
	require.NotEqual(t, http.StatusForbidden, resp.StatusCode)

	err = resp.Body.Close()
	require.NoError(t, err)
}

func TestDecorateServiceCreationOperation_StandardUserPermissiveSettingsSucceeds(t *testing.T) {
	t.Parallel()

	f := newServiceCreationFixtures(t)
	f.setSecuritySettings(t, permissiveSettings)

	spec := swarm.ServiceSpec{
		TaskTemplate: swarm.TaskSpec{
			ContainerSpec: &swarm.ContainerSpec{
				CapabilityAdd: []string{"NET_ADMIN"},
				Sysctls:       map[string]string{"net.core.somaxconn": "128"},
				Mounts:        []mount.Mount{{Type: mount.TypeBind}},
			},
		},
	}

	resp, err := f.newTransport().decorateServiceCreationOperation(f.newRequest(t, spec, f.stdUser))
	require.NoError(t, err)
	require.NotNil(t, resp)
	require.Equal(t, http.StatusCreated, resp.StatusCode)

	err = resp.Body.Close()
	require.NoError(t, err)
}

func TestDecorateServiceCreationOperation_VolumeWithBindDriverOptionForbidden(t *testing.T) {
	t.Parallel()

	f := newServiceCreationFixtures(t)
	f.setSecuritySettings(t, restrictiveSettings)

	spec := swarm.ServiceSpec{
		TaskTemplate: swarm.TaskSpec{
			ContainerSpec: &swarm.ContainerSpec{
				Mounts: []mount.Mount{{
					Type: mount.TypeVolume,
					VolumeOptions: &mount.VolumeOptions{
						DriverConfig: &mount.Driver{
							Options: map[string]string{"type": "bind", "device": "/etc"},
						},
					},
				}},
			},
		},
	}

	resp, err := f.newTransport().decorateServiceCreationOperation(f.newRequest(t, spec, f.stdUser))
	require.ErrorIs(t, err, ErrBindMountsForbidden)
	require.NotNil(t, resp)
	require.Equal(t, http.StatusForbidden, resp.StatusCode)

	err = resp.Body.Close()
	require.NoError(t, err)
}

func TestDecorateServiceCreationOperation_VolumeWithBindDriverOptionAllowed(t *testing.T) {
	t.Parallel()

	f := newServiceCreationFixtures(t)
	f.setSecuritySettings(t, permissiveSettings)

	spec := swarm.ServiceSpec{
		TaskTemplate: swarm.TaskSpec{
			ContainerSpec: &swarm.ContainerSpec{
				Mounts: []mount.Mount{{
					Type: mount.TypeVolume,
					VolumeOptions: &mount.VolumeOptions{
						DriverConfig: &mount.Driver{
							Options: map[string]string{"type": "bind", "device": "/etc"},
						},
					},
				}},
			},
		},
	}

	resp, err := f.newTransport().decorateServiceCreationOperation(f.newRequest(t, spec, f.stdUser))
	require.NoError(t, err)
	require.NotNil(t, resp)
	require.NotEqual(t, http.StatusForbidden, resp.StatusCode)

	err = resp.Body.Close()
	require.NoError(t, err)
}

func TestDecorateServiceCreationOperation_VolumeWithNonBindDriverOptionNotForbidden(t *testing.T) {
	t.Parallel()

	f := newServiceCreationFixtures(t)
	f.setSecuritySettings(t, restrictiveSettings)

	spec := swarm.ServiceSpec{
		TaskTemplate: swarm.TaskSpec{
			ContainerSpec: &swarm.ContainerSpec{
				Mounts: []mount.Mount{{
					Type: mount.TypeVolume,
					VolumeOptions: &mount.VolumeOptions{
						DriverConfig: &mount.Driver{
							Options: map[string]string{"type": "tmpfs"},
						},
					},
				}},
			},
		},
	}

	resp, err := f.newTransport().decorateServiceCreationOperation(f.newRequest(t, spec, f.stdUser))
	require.NotErrorIs(t, err, ErrBindMountsForbidden)
	require.NotNil(t, resp)
	require.NotEqual(t, http.StatusForbidden, resp.StatusCode)

	err = resp.Body.Close()
	require.NoError(t, err)
}

func TestDecorateServiceUpdateOperation_VolumeWithBindDriverOptionForbidden(t *testing.T) {
	t.Parallel()

	f := newServiceCreationFixtures(t)
	f.setSecuritySettings(t, restrictiveSettings)

	spec := swarm.ServiceSpec{
		TaskTemplate: swarm.TaskSpec{
			ContainerSpec: &swarm.ContainerSpec{
				Mounts: []mount.Mount{{
					Type: mount.TypeVolume,
					VolumeOptions: &mount.VolumeOptions{
						DriverConfig: &mount.Driver{
							Options: map[string]string{"type": "bind", "device": "/etc"},
						},
					},
				}},
			},
		},
	}

	resp, err := f.newTransport().decorateServiceUpdateOperation(f.newRequest(t, spec, f.stdUser), "test-service-id")
	require.ErrorIs(t, err, ErrBindMountsForbidden)
	require.NotNil(t, resp)
	require.Equal(t, http.StatusForbidden, resp.StatusCode)

	err = resp.Body.Close()
	require.NoError(t, err)
}
