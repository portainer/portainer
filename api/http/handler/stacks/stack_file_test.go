package stacks

import (
	"net/http"
	"net/http/httptest"
	"os"
	"strconv"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/source"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/filesystem"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/internal/testhelpers"

	"encoding/json"

	"github.com/stretchr/testify/require"
)

func TestStackFile_GitPendingRedeploy_Returns409(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	_, err := mockCreateUser(store)
	require.NoError(t, err)

	endpoint, err := mockCreateEndpoint(store)
	require.NoError(t, err)

	tempDir := t.TempDir()
	fileService, err := filesystem.NewService(tempDir, "")
	require.NoError(t, err)

	handler := NewHandler(testhelpers.NewTestRequestBouncer(), nil)
	handler.FileService = fileService
	handler.DataStore = store

	const stackID = portainer.StackID(1)

	src := &portainer.Source{
		Type: portainer.SourceTypeGit,
		Git: &gittypes.GitSource{
			URL: "https://github.com/portainer/portainer.git",
		},
	}
	require.NoError(t, store.Source().Create(source.InsecureNewAdminContext(), src))

	wf := &portainer.Workflow{Artifacts: []portainer.Artifact{{
		StackID: stackID,
		Files:   []portainer.ArtifactFile{{SourceID: src.ID}},
	}}}
	require.NoError(t, store.Workflow().Create(wf))

	stack := &portainer.Stack{
		ID:         stackID,
		EndpointID: endpoint.ID,
		Type:       portainer.DockerComposeStack,
		WorkflowID: wf.ID,
		CurrentDeploymentInfo: &portainer.StackDeploymentInfo{
			RepositoryURL:  "https://github.com/portainer/old-repo.git",
			ConfigFilePath: "docker-compose.yml",
		},
	}
	require.NoError(t, store.Stack().Create(stack))

	req := mockCreateStackRequestWithSecurityContext(
		http.MethodGet,
		"/stacks/"+strconv.Itoa(int(stack.ID))+"/file",
		nil,
	)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	require.Equal(t, http.StatusConflict, rr.Code)
}

func TestStackFile_MatchingGitSettings_ReturnsFileContent(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	_, err := mockCreateUser(store)
	require.NoError(t, err)

	endpoint, err := mockCreateEndpoint(store)
	require.NoError(t, err)

	tempDir := t.TempDir()
	fileService, err := filesystem.NewService(tempDir, "")
	require.NoError(t, err)

	handler := NewHandler(testhelpers.NewTestRequestBouncer(), nil)
	handler.FileService = fileService
	handler.DataStore = store

	const repoURL = "https://github.com/portainer/portainer.git"
	const configPath = "docker-compose.yml"
	const fileContent = "version: '3'\nservices:\n  web:\n    image: nginx\n"

	require.NoError(t, os.WriteFile(filesystem.JoinPaths(tempDir, configPath), []byte(fileContent), 0o644))

	stack := &portainer.Stack{
		ID:          2,
		EndpointID:  endpoint.ID,
		Type:        portainer.DockerComposeStack,
		ProjectPath: tempDir,
		EntryPoint:  configPath,
		CurrentDeploymentInfo: &portainer.StackDeploymentInfo{
			RepositoryURL:  repoURL,
			ConfigFilePath: configPath,
		},
		GitConfig: &gittypes.RepoConfig{
			URL:            repoURL,
			ConfigFilePath: configPath,
		},
	}
	require.NoError(t, store.Stack().Create(stack))

	req := mockCreateStackRequestWithSecurityContext(
		http.MethodGet,
		"/stacks/"+strconv.Itoa(int(stack.ID))+"/file",
		nil,
	)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	require.Equal(t, http.StatusOK, rr.Code)

	var resp stackFileResponse
	require.NoError(t, json.Unmarshal(rr.Body.Bytes(), &resp))
	require.Equal(t, fileContent, resp.StackFileContent)
}

func TestStackFile_KubernetesStackNamespaceAccess(t *testing.T) {
	t.Parallel()

	for _, tc := range kubernetesStackAccessCases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			handler := setupKubernetesStackAccess(t, tc.restrictDefaultNamespace)

			rr := serveAsUser(handler, tc.userID, "/stacks/"+strconv.Itoa(int(tc.stackID))+"/file")
			require.Equal(t, tc.expectedStatus, rr.Code, rr.Body.String())

			if tc.expectedStatus != http.StatusOK {
				require.NotContains(t, rr.Body.String(), "kind")
				return
			}

			var resp stackFileResponse
			require.NoError(t, json.Unmarshal(rr.Body.Bytes(), &resp))
			require.Equal(t, kubernetesAccessStacks[tc.stackID].manifest, resp.StackFileContent)
		})
	}
}

func TestStackFile_KubernetesStackPendingGitSettings(t *testing.T) {
	t.Parallel()

	handler := setupKubernetesStackAccess(t, false)

	const repoURL = "https://github.com/portainer/portainer"
	const stackID = portainer.StackID(100)

	projectPath := t.TempDir()
	require.NoError(t, os.WriteFile(filesystem.JoinPaths(projectPath, k8sAccessManifestFile), []byte(k8sAccessUndeclaredManifest), 0o644))

	src := &portainer.Source{Type: portainer.SourceTypeGit, Public: true, Git: &gittypes.GitSource{URL: repoURL}}
	require.NoError(t, handler.DataStore.Source().Create(source.InsecureNewAdminContext(), src))

	wf := &portainer.Workflow{Artifacts: []portainer.Artifact{{
		StackID: stackID,
		Files:   []portainer.ArtifactFile{{SourceID: src.ID, Path: "renamed.yml"}},
	}}}
	require.NoError(t, handler.DataStore.Workflow().Create(wf))

	require.NoError(t, handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.Stack().Create(&portainer.Stack{
			ID:                    stackID,
			Name:                  "pending",
			EndpointID:            k8sAccessEndpointID,
			Type:                  portainer.KubernetesStack,
			ProjectPath:           projectPath,
			EntryPoint:            "renamed.yml",
			WorkflowID:            wf.ID,
			CurrentDeploymentInfo: &portainer.StackDeploymentInfo{RepositoryURL: repoURL, ConfigFilePath: k8sAccessManifestFile},
		})
	}))

	rr := serveAsUser(handler, k8sAccessStandardUserID, "/stacks/100/file")
	require.Equal(t, http.StatusConflict, rr.Code, rr.Body.String())

	rr = serveAsUser(handler, k8sAccessStandardUserID, "/stacks/100")
	require.Equal(t, http.StatusOK, rr.Code, rr.Body.String())
}
