package websocket

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	dockerclient "github.com/portainer/portainer/api/docker/client"
	"github.com/portainer/portainer/api/docker/consts"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/stacks/stackutils"

	"github.com/docker/docker/api/types/container"
	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const (
	dockerTestEndpointID = 3
	dockerTestAPIVersion = "1.51"

	attachUpgradeFailedMessage = "An error occurred during websocket attach operation"
	execUpgradeFailedMessage   = "An error occurred during websocket exec operation"
	verifyAccessFailedMessage  = "Unable to verify access to the container"
	containerDeniedMessage     = "Permission denied to access container"
)

var (
	ownedContainerID     = strings.Repeat("a", 64)
	teamContainerID      = strings.Repeat("b", 64)
	unmanagedContainerID = strings.Repeat("c", 64)
	stackContainerID     = strings.Repeat("d", 64)
	ownedExecID          = strings.Repeat("e", 64)
	unmanagedExecID      = strings.Repeat("f", 64)
)

type dockerAccessFixture struct {
	handler  *Handler
	admin    portainer.User
	owner    portainer.User
	other    portainer.User
	teammate portainer.User
}

// newDockerAccessFixture builds a handler for a Docker environment served by a mock Docker API.
// The owner owns ownedContainerID directly and stackContainerID through its compose stack, the
// teammate reaches teamContainerID through a team, and unmanagedContainerID has no resource control
func newDockerAccessFixture(t *testing.T) *dockerAccessFixture {
	t.Helper()

	inspect := func(id string, labels map[string]string) container.InspectResponse {
		return container.InspectResponse{
			ContainerJSONBase: &container.ContainerJSONBase{ID: id},
			Config:            &container.Config{Labels: labels},
		}
	}

	routes := map[string]any{
		"/containers/" + ownedContainerID + "/json":     inspect(ownedContainerID, nil),
		"/containers/aaaa/json":                         inspect(ownedContainerID, nil),
		"/containers/" + teamContainerID + "/json":      inspect(teamContainerID, nil),
		"/containers/" + unmanagedContainerID + "/json": inspect(unmanagedContainerID, nil),
		"/containers/" + stackContainerID + "/json":     inspect(stackContainerID, map[string]string{consts.ComposeStackNameLabel: "web"}),
		"/exec/" + ownedExecID + "/json":                container.ExecInspect{ExecID: ownedExecID, ContainerID: ownedContainerID},
		"/exec/" + unmanagedExecID + "/json":            container.ExecInspect{ExecID: unmanagedExecID, ContainerID: unmanagedContainerID},
	}

	mux := http.NewServeMux()
	mux.HandleFunc("HEAD /_ping", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Api-Version", dockerTestAPIVersion)
	})

	for path, body := range routes {
		mux.HandleFunc("GET /v"+dockerTestAPIVersion+path, func(w http.ResponseWriter, _ *http.Request) {
			err := json.NewEncoder(w).Encode(body)
			assert.NoError(t, err)
		})
	}

	for _, path := range []string{"/containers/dead/json", "/exec/dead/json"} {
		mux.HandleFunc("GET /v"+dockerTestAPIVersion+path, func(w http.ResponseWriter, _ *http.Request) {
			http.Error(w, "docker failure", http.StatusInternalServerError)
		})
	}

	srv := httptest.NewServer(mux)
	t.Cleanup(srv.Close)

	handler, _ := newWebsocketTestHandler(t)
	handler.DockerClientFactory = dockerclient.NewClientFactory(nil, nil)

	f := &dockerAccessFixture{
		handler:  handler,
		admin:    portainer.User{Username: "admin", Role: portainer.AdministratorRole},
		owner:    portainer.User{Username: "owner", Role: portainer.StandardUserRole},
		other:    portainer.User{Username: "other", Role: portainer.StandardUserRole},
		teammate: portainer.User{Username: "teammate", Role: portainer.StandardUserRole},
	}

	err := handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		for _, user := range []*portainer.User{&f.admin, &f.owner, &f.other, &f.teammate} {
			if err := tx.User().Create(user); err != nil {
				return err
			}
		}

		team := &portainer.Team{Name: "team"}
		if err := tx.Team().Create(team); err != nil {
			return err
		}

		if err := tx.TeamMembership().Create(&portainer.TeamMembership{UserID: f.teammate.ID, TeamID: team.ID, Role: portainer.TeamMember}); err != nil {
			return err
		}

		if err := tx.Endpoint().Create(&portainer.Endpoint{
			ID:      dockerTestEndpointID,
			Name:    "docker-env",
			Type:    portainer.DockerEnvironment,
			URL:     srv.URL,
			GroupID: 1,
			UserAccessPolicies: portainer.UserAccessPolicies{
				f.owner.ID:    {},
				f.other.ID:    {},
				f.teammate.ID: {},
			},
		}); err != nil {
			return err
		}

		for _, rc := range []*portainer.ResourceControl{
			authorization.NewPrivateResourceControl(ownedContainerID, portainer.ContainerResourceControl, f.owner.ID),
			authorization.NewRestrictedResourceControl(teamContainerID, portainer.ContainerResourceControl, nil, []portainer.TeamID{team.ID}),
			authorization.NewPrivateResourceControl(stackutils.ResourceControlID(dockerTestEndpointID, "web"), portainer.StackResourceControl, f.owner.ID),
		} {
			if err := tx.ResourceControl().Create(rc); err != nil {
				return err
			}
		}

		return nil
	})
	require.NoError(t, err)

	return f
}
