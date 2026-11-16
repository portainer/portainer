package endpoints

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"path"
	"slices"
	"strconv"
	"strings"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/datastore"
	dockerclient "github.com/portainer/portainer/api/docker/client"
	"github.com/portainer/portainer/api/docker/consts"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/jwt"
	"github.com/portainer/portainer/api/uac"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/swarm"
	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const (
	forceUpdateEndpointID  portainer.EndpointID = 1
	forceUpdateNoAccessEnv portainer.EndpointID = 2
	forceUpdateStackName                        = "mystack"
	brokenServiceRef                            = "svc-broken"
)

// newSwarmMockServer returns a test HTTP server that mimics the Docker API for the force update handler.
// Services are looked up by ID or name; the returned func lists the service IDs sent to /services/{id}/update.
func newSwarmMockServer(t *testing.T, services []swarm.Service) (dockerURL string, updated func() []string) {
	t.Helper()

	// no lock needed: the update is recorded before the response is written, and the test only reads it
	// after the handler has received that response
	var updatedIDs []string

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		urlPath := r.URL.Path

		switch {
		case urlPath == "/_ping":
			w.Header().Set("API-Version", "1.41")
			_, _ = w.Write([]byte("OK"))

		case strings.HasSuffix(urlPath, "/services/"+brokenServiceRef):
			w.WriteHeader(http.StatusInternalServerError)

		case r.Method == http.MethodPost && strings.HasSuffix(urlPath, "/update"):
			updatedIDs = append(updatedIDs, path.Base(path.Dir(urlPath)))
			_ = json.NewEncoder(w).Encode(swarm.ServiceUpdateResponse{})

		case strings.Contains(urlPath, "/services/"):
			ref := path.Base(urlPath)
			i := slices.IndexFunc(services, func(s swarm.Service) bool { return s.ID == ref || s.Spec.Name == ref })
			if i == -1 {
				w.WriteHeader(http.StatusNotFound)
				_ = json.NewEncoder(w).Encode(map[string]string{"message": "service not found"})
				return
			}
			_ = json.NewEncoder(w).Encode(services[i])

		case strings.HasSuffix(urlPath, "/containers/json"):
			_ = json.NewEncoder(w).Encode([]container.Summary{})

		default:
			// not 404, so an unexpected call cannot pass for a missing service
			w.WriteHeader(http.StatusInternalServerError)
		}
	}))
	t.Cleanup(srv.Close)

	return "tcp://" + strings.TrimPrefix(srv.URL, "http://"), func() []string { return updatedIDs }
}

func newForceUpdateService(id, name string, labels map[string]string) swarm.Service {
	return swarm.Service{
		ID:   id,
		Spec: swarm.ServiceSpec{Annotations: swarm.Annotations{Name: name, Labels: labels}},
	}
}

func TestEndpointForceUpdateService(t *testing.T) {
	const (
		adminUserID    portainer.UserID = 1
		standardUserID portainer.UserID = 2
		teamID         portainer.TeamID = 1
	)

	readWrite := portainer.ReadWriteAccessLevel

	services := []swarm.Service{
		newForceUpdateService("svc-no-rc", "no-rc", nil),
		newForceUpdateService("svc-admin-only", "admin-only", nil),
		newForceUpdateService("svc-private", "private", nil),
		newForceUpdateService("svc-team", "team", nil),
		newForceUpdateService("svc-public", "public", nil),
		newForceUpdateService("svc-stack", "stack", map[string]string{consts.SwarmStackNameLabel: forceUpdateStackName}),
	}

	resourceControls := []portainer.ResourceControl{
		{
			ResourceID:         "svc-admin-only",
			Type:               portainer.ServiceResourceControl,
			AdministratorsOnly: true,
		},
		{
			ResourceID:   "svc-private",
			Type:         portainer.ServiceResourceControl,
			UserAccesses: []portainer.UserResourceAccess{{UserID: standardUserID, AccessLevel: readWrite}},
		},
		{
			ResourceID:   "svc-team",
			Type:         portainer.ServiceResourceControl,
			TeamAccesses: []portainer.TeamResourceAccess{{TeamID: teamID, AccessLevel: readWrite}},
		},
		{
			ResourceID: "svc-public",
			Type:       portainer.ServiceResourceControl,
			Public:     true,
		},
		{
			ResourceID:   uac.StackResourceControlID(forceUpdateEndpointID, forceUpdateStackName),
			Type:         portainer.StackResourceControl,
			UserAccesses: []portainer.UserResourceAccess{{UserID: standardUserID, AccessLevel: readWrite}},
		},
	}

	tests := []struct {
		name            string
		userID          portainer.UserID
		endpointID      portainer.EndpointID
		serviceRef      string
		expectedStatus  int
		expectedUpdated []string
	}{
		{
			name:           "standard user without environment access is denied",
			userID:         standardUserID,
			endpointID:     forceUpdateNoAccessEnv,
			serviceRef:     "svc-public",
			expectedStatus: http.StatusForbidden,
		},
		{
			name:           "standard user without resource control gets not found",
			userID:         standardUserID,
			serviceRef:     "svc-no-rc",
			expectedStatus: http.StatusNotFound,
		},
		{
			name:           "standard user on administrators only service gets not found",
			userID:         standardUserID,
			serviceRef:     "svc-admin-only",
			expectedStatus: http.StatusNotFound,
		},
		{
			name:            "standard user with private resource control is allowed",
			userID:          standardUserID,
			serviceRef:      "svc-private",
			expectedStatus:  http.StatusOK,
			expectedUpdated: []string{"svc-private"},
		},
		{
			name:            "standard user with team resource control is allowed",
			userID:          standardUserID,
			serviceRef:      "svc-team",
			expectedStatus:  http.StatusOK,
			expectedUpdated: []string{"svc-team"},
		},
		{
			name:            "standard user with public resource control is allowed",
			userID:          standardUserID,
			serviceRef:      "svc-public",
			expectedStatus:  http.StatusOK,
			expectedUpdated: []string{"svc-public"},
		},
		{
			name:            "standard user with stack resource control is allowed",
			userID:          standardUserID,
			serviceRef:      "svc-stack",
			expectedStatus:  http.StatusOK,
			expectedUpdated: []string{"svc-stack"},
		},
		{
			name:            "name reference is authorized and updated by full id",
			userID:          standardUserID,
			serviceRef:      "private",
			expectedStatus:  http.StatusOK,
			expectedUpdated: []string{"svc-private"},
		},
		{
			name:           "name reference to a denied service gets not found",
			userID:         standardUserID,
			serviceRef:     "admin-only",
			expectedStatus: http.StatusNotFound,
		},
		{
			name:           "standard user on unknown service gets not found",
			userID:         standardUserID,
			serviceRef:     "svc-unknown",
			expectedStatus: http.StatusNotFound,
		},
		{
			name:            "admin is allowed on administrators only service",
			userID:          adminUserID,
			serviceRef:      "svc-admin-only",
			expectedStatus:  http.StatusOK,
			expectedUpdated: []string{"svc-admin-only"},
		},
		{
			name:           "admin on unknown service gets not found",
			userID:         adminUserID,
			serviceRef:     "svc-unknown",
			expectedStatus: http.StatusNotFound,
		},
		{
			name:           "standard user on daemon error gets server error",
			userID:         standardUserID,
			serviceRef:     brokenServiceRef,
			expectedStatus: http.StatusInternalServerError,
		},
		{
			name:           "admin on daemon error gets server error",
			userID:         adminUserID,
			serviceRef:     brokenServiceRef,
			expectedStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dockerURL, updated := newSwarmMockServer(t, services)

			_, store := datastore.MustNewTestStore(t, true, true)

			admin := &portainer.User{ID: adminUserID, Username: "admin", Role: portainer.AdministratorRole}
			standardUser := &portainer.User{ID: standardUserID, Username: "standard", Role: portainer.StandardUserRole}
			require.NoError(t, store.User().Create(admin))
			require.NoError(t, store.User().Create(standardUser))
			require.NoError(t, store.Team().Create(&portainer.Team{ID: teamID, Name: "team"}))
			require.NoError(t, store.TeamMembership().Create(
				&portainer.TeamMembership{UserID: standardUserID, TeamID: teamID, Role: portainer.TeamMember},
			))

			require.NoError(t, store.Endpoint().Create(&portainer.Endpoint{
				ID: forceUpdateEndpointID, Name: "swarm", GroupID: 1, Type: portainer.DockerEnvironment, URL: dockerURL,
				UserAccessPolicies: portainer.UserAccessPolicies{standardUserID: {}},
			}))
			require.NoError(t, store.Endpoint().Create(&portainer.Endpoint{
				ID: forceUpdateNoAccessEnv, Name: "no-access", GroupID: 1, Type: portainer.DockerEnvironment, URL: dockerURL,
			}))

			for _, rc := range resourceControls {
				require.NoError(t, store.ResourceControl().Create(&rc))
			}

			jwtService, err := jwt.NewService("1h", store)
			require.NoError(t, err)

			bouncer := security.NewRequestBouncer(
				t.Context(),
				store,
				jwtService,
				apikey.NewAPIKeyService(store.APIKeyRepository(), store.User()),
			)
			handler := NewHandler(bouncer)
			handler.DataStore = store
			handler.DockerClientFactory = dockerclient.NewClientFactory(nil, nil)

			user, err := store.User().Read(tt.userID)
			require.NoError(t, err)

			endpointID := tt.endpointID
			if endpointID == 0 {
				endpointID = forceUpdateEndpointID
			}

			body, err := json.Marshal(forceUpdateServicePayload{ServiceID: tt.serviceRef})
			require.NoError(t, err)

			req := httptest.NewRequest(
				http.MethodPut,
				"/endpoints/"+strconv.Itoa(int(endpointID))+"/forceupdateservice",
				bytes.NewReader(body),
			)
			token, _, err := jwtService.GenerateToken(
				&portainer.TokenData{ID: user.ID, Username: user.Username, Role: user.Role},
			)
			require.NoError(t, err)
			testhelpers.AddTestSecurityCookie(req, token)

			rr := httptest.NewRecorder()
			handler.ServeHTTP(rr, req)

			assert.Equal(t, tt.expectedStatus, rr.Code, rr.Body.String())
			assert.Equal(t, tt.expectedUpdated, updated())
			if tt.expectedStatus == http.StatusNotFound {
				assert.JSONEq(
					t,
					`{"message":"service not found","details":"Service not found"}`,
					rr.Body.String(),
					"denied and missing services must get an identical response",
				)
			}
		})
	}
}
