package docker

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"sync"
	"testing"

	portainer "github.com/portainer/portainer/api"
	dockerclient "github.com/portainer/portainer/api/docker/client"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/network"
	"github.com/stretchr/testify/require"
)

func TestApplyVersionConstraint(t *testing.T) {
	t.Parallel()
	initialNet := network.NetworkingConfig{
		EndpointsConfig: map[string]*network.EndpointSettings{
			"key1": {
				MacAddress: "mac1",
				EndpointID: "endpointID1",
			},
			"key2": {
				MacAddress: "mac2",
				EndpointID: "endpointID2",
			},
		},
	}

	f := func(currentVer string, constraint string, success, emptyMac bool) {
		t.Helper()

		transformedNet, err := applyVersionConstraint(currentVer, constraint, initialNet, clearMacAddrs)
		if success {
			require.NoError(t, err)
		} else {
			require.Error(t, err)
		}

		require.Len(t, transformedNet.EndpointsConfig, len(initialNet.EndpointsConfig))

		for k := range initialNet.EndpointsConfig {
			if emptyMac {
				require.NotEqual(t, initialNet.EndpointsConfig[k], transformedNet.EndpointsConfig[k])
				require.Empty(t, transformedNet.EndpointsConfig[k].MacAddress)

				continue
			}

			require.Equal(t, initialNet.EndpointsConfig[k], transformedNet.EndpointsConfig[k])
		}
	}

	f("1.45", "< 1.44", true, false)  // No transformation
	f("1.43", "< 1.44", true, true)   // Transformation
	f("a.b.", "< 1.44", true, false)  // Invalid current version
	f("1.45", "z 1.44", false, false) // Invalid version constraint
}

const (
	originalContainerID       = "original-container-id"
	originalContainerName     = "nginx"
	originalContainerFullName = "/" + originalContainerName
	replacementContainerID    = "replacement-container-id"
	networkID                 = "network-id"
)

var restoreRenameQuery = url.Values{"name": {originalContainerFullName}}.Encode()

type fakeEngine struct {
	mu       sync.Mutex
	calls    []*http.Request
	name     string
	running  bool
	networks map[string]bool

	newContainerCreated bool
	newContainerRemoved bool

	failRename     bool
	failDisconnect bool
	failNewStart   bool
}

func newFakeEngine() *fakeEngine {
	return &fakeEngine{
		name:     originalContainerFullName,
		running:  true,
		networks: map[string]bool{networkID: true},
	}
}

func (e *fakeEngine) originalContainerState() (name string, running bool, connected bool) {
	e.mu.Lock()
	defer e.mu.Unlock()

	return e.name, e.running, e.networks[networkID]
}

func (e *fakeEngine) newContainerState() (created bool, removed bool) {
	e.mu.Lock()
	defer e.mu.Unlock()

	return e.newContainerCreated, e.newContainerRemoved
}

type wantCall struct {
	method     string
	pathSuffix string
	wantQuery  string
}

// requireCallOrder checks steps appear in order among the recorded calls;
// unrelated calls may fall in between.
func requireCallOrder(t *testing.T, engine *fakeEngine, steps ...wantCall) {
	t.Helper()

	engine.mu.Lock()
	defer engine.mu.Unlock()

	matched := 0
	for _, c := range engine.calls {
		if matched == len(steps) {
			break
		}

		step := steps[matched]
		if c.Method == step.method && strings.HasSuffix(c.URL.Path, step.pathSuffix) && c.URL.RawQuery == step.wantQuery {
			matched++
		}
	}

	if matched < len(steps) {
		t.Fatalf("expected %s %s to happen next, in order", steps[matched].method, steps[matched].pathSuffix)
	}
}

// requireReconnectBeforeStart: starting before reconnect would leave the
// container running without its network attached.
func requireReconnectBeforeStart(t *testing.T, engine *fakeEngine) {
	t.Helper()

	requireCallOrder(t, engine,
		wantCall{http.MethodPost, "/networks/" + networkID + "/connect", ""},
		wantCall{http.MethodPost, "/containers/" + originalContainerID + "/start", ""},
	)
}

func newRecreateService(t *testing.T, engine *fakeEngine) (*ContainerService, *portainer.Endpoint) {
	t.Helper()

	mux := http.NewServeMux()

	mux.HandleFunc("/_ping", func(w http.ResponseWriter, r *http.Request) {})

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		engine.mu.Lock()
		defer engine.mu.Unlock()
		engine.calls = append(engine.calls, r)

		switch {
		case r.Method == http.MethodGet && strings.HasSuffix(r.URL.Path, "/containers/"+originalContainerID+"/json"):
			writeJSON(w, http.StatusOK, testInspectResponse())
		case r.Method == http.MethodPost && strings.HasSuffix(r.URL.Path, "/containers/"+originalContainerID+"/stop"):
			engine.running = false
			w.WriteHeader(http.StatusNoContent)
		case r.Method == http.MethodPost && strings.HasSuffix(r.URL.Path, "/containers/"+originalContainerID+"/rename"):
			newName := r.URL.Query().Get("name")
			if engine.failRename && strings.HasSuffix(newName, "-old") {
				writeError(w, http.StatusConflict, "name already in use")
				return
			}
			engine.name = newName
			w.WriteHeader(http.StatusNoContent)
		case r.Method == http.MethodPost && strings.HasSuffix(r.URL.Path, "/containers/"+originalContainerID+"/start"):
			engine.running = true
			w.WriteHeader(http.StatusNoContent)
		case r.Method == http.MethodPost && strings.HasSuffix(r.URL.Path, "/networks/"+networkID+"/disconnect"):
			if engine.failDisconnect {
				writeError(w, http.StatusInternalServerError, "endpoint not found")
				return
			}
			engine.networks[networkID] = false
			w.WriteHeader(http.StatusOK)
		case r.Method == http.MethodPost && strings.HasSuffix(r.URL.Path, "/networks/"+networkID+"/connect"):
			engine.networks[networkID] = true
			w.WriteHeader(http.StatusOK)
		case r.Method == http.MethodPost && strings.HasSuffix(r.URL.Path, "/containers/create"):
			engine.newContainerCreated = true
			writeJSON(w, http.StatusCreated, container.CreateResponse{ID: replacementContainerID})
		case r.Method == http.MethodPost && strings.HasSuffix(r.URL.Path, "/containers/"+replacementContainerID+"/start"):
			if engine.failNewStart {
				writeError(w, http.StatusInternalServerError, "failed to start")
				return
			}
			w.WriteHeader(http.StatusNoContent)
		case r.Method == http.MethodDelete && strings.HasSuffix(r.URL.Path, "/containers/"+replacementContainerID):
			engine.newContainerRemoved = true
			w.WriteHeader(http.StatusNoContent)
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	})

	srv := httptest.NewServer(mux)
	t.Cleanup(srv.Close)

	factory := dockerclient.NewClientFactory(nil, nil)
	endpoint := &portainer.Endpoint{Type: portainer.DockerEnvironment, URL: srv.URL}

	return NewContainerService(factory, nil), endpoint
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"message": message})
}

func testInspectResponse() container.InspectResponse {
	return container.InspectResponse{
		ContainerJSONBase: &container.ContainerJSONBase{
			ID:   originalContainerID,
			Name: originalContainerFullName,
		},
		Config: &container.Config{Image: "alpine:latest"},
		NetworkSettings: &container.NetworkSettings{
			Networks: map[string]*network.EndpointSettings{
				"netA": {NetworkID: networkID},
			},
		},
	}
}

func TestRecreate_RestoresOriginalContainerOnEarlyFailure(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name           string
		failRename     bool
		failDisconnect bool
		wantErr        string
	}{
		{name: "rename fails", failRename: true, wantErr: "rename container error"},
		{name: "network disconnect fails", failDisconnect: true, wantErr: "disconnect network from old container error"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			engine := newFakeEngine()
			engine.failRename = tt.failRename
			engine.failDisconnect = tt.failDisconnect
			service, endpoint := newRecreateService(t, engine)

			_, err := service.Recreate(context.Background(), endpoint, originalContainerID, false, "", "")
			require.ErrorContains(t, err, tt.wantErr)

			name, running, _ := engine.originalContainerState()
			require.Equal(t, originalContainerFullName, name, "container should end up back under its original name")
			require.True(t, running, "container should end up running again")

			requireCallOrder(t, engine, wantCall{http.MethodPost, "/containers/" + originalContainerID + "/rename", restoreRenameQuery})
			requireReconnectBeforeStart(t, engine)
		})
	}
}

func TestRecreate_CleansUpReplacementOnLaterFailure(t *testing.T) {
	t.Parallel()

	engine := newFakeEngine()
	engine.failNewStart = true
	service, endpoint := newRecreateService(t, engine)

	_, err := service.Recreate(context.Background(), endpoint, originalContainerID, false, "", "")
	require.ErrorContains(t, err, "start container error")

	created, removed := engine.newContainerState()
	require.True(t, created, "the replacement container should have been created")
	require.True(t, removed, "the failed replacement container should be cleaned up")

	name, oldRunning, connected := engine.originalContainerState()
	require.Equal(t, originalContainerFullName, name, "the original container should end up back under its original name")
	require.True(t, oldRunning, "the original container should end up running again")
	require.True(t, connected, "the original container should end up reconnected to its original network")

	// the replacement must be freed before the original can reuse its name
	requireCallOrder(t, engine,
		wantCall{http.MethodDelete, "/containers/" + replacementContainerID, ""},
		wantCall{http.MethodPost, "/containers/" + originalContainerID + "/rename", restoreRenameQuery},
	)
	requireReconnectBeforeStart(t, engine)
}
