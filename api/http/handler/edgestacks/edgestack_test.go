package edgestacks

import (
	"strconv"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/edge/edgestacks"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/jwt"
	"github.com/portainer/portainer/api/roar"

	"github.com/pkg/errors"
	"github.com/stretchr/testify/require"
)

// Helpers
func setupHandler(t *testing.T) (*Handler, string) {
	t.Helper()

	_, store := datastore.MustNewTestStore(t, true, true)

	jwtService, err := jwt.NewService("1h", store)
	if err != nil {
		t.Fatal(err)
	}

	user := &portainer.User{ID: 2, Username: "admin", Role: portainer.AdministratorRole}
	if err := store.User().Create(user); err != nil {
		t.Fatal(err)
	}

	apiKeyService := apikey.NewAPIKeyService(store.APIKeyRepository(), store.User())
	rawAPIKey, _, err := apiKeyService.GenerateApiKey(*user, "test")
	if err != nil {
		t.Fatal(err)
	}

	fs, err := filesystem.NewService(t.TempDir(), "")
	if err != nil {
		t.Fatal(err)
	}

	handler := NewHandler(
		security.NewRequestBouncer(store, jwtService, apiKeyService),
		store,
		edgestacks.NewService(store),
	)

	handler.FileService = fs

	settings, err := handler.DataStore.Settings().Settings()
	require.NoError(t, err)

	settings.EnableEdgeComputeFeatures = true

	err = handler.DataStore.Settings().UpdateSettings(settings)
	require.NoError(t, err)

	handler.GitService = testhelpers.NewGitService(errors.New("Clone error"), "git-service-id")

	return handler, rawAPIKey
}

func createEndpointWithId(t *testing.T, store dataservices.DataStore, endpointID portainer.EndpointID) portainer.Endpoint {
	t.Helper()

	endpoint := portainer.Endpoint{
		ID:              endpointID,
		Name:            "test-endpoint-" + strconv.Itoa(int(endpointID)),
		Type:            portainer.EdgeAgentOnDockerEnvironment,
		URL:             "https://portainer.io:9443",
		EdgeID:          "edge-id",
		LastCheckInDate: time.Now().Unix(),
	}

	err := store.Endpoint().Create(&endpoint)
	require.NoError(t, err)

	return endpoint
}

func createEndpoint(t *testing.T, store dataservices.DataStore) portainer.Endpoint {
	return createEndpointWithId(t, store, 5)
}

func createEdgeStack(t *testing.T, store dataservices.DataStore, endpointID portainer.EndpointID) portainer.EdgeStack {
	t.Helper()

	edgeGroup := portainer.EdgeGroup{
		ID:           1,
		Name:         "EdgeGroup 1",
		Dynamic:      false,
		TagIDs:       nil,
		EndpointIDs:  roar.FromSlice([]portainer.EndpointID{endpointID}),
		PartialMatch: false,
	}

	err := store.EdgeGroup().Create(&edgeGroup)
	require.NoError(t, err)

	edgeStackID := portainer.EdgeStackID(14)
	edgeStack := portainer.EdgeStack{
		ID:             edgeStackID,
		Name:           "test-edge-stack-" + strconv.Itoa(int(edgeStackID)),
		CreationDate:   time.Now().Unix(),
		EdgeGroups:     []portainer.EdgeGroupID{edgeGroup.ID},
		ProjectPath:    "/project/path",
		EntryPoint:     "entrypoint",
		Version:        237,
		ManifestPath:   "/manifest/path",
		DeploymentType: portainer.EdgeStackDeploymentKubernetes,
	}

	endpointRelation := portainer.EndpointRelation{
		EndpointID: endpointID,
		EdgeStacks: map[portainer.EdgeStackID]bool{
			edgeStack.ID: true,
		},
	}

	err = store.EdgeStack().Create(edgeStack.ID, &edgeStack)
	require.NoError(t, err)

	err = store.EndpointRelation().Create(&endpointRelation)
	require.NoError(t, err)

	return edgeStack
}

func createEdgeGroup(t *testing.T, store dataservices.DataStore) portainer.EdgeGroup {
	edgeGroup := portainer.EdgeGroup{
		ID:   1,
		Name: "EdgeGroup 1",
	}

	err := store.EdgeGroup().Create(&edgeGroup)
	require.NoError(t, err)

	return edgeGroup
}
