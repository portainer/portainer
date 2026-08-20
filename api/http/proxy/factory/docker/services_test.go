package docker

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"path"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"

	"github.com/docker/docker/api/types/mount"
	"github.com/docker/docker/api/types/swarm"
	"github.com/docker/docker/api/types/volume"
	"github.com/docker/docker/client"
	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const serviceCreationAPIVersion = "1.51"

type serviceCreationFixtures struct {
	dockerSrv  *httptest.Server
	ds         dataservices.DataStore
	stdUser    portainer.User
	adminUser  portainer.User
	endpointID portainer.EndpointID
	volumes    map[string]volume.Volume
}

func newServiceCreationFixtures(t *testing.T) *serviceCreationFixtures {
	t.Helper()

	const serviceID = "some-service-id"

	f := &serviceCreationFixtures{
		volumes: map[string]volume.Volume{},
	}

	dockerSrv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodHead && r.URL.Path == "/_ping" {
			w.Header().Add("Api-Version", serviceCreationAPIVersion)
			_, _ = w.Write([]byte{})

			return
		}

		if r.Method == http.MethodGet && path.Base(r.URL.Path) == "nodes" {
			data, err := json.Marshal([]swarm.Node{{ID: "single-node", Description: swarm.NodeDescription{Hostname: "single-node"}}})
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)

				return
			}

			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write(data)

			return
		}

		if r.Method == http.MethodGet {
			if vol, ok := f.volumes[path.Base(r.URL.Path)]; ok {
				w.Header().Set("Content-Type", "application/json")
				_ = json.NewEncoder(w).Encode(vol)

				return
			}

			http.NotFound(w, r)

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

	f.dockerSrv = dockerSrv
	f.ds = store
	f.stdUser = portainer.User{ID: 1, Username: "std", Role: portainer.StandardUserRole}
	f.adminUser = portainer.User{ID: 2, Username: "admin", Role: portainer.AdministratorRole}
	f.endpointID = portainer.EndpointID(1)

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
		endpoint:      &portainer.Endpoint{ID: f.endpointID, URL: f.dockerSrv.URL},
		dataStore:     f.ds,
		HTTPTransport: &http.Transport{},
	}
}

func (f *serviceCreationFixtures) setVolume(name string, vol volume.Volume) {
	f.volumes[name] = vol
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
		AllowSecurityOptForRegularUsers:           false,
		AllowBindMountsForRegularUsers:            false,
	}

	permissiveSettings = portainer.EndpointSecuritySettings{
		AllowContainerCapabilitiesForRegularUsers: true,
		AllowSysctlSettingForRegularUsers:         true,
		AllowSecurityOptForRegularUsers:           true,
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

func TestDecorateServiceCreationOperation_SeccompForbidden(t *testing.T) {
	t.Parallel()

	f := newServiceCreationFixtures(t)
	f.setSecuritySettings(t, restrictiveSettings)

	spec := swarm.ServiceSpec{
		TaskTemplate: swarm.TaskSpec{
			ContainerSpec: &swarm.ContainerSpec{
				Privileges: &swarm.Privileges{
					Seccomp: &swarm.SeccompOpts{Mode: swarm.SeccompModeCustom},
				},
			},
		},
	}

	resp, err := f.newTransport().decorateServiceCreationOperation(f.newRequest(t, spec, f.stdUser))
	require.ErrorIs(t, err, ErrSecurityOptSettingsForbidden)
	require.NotNil(t, resp)
	require.Equal(t, http.StatusForbidden, resp.StatusCode)

	err = resp.Body.Close()
	require.NoError(t, err)
}

func TestDecorateServiceCreationOperation_AppArmorForbidden(t *testing.T) {
	t.Parallel()

	f := newServiceCreationFixtures(t)
	f.setSecuritySettings(t, restrictiveSettings)

	spec := swarm.ServiceSpec{
		TaskTemplate: swarm.TaskSpec{
			ContainerSpec: &swarm.ContainerSpec{
				Privileges: &swarm.Privileges{
					AppArmor: &swarm.AppArmorOpts{Mode: swarm.AppArmorModeDefault},
				},
			},
		},
	}

	resp, err := f.newTransport().decorateServiceCreationOperation(f.newRequest(t, spec, f.stdUser))
	require.ErrorIs(t, err, ErrSecurityOptSettingsForbidden)
	require.NotNil(t, resp)
	require.Equal(t, http.StatusForbidden, resp.StatusCode)

	err = resp.Body.Close()
	require.NoError(t, err)
}

func TestDecorateServiceCreationOperation_NilPrivilegesNotForbidden(t *testing.T) {
	t.Parallel()

	f := newServiceCreationFixtures(t)
	f.setSecuritySettings(t, restrictiveSettings)

	var spec swarm.ServiceSpec

	resp, err := f.newTransport().decorateServiceCreationOperation(f.newRequest(t, spec, f.stdUser))
	require.NotErrorIs(t, err, ErrSecurityOptSettingsForbidden)
	require.NotNil(t, resp)
	require.NotEqual(t, http.StatusForbidden, resp.StatusCode)

	err = resp.Body.Close()
	require.NoError(t, err)
}

func TestDecorateServiceCreationOperation_PrivilegesWithNilSeccompAndAppArmorNotForbidden(t *testing.T) {
	t.Parallel()

	f := newServiceCreationFixtures(t)
	f.setSecuritySettings(t, restrictiveSettings)

	spec := swarm.ServiceSpec{
		TaskTemplate: swarm.TaskSpec{
			ContainerSpec: &swarm.ContainerSpec{
				Privileges: &swarm.Privileges{},
			},
		},
	}

	resp, err := f.newTransport().decorateServiceCreationOperation(f.newRequest(t, spec, f.stdUser))
	require.NotErrorIs(t, err, ErrSecurityOptSettingsForbidden)
	require.NotNil(t, resp)
	require.NotEqual(t, http.StatusForbidden, resp.StatusCode)

	err = resp.Body.Close()
	require.NoError(t, err)
}

func TestDecorateServiceCreationOperation_PrivilegesAllowed(t *testing.T) {
	t.Parallel()

	f := newServiceCreationFixtures(t)
	f.setSecuritySettings(t, permissiveSettings)

	spec := swarm.ServiceSpec{
		TaskTemplate: swarm.TaskSpec{
			ContainerSpec: &swarm.ContainerSpec{
				Privileges: &swarm.Privileges{
					Seccomp: &swarm.SeccompOpts{Mode: swarm.SeccompModeCustom},
				},
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
		AllowSecurityOptForRegularUsers:           true,
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
				Privileges: &swarm.Privileges{
					Seccomp: &swarm.SeccompOpts{Mode: swarm.SeccompModeCustom},
				},
				Mounts: []mount.Mount{{Type: mount.TypeBind}},
			},
		},
	}

	resp, err := f.newTransport().decorateServiceCreationOperation(f.newRequest(t, spec, f.adminUser))
	require.NotErrorIs(t, err, ErrContainerCapabilitiesForbidden)
	require.NotErrorIs(t, err, ErrSysCtlSettingsForbidden)
	require.NotErrorIs(t, err, ErrSecurityOptSettingsForbidden)
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

func TestDecorateServiceCreationOperation_BindMountRestrictions(t *testing.T) {
	t.Parallel()

	f := func(mounts []mount.Mount, volumes map[string]volume.Volume, wantForbidden bool) {
		t.Helper()

		fx := newServiceCreationFixtures(t)
		fx.setSecuritySettings(t, restrictiveSettings)

		for name, vol := range volumes {
			fx.setVolume(name, vol)
		}

		spec := swarm.ServiceSpec{
			TaskTemplate: swarm.TaskSpec{
				ContainerSpec: &swarm.ContainerSpec{Mounts: mounts},
			},
		}

		resp, err := fx.newTransport().decorateServiceCreationOperation(fx.newRequest(t, spec, fx.stdUser))
		require.NotNil(t, resp)

		if wantForbidden {
			require.ErrorIs(t, err, ErrBindMountsForbidden)
			require.Equal(t, http.StatusForbidden, resp.StatusCode)
		} else {
			require.NoError(t, err)
			require.Equal(t, http.StatusCreated, resp.StatusCode)
		}

		require.NoError(t, resp.Body.Close())
	}

	// local driver's bind-mount trick is forbidden
	f([]mount.Mount{{
		Type: mount.TypeVolume,
		VolumeOptions: &mount.VolumeOptions{
			DriverConfig: &mount.Driver{Options: map[string]string{"type": "none", "o": "bind", "device": "/etc"}},
		},
	}}, nil, true)

	// a real filesystem type mounted via a device is forbidden
	f([]mount.Mount{{
		Type: mount.TypeVolume,
		VolumeOptions: &mount.VolumeOptions{
			DriverConfig: &mount.Driver{Options: map[string]string{"type": "ext4", "device": "/dev/sda1"}},
		},
	}}, nil, true)

	// bind Type match is case-insensitive
	f([]mount.Mount{{Type: "BIND"}}, nil, true)

	// referencing an existing volume that is actually bind-backed is forbidden
	f([]mount.Mount{{Type: mount.TypeVolume, Source: "evilvol"}}, map[string]volume.Volume{
		"evilvol": {Name: "evilvol", Driver: "local", Options: map[string]string{"type": "none", "o": "bind", "device": "/etc"}},
	}, true)

	// referencing an existing normal volume is allowed
	f([]mount.Mount{{Type: mount.TypeVolume, Source: "normalvol"}}, map[string]volume.Volume{
		"normalvol": {Name: "normalvol", Driver: "local"},
	}, false)
}

// TestCheckServiceBodyRestrictions_BindVolumeOnOtherClusterNode ensures a bind-backed volume is
// caught even when it only exists on a cluster node other than the one the default client reaches.
// A local-driver volume is scoped to the node it was created on: checking a single node cannot
// rule out a same-named bind-backed volume on a different node that the Swarm scheduler could
// still place the task on.
func TestCheckServiceBodyRestrictions_BindVolumeOnOtherClusterNode(t *testing.T) {
	t.Parallel()

	newNodeServer := func(t *testing.T, handler http.HandlerFunc) *httptest.Server {
		t.Helper()

		srv := httptest.NewServer(handler)
		t.Cleanup(srv.Close)

		return srv
	}

	nodeAServer := newNodeServer(t, func(w http.ResponseWriter, r *http.Request) {
		if path.Base(r.URL.Path) == "nodes" {
			data, err := json.Marshal([]swarm.Node{
				{ID: "node-a", Description: swarm.NodeDescription{Hostname: "node-a"}},
				{ID: "node-b", Description: swarm.NodeDescription{Hostname: "node-b"}},
			})
			if !assert.NoError(t, err) {
				return
			}

			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write(data)

			return
		}

		http.NotFound(w, r)
	})

	nodeBServer := newNodeServer(t, func(w http.ResponseWriter, r *http.Request) {
		if path.Base(r.URL.Path) == "evilvol" {
			vol := volume.Volume{Name: "evilvol", Driver: "local", Options: map[string]string{"type": "none", "o": "bind", "device": "/etc"}}

			w.Header().Set("Content-Type", "application/json")
			assert.NoError(t, json.NewEncoder(w).Encode(vol))

			return
		}

		http.NotFound(w, r)
	})

	newClientFor := func(url string) *client.Client {
		cli, err := client.NewClientWithOpts(client.WithHost(url), client.WithHTTPClient(http.DefaultClient))
		require.NoError(t, err)

		return cli
	}

	getClient := func(nodeName string) (*client.Client, error) {
		if nodeName == "node-b" {
			return newClientFor(nodeBServer.URL), nil
		}

		return newClientFor(nodeAServer.URL), nil
	}

	spec := swarm.ServiceSpec{
		TaskTemplate: swarm.TaskSpec{
			ContainerSpec: &swarm.ContainerSpec{
				Mounts: []mount.Mount{{Type: mount.TypeVolume, Source: "evilvol"}},
			},
		},
	}

	data, err := json.Marshal(spec)
	require.NoError(t, err)

	req, err := http.NewRequestWithContext(t.Context(), http.MethodPost, "http://unused/services/create", bytes.NewReader(data))
	require.NoError(t, err)

	err = CheckServiceBodyRestrictions(req, &restrictiveSettings, getClient)
	require.ErrorIs(t, err, ErrBindMountsForbidden)
}
