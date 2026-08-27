package stackbuilders

import (
	"context"
	"errors"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/source"
	"github.com/portainer/portainer/api/datastore"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/gitops/workflows"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

var adminUserContext = source.InsecureNewAdminContext()

// stubFileService satisfies portainer.FileService for git builder tests.
type stubFileService struct {
	portainer.FileService
}

func (s *stubFileService) GetStackProjectPath(stackIdentifier string) string {
	return "/data/compose/" + stackIdentifier
}

func newGitMethodBuilder(t *testing.T, commitHash string) *GitMethodStackBuilder {
	t.Helper()
	_, store := datastore.MustNewTestStore(t, false, false)
	require.NoError(t, store.User().Create(&portainer.User{ID: 1, Username: "testuser", Role: portainer.AdministratorRole}))
	return &GitMethodStackBuilder{
		StackBuilder: StackBuilder{
			stack:       &portainer.Stack{},
			fileService: &stubFileService{},
			dataStore:   store,
		},
		gitService: testhelpers.NewGitService(nil, commitHash),
	}
}

func TestGitMethodStackBuilder_WithSourceID_ReferencesExistingSource(t *testing.T) {
	t.Parallel()
	builder := newGitMethodBuilder(t, "abc123")
	builder.stack.ID = 1

	src := &portainer.Source{
		Name: "my-repo",
		Type: portainer.SourceTypeGit,
		Git: &gittypes.GitSource{
			URL: "https://github.com/org/private-repo",
			Authentication: &gittypes.GitAuthentication{
				Username: "git-user",
				Password: "git-token",
			},
		},
	}
	require.NoError(t, builder.dataStore.Source().Create(adminUserContext, src))

	payload := &StackPayload{
		RepositoryConfigPayload: RepositoryConfigPayload{
			SourceID:      src.ID,
			ReferenceName: "refs/heads/main",
		},
	}

	err := builder.prepare(context.Background(), payload, portainer.UserID(1))
	require.NoError(t, err)

	// Workflow Artifact must reference the existing Source — not a new one.
	referencedSourceID := builderWorkflowSourceID(t, builder)
	assert.Equal(t, src.ID, referencedSourceID)

	// Only one Source exists — no duplicate was created.
	allSources, err := builder.dataStore.Source().ReadAll(adminUserContext)
	require.NoError(t, err)
	assert.Len(t, allSources, 1)

	// The merged git config picks up the Source URL/auth.
	readSrc, artifact, err := workflows.GitSourceAndArtifactForStack(builder.dataStore, adminUserContext, builder.stack.WorkflowID, builder.stack.ID)
	require.NoError(t, err)
	merged := workflows.MergeSourceAndFile(readSrc, artifact)
	assert.Equal(t, "https://github.com/org/private-repo", merged.URL)
	assert.Equal(t, "refs/heads/main", merged.ReferenceName)
	require.NotNil(t, merged.Authentication)
	assert.Equal(t, "git-user", merged.Authentication.Username)
}

func TestGitMethodStackBuilder_WithSourceID_PersistsHealthyStatusOnSuccess(t *testing.T) {
	t.Parallel()
	builder := newGitMethodBuilder(t, "abc123")
	builder.stack.ID = 1

	src := &portainer.Source{
		Name: "my-repo",
		Type: portainer.SourceTypeGit,
		Git:  &gittypes.GitSource{URL: "https://github.com/org/private-repo"},
	}
	require.NoError(t, builder.dataStore.Source().Create(adminUserContext, src))

	payload := &StackPayload{
		RepositoryConfigPayload: RepositoryConfigPayload{
			SourceID:      src.ID,
			ReferenceName: "refs/heads/main",
		},
	}

	err := builder.prepare(t.Context(), payload, portainer.UserID(1))
	require.NoError(t, err)

	updatedSrc, err := builder.dataStore.Source().Read(adminUserContext, src.ID)
	require.NoError(t, err)
	assert.Equal(t, portainer.SourceStatusHealthy, updatedSrc.Status)
	assert.NotZero(t, updatedSrc.LastSync)
}

func TestGitMethodStackBuilder_StandardUserWithReadAccessCanDeployFromAdminSource(t *testing.T) {
	t.Parallel()
	builder := newGitMethodBuilder(t, "abc123")

	standardUser := &portainer.User{Username: "standarduser", Role: portainer.StandardUserRole}
	require.NoError(t, builder.dataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.User().Create(standardUser)
	}))

	publicSrc := &portainer.Source{
		Name:   "public-repo",
		Type:   portainer.SourceTypeGit,
		Git:    &gittypes.GitSource{URL: "https://github.com/org/public-repo"},
		Public: true,
	}
	require.NoError(t, builder.dataStore.Source().Create(adminUserContext, publicSrc))

	restrictedSrc := &portainer.Source{
		Name:         "restricted-repo",
		Type:         portainer.SourceTypeGit,
		Git:          &gittypes.GitSource{URL: "https://github.com/org/restricted-repo"},
		UserAccesses: []portainer.UserID{standardUser.ID},
	}
	require.NoError(t, builder.dataStore.Source().Create(adminUserContext, restrictedSrc))

	for i, src := range []*portainer.Source{publicSrc, restrictedSrc} {
		builder.stack.ID = portainer.StackID(10 + i)
		payload := &StackPayload{
			RepositoryConfigPayload: RepositoryConfigPayload{
				SourceID:      src.ID,
				ReferenceName: "refs/heads/main",
			},
		}

		err := builder.prepare(t.Context(), payload, standardUser.ID)
		require.NoError(t, err)

		updatedSrc, err := builder.dataStore.Source().Read(adminUserContext, src.ID)
		require.NoError(t, err)
		assert.Equal(t, portainer.SourceStatusHealthy, updatedSrc.Status)
		assert.NotZero(t, updatedSrc.LastSync)
	}
}

func TestGitMethodStackBuilder_WithSourceID_PersistsErrorStatusOnCloneFailure(t *testing.T) {
	t.Parallel()
	builder := newGitMethodBuilder(t, "abc123")
	cloneErr := errors.New("failed to clone")
	builder.gitService = testhelpers.NewGitService(cloneErr, "abc123")
	builder.stack.ID = 1

	src := &portainer.Source{
		Name: "my-repo",
		Type: portainer.SourceTypeGit,
		Git:  &gittypes.GitSource{URL: "https://github.com/org/private-repo"},
	}
	require.NoError(t, builder.dataStore.Source().Create(adminUserContext, src))

	payload := &StackPayload{
		RepositoryConfigPayload: RepositoryConfigPayload{
			SourceID:      src.ID,
			ReferenceName: "refs/heads/main",
		},
	}

	err := builder.prepare(t.Context(), payload, portainer.UserID(1))
	require.Error(t, err)

	updatedSrc, err := builder.dataStore.Source().Read(adminUserContext, src.ID)
	require.NoError(t, err)
	assert.Equal(t, portainer.SourceStatusError, updatedSrc.Status)
	assert.Contains(t, updatedSrc.StatusError, cloneErr.Error())
	assert.Zero(t, updatedSrc.LastSync)
}

func TestGitMethodStackBuilder_WithMissingSourceID_ReturnsError(t *testing.T) {
	t.Parallel()
	builder := newGitMethodBuilder(t, "abc123")
	builder.stack.ID = 2

	payload := &StackPayload{
		RepositoryConfigPayload: RepositoryConfigPayload{
			SourceID: portainer.SourceID(999), // does not exist
		},
	}

	err := builder.prepare(context.Background(), payload, portainer.UserID(1))
	require.Error(t, err)
}

func TestGitMethodStackBuilder_WithoutSourceID_InlinePathStillWorks(t *testing.T) {
	t.Parallel()
	builder := newGitMethodBuilder(t, "feedcafe")
	builder.stack.ID = 4

	payload := &StackPayload{
		RepositoryConfigPayload: RepositoryConfigPayload{
			URL:           "https://github.com/org/public-repo",
			ReferenceName: "refs/heads/main",
		},
	}

	err := builder.prepare(context.Background(), payload, portainer.UserID(1))
	require.NoError(t, err)

	// A Source was created via the inline path.
	allSources, err := builder.dataStore.Source().ReadAll(adminUserContext)
	require.NoError(t, err)
	assert.Len(t, allSources, 1)
	assert.Equal(t, "https://github.com/org/public-repo", allSources[0].Git.URL)
}

func TestGitMethodStackBuilder_WritesAutoUpdateIntervalToNewSource(t *testing.T) {
	t.Parallel()
	builder := newGitMethodBuilder(t, "feedcafe")
	builder.stack.ID = 4

	payload := &StackPayload{
		AutoUpdate: &portainer.AutoUpdateSettings{Interval: "5m"},
		RepositoryConfigPayload: RepositoryConfigPayload{
			URL:           "https://github.com/org/public-repo",
			ReferenceName: "refs/heads/main",
		},
	}

	err := builder.prepare(context.Background(), payload, portainer.UserID(1))
	require.NoError(t, err)

	allSources, err := builder.dataStore.Source().ReadAll(adminUserContext)
	require.NoError(t, err)
	require.Len(t, allSources, 1)
	assert.Equal(t, "5m", allSources[0].Interval)
}

func TestGitMethodStackBuilder_WritesAutoUpdateIntervalToExistingSource(t *testing.T) {
	t.Parallel()
	builder := newGitMethodBuilder(t, "abc123")
	builder.stack.ID = 1

	src := &portainer.Source{
		Name: "my-repo",
		Type: portainer.SourceTypeGit,
		Git:  &gittypes.GitSource{URL: "https://github.com/org/private-repo"},
	}
	require.NoError(t, builder.dataStore.Source().Create(adminUserContext, src))

	payload := &StackPayload{
		AutoUpdate: &portainer.AutoUpdateSettings{Interval: "5m"},
		RepositoryConfigPayload: RepositoryConfigPayload{
			SourceID:      src.ID,
			ReferenceName: "refs/heads/main",
		},
	}

	err := builder.prepare(context.Background(), payload, portainer.UserID(1))
	require.NoError(t, err)

	updatedSrc, err := builder.dataStore.Source().Read(adminUserContext, src.ID)
	require.NoError(t, err)
	assert.Equal(t, "5m", updatedSrc.Interval)
}

// builderWorkflowSourceID returns the first SourceID referenced by the Workflow Artifact for this stack.
func builderWorkflowSourceID(t *testing.T, builder *GitMethodStackBuilder) portainer.SourceID {
	t.Helper()
	require.NotZero(t, builder.stack.WorkflowID)

	wf, err := builder.dataStore.Workflow().Read(builder.stack.WorkflowID)
	require.NoError(t, err)
	require.Len(t, wf.Artifacts, 1)
	require.Len(t, wf.Artifacts[0].Files, 1)
	return wf.Artifacts[0].Files[0].SourceID
}
