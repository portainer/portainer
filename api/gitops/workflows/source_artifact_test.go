package workflows

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/source"
	"github.com/portainer/portainer/api/datastore"
	gittypes "github.com/portainer/portainer/api/git/types"

	"github.com/stretchr/testify/require"
)

func TestMergeSourceAndFile_NilSourceReturnsNil(t *testing.T) {
	t.Parallel()

	require.Nil(t, MergeSourceAndFile(nil, nil))
}

func TestMergeSourceAndFile_NilGitConfigReturnsNil(t *testing.T) {
	t.Parallel()

	src := &portainer.Source{Type: portainer.SourceTypeGit}
	require.Nil(t, MergeSourceAndFile(src, nil))
}

func TestMergeSourceAndFile_NilFileLeaveFileFieldsEmpty(t *testing.T) {
	t.Parallel()

	src := &portainer.Source{
		Git: &gittypes.GitSource{
			URL:           "https://github.com/example/repo",
			TLSSkipVerify: true,
			Authentication: &gittypes.GitAuthentication{
				Username: "user",
				Password: "pass",
			},
		},
	}

	cfg := MergeSourceAndFile(src, nil)
	require.NotNil(t, cfg)
	require.Equal(t, "https://github.com/example/repo", cfg.URL)
	require.True(t, cfg.TLSSkipVerify)
	require.Equal(t, "user", cfg.Authentication.Username)
	require.Empty(t, cfg.ReferenceName)
	require.Empty(t, cfg.ConfigFilePath)
	require.Empty(t, cfg.ConfigHash)
}

func TestMergeSourceAndFile_MergesAllFieldsFromFile(t *testing.T) {
	t.Parallel()

	src := &portainer.Source{
		Git: &gittypes.GitSource{
			URL:           "https://github.com/example/repo",
			TLSSkipVerify: true,
		},
	}
	file := &portainer.ArtifactFile{
		Path: "docker-compose.yml",
		Ref:  "refs/heads/main",
		Hash: "abc123",
	}

	cfg := MergeSourceAndFile(src, file)
	require.NotNil(t, cfg)
	require.Equal(t, "https://github.com/example/repo", cfg.URL)
	require.True(t, cfg.TLSSkipVerify)
	require.Equal(t, "refs/heads/main", cfg.ReferenceName)
	require.Equal(t, "docker-compose.yml", cfg.ConfigFilePath)
	require.Equal(t, "abc123", cfg.ConfigHash)
}

func TestGitSourceAndArtifactForStack_ZeroWorkflowIDReturnsNil(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var src *portainer.Source
	var file *portainer.ArtifactFile
	err := store.ViewTx(func(tx dataservices.DataStoreTx) error {
		var txErr error
		src, file, txErr = GitSourceAndArtifactForStack(tx, adminUserContext, 0, 1)
		return txErr
	})
	require.NoError(t, err)
	require.Nil(t, src)
	require.Nil(t, file)
}

func TestGitSourceAndArtifactForStack_ReturnsMatchingSourceAndFile(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var workflowID portainer.WorkflowID
	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		gitSrc := &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git:  &gittypes.GitSource{URL: "https://github.com/example/repo"},
		}
		err := tx.Source().Create(adminUserContext, gitSrc)
		require.NoError(t, err)

		wf := &portainer.Workflow{
			Artifacts: []portainer.Artifact{{
				StackID: 42,
				Files: []portainer.ArtifactFile{{
					SourceID: gitSrc.ID,
					Path:     "docker-compose.yml",
					Ref:      "refs/heads/main",
					Hash:     "abc123",
				}},
			}},
		}
		err = tx.Workflow().Create(wf)
		require.NoError(t, err)
		workflowID = wf.ID

		return nil
	})
	require.NoError(t, err)

	var src *portainer.Source
	var file *portainer.ArtifactFile
	err = store.ViewTx(func(tx dataservices.DataStoreTx) error {
		var txErr error
		src, file, txErr = GitSourceAndArtifactForStack(tx, adminUserContext, workflowID, 42)
		return txErr
	})
	require.NoError(t, err)
	require.NotNil(t, src)
	require.Equal(t, portainer.SourceTypeGit, src.Type)
	require.NotNil(t, file)
	require.Equal(t, "refs/heads/main", file.Ref)
	require.Equal(t, "docker-compose.yml", file.Path)
	require.Equal(t, "abc123", file.Hash)
}

func TestGitSourceAndArtifactForStack_NoMatchingArtifactReturnsNil(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var workflowID portainer.WorkflowID
	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git:  &gittypes.GitSource{URL: "https://github.com/example/repo"},
		}
		err := tx.Source().Create(adminUserContext, src)
		require.NoError(t, err)

		wf := &portainer.Workflow{
			Artifacts: []portainer.Artifact{{
				StackID: 1,
				Files:   []portainer.ArtifactFile{{SourceID: src.ID}},
			}},
		}
		err = tx.Workflow().Create(wf)
		require.NoError(t, err)
		workflowID = wf.ID

		return nil
	})
	require.NoError(t, err)

	var src *portainer.Source
	var file *portainer.ArtifactFile
	err = store.ViewTx(func(tx dataservices.DataStoreTx) error {
		var txErr error
		src, file, txErr = GitSourceAndArtifactForStack(tx, adminUserContext, workflowID, 99)
		return txErr
	})
	require.NoError(t, err)
	require.Nil(t, src)
	require.Nil(t, file)
}

func TestGitSourceAndArtifactForEdgeStack_ZeroWorkflowIDReturnsNil(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var src *portainer.Source
	var file *portainer.ArtifactFile
	err := store.ViewTx(func(tx dataservices.DataStoreTx) error {
		var txErr error
		src, file, txErr = GitSourceAndArtifactForEdgeStack(tx, adminUserContext, 0, 1)
		return txErr
	})
	require.NoError(t, err)
	require.Nil(t, src)
	require.Nil(t, file)
}

func TestGitSourceAndArtifactForEdgeStack_ReturnsMatchingSourceAndFile(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var workflowID portainer.WorkflowID
	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		gitSrc := &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git:  &gittypes.GitSource{URL: "https://github.com/example/edge-repo"},
		}
		err := tx.Source().Create(adminUserContext, gitSrc)
		require.NoError(t, err)

		wf := &portainer.Workflow{
			Artifacts: []portainer.Artifact{{
				EdgeStackID: 5,
				Files: []portainer.ArtifactFile{{
					SourceID: gitSrc.ID,
					Path:     "edge.yml",
					Ref:      "refs/heads/edge",
				}},
			}},
		}
		err = tx.Workflow().Create(wf)
		require.NoError(t, err)
		workflowID = wf.ID

		return nil
	})
	require.NoError(t, err)

	var src *portainer.Source
	var file *portainer.ArtifactFile
	err = store.ViewTx(func(tx dataservices.DataStoreTx) error {
		var txErr error
		src, file, txErr = GitSourceAndArtifactForEdgeStack(tx, adminUserContext, workflowID, 5)
		return txErr
	})
	require.NoError(t, err)
	require.NotNil(t, src)
	require.Equal(t, portainer.SourceTypeGit, src.Type)
	require.NotNil(t, file)
	require.Equal(t, "refs/heads/edge", file.Ref)
}

func TestUpdateArtifactFileForStack_NoMatchingArtifactIsNoOp(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var workflowID portainer.WorkflowID
	var sourceID portainer.SourceID
	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{Type: portainer.SourceTypeGit, Git: &gittypes.GitSource{URL: "https://example.com"}}
		err := tx.Source().Create(adminUserContext, src)
		require.NoError(t, err)
		sourceID = src.ID

		wf := &portainer.Workflow{
			Artifacts: []portainer.Artifact{{
				StackID: 1,
				Files:   []portainer.ArtifactFile{{SourceID: sourceID, Hash: "original"}},
			}},
		}
		err = tx.Workflow().Create(wf)
		require.NoError(t, err)
		workflowID = wf.ID

		return nil
	})
	require.NoError(t, err)

	err = store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return UpdateArtifactFileForStack(tx, workflowID, 99, sourceID, func(a *portainer.ArtifactFile) {
			a.Hash = "changed"
		})
	})
	require.NoError(t, err)

	wf, err := store.Workflow().Read(workflowID)
	require.NoError(t, err)
	require.Equal(t, "original", wf.Artifacts[0].Files[0].Hash)
}

func TestUpdateArtifactFileForStack_AppliesFnAndPersists(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var workflowID portainer.WorkflowID
	var sourceID portainer.SourceID
	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{Type: portainer.SourceTypeGit, Git: &gittypes.GitSource{URL: "https://example.com"}}
		err := tx.Source().Create(adminUserContext, src)
		require.NoError(t, err)
		sourceID = src.ID

		wf := &portainer.Workflow{
			Artifacts: []portainer.Artifact{{
				StackID: 1,
				Files:   []portainer.ArtifactFile{{SourceID: sourceID, Hash: "old-hash"}},
			}},
		}
		err = tx.Workflow().Create(wf)
		require.NoError(t, err)
		workflowID = wf.ID

		return nil
	})
	require.NoError(t, err)

	err = store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return UpdateArtifactFileForStack(tx, workflowID, 1, sourceID, func(a *portainer.ArtifactFile) {
			a.Hash = "new-hash"
		})
	})
	require.NoError(t, err)

	wf, err := store.Workflow().Read(workflowID)
	require.NoError(t, err)
	require.Equal(t, "new-hash", wf.Artifacts[0].Files[0].Hash)
}

func TestUpdateArtifactFileForEdgeStack_AppliesFnAndPersists(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var workflowID portainer.WorkflowID
	var sourceID portainer.SourceID
	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{Type: portainer.SourceTypeGit, Git: &gittypes.GitSource{URL: "https://example.com"}}
		err := tx.Source().Create(adminUserContext, src)
		require.NoError(t, err)
		sourceID = src.ID

		wf := &portainer.Workflow{
			Artifacts: []portainer.Artifact{{
				EdgeStackID: 7,
				Files:       []portainer.ArtifactFile{{SourceID: sourceID, Hash: "old-hash"}},
			}},
		}
		err = tx.Workflow().Create(wf)
		require.NoError(t, err)
		workflowID = wf.ID

		return nil
	})
	require.NoError(t, err)

	err = store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return UpdateArtifactFileForEdgeStack(tx, workflowID, 7, sourceID, func(a *portainer.ArtifactFile) {
			a.Hash = "new-hash"
		})
	})
	require.NoError(t, err)

	wf, err := store.Workflow().Read(workflowID)
	require.NoError(t, err)
	require.Equal(t, "new-hash", wf.Artifacts[0].Files[0].Hash)
}

func TestFindOrCreateGitSource_CreatesNewSource(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var src *portainer.Source
	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		var txErr error
		src, txErr = FindOrCreateGitSource(tx, adminUserContext, &portainer.Source{
			Name: "my-repo",
			Type: portainer.SourceTypeGit,
			Git: &gittypes.GitSource{
				URL: "https://github.com/example/repo",
			},
		})
		return txErr
	})
	require.NoError(t, err)
	require.NotNil(t, src)
	require.NotZero(t, src.ID)
	require.Equal(t, "https://github.com/example/repo", src.Git.URL)
}

func TestFindOrCreateGitSource_ReusesExistingSourceForSameURLAndAuth(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	makeSource := func(tx dataservices.DataStoreTx) (*portainer.Source, error) {
		return FindOrCreateGitSource(tx, adminUserContext, &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git: &gittypes.GitSource{
				URL: "https://github.com/example/repo",
			},
		})
	}

	var firstID portainer.SourceID
	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		s, err := makeSource(tx)
		if err != nil {
			return err
		}
		firstID = s.ID

		return nil
	})
	require.NoError(t, err)

	var secondID portainer.SourceID
	err = store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		s, err := makeSource(tx)
		if err != nil {
			return err
		}
		secondID = s.ID

		return nil
	})
	require.NoError(t, err)
	require.Equal(t, firstID, secondID)

	sources, err := store.Source().ReadAll(adminUserContext)
	require.NoError(t, err)
	require.Len(t, sources, 1)
}

func TestFindOrCreateGitSource_DifferentAuthCreatesNewSource(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		_, txErr := FindOrCreateGitSource(tx, adminUserContext, &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git: &gittypes.GitSource{
				URL:            "https://github.com/example/repo",
				Authentication: &gittypes.GitAuthentication{Username: "alice", Password: "pass1"},
			},
		})
		return txErr
	})
	require.NoError(t, err)

	err = store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		_, txErr := FindOrCreateGitSource(tx, adminUserContext, &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git: &gittypes.GitSource{
				URL:            "https://github.com/example/repo",
				Authentication: &gittypes.GitAuthentication{Username: "bob", Password: "pass2"},
			},
		})
		return txErr
	})
	require.NoError(t, err)

	sources, err := store.Source().ReadAll(adminUserContext)
	require.NoError(t, err)
	require.Len(t, sources, 2)
}

func TestFindOrCreateGitSource_AutoGrantLetsStandardUserReadAdminOnlySource(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	standardUserContext := source.NewUserContext(&portainer.User{ID: 2, Role: portainer.StandardUserRole}, []portainer.TeamMembership{})

	makeSource := func(ctx source.UserContext) func(tx dataservices.DataStoreTx) (*portainer.Source, error) {
		return func(tx dataservices.DataStoreTx) (*portainer.Source, error) {
			return FindOrCreateGitSource(tx, ctx, &portainer.Source{
				Type: portainer.SourceTypeGit,
				Git: &gittypes.GitSource{
					URL:            "https://github.com/example/repo",
					Authentication: &gittypes.GitAuthentication{Username: "alice", Password: "secret"},
				},
			})
		}
	}

	// An admin creating a source without explicit accesses defaults it to
	// AdministratorsOnly.
	var sourceID portainer.SourceID
	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		s, err := makeSource(adminUserContext)(tx)
		if err != nil {
			return err
		}
		sourceID = s.ID

		return nil
	})
	require.NoError(t, err)

	created, err := store.Source().Read(adminUserContext, sourceID)
	require.NoError(t, err)
	require.True(t, created.AdministratorsOnly)

	// A standard user supplying the same URL+auth is auto-granted access to the
	// existing source and must be able to read it afterwards (the stack builder
	// reads it back in the same transaction to persist sync status). The grant
	// demotes AdministratorsOnly, which is a hard enforcement and would
	// otherwise defeat the granted access.
	err = store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		s, err := makeSource(standardUserContext)(tx)
		if err != nil {
			return err
		}
		require.Equal(t, sourceID, s.ID)

		_, err = tx.Source().Read(standardUserContext, s.ID)

		return err
	})
	require.NoError(t, err)

	shared, err := store.Source().Read(standardUserContext, sourceID)
	require.NoError(t, err)
	require.False(t, shared.AdministratorsOnly)
	require.Equal(t, []portainer.UserID{2}, shared.UserAccesses)
}

func TestSaveWorkflowGitConfig_UpdatesFileAndSourceWhenURLUnchanged(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var workflowID portainer.WorkflowID
	var sourceID portainer.SourceID

	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git: &gittypes.GitSource{
				URL:           "https://github.com/example/repo",
				TLSSkipVerify: false,
				Authentication: &gittypes.GitAuthentication{
					Username: "old-user",
					Password: "old-pass",
				},
			},
		}
		err := tx.Source().Create(adminUserContext, src)
		require.NoError(t, err)
		sourceID = src.ID

		wf := &portainer.Workflow{
			Artifacts: []portainer.Artifact{{
				StackID: 1,
				Files: []portainer.ArtifactFile{{
					SourceID: sourceID,
					Path:     "docker-compose.yml",
					Ref:      "refs/heads/main",
					Hash:     "old-hash",
				}},
			}},
		}
		err = tx.Workflow().Create(wf)
		require.NoError(t, err)
		workflowID = wf.ID

		return nil
	})
	require.NoError(t, err)

	newCfg := &gittypes.RepoConfig{
		URL:           "https://github.com/example/repo",
		TLSSkipVerify: true,
		Authentication: &gittypes.GitAuthentication{
			Username: "new-user",
			Password: "new-pass",
		},
		ReferenceName:  "refs/heads/dev",
		ConfigFilePath: "compose.yml",
		ConfigHash:     "new-hash",
	}

	err = store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return SaveWorkflowGitConfig(tx, adminUserContext, workflowID, func(a portainer.Artifact) bool {
			return a.StackID == 1
		}, sourceID, newCfg)
	})
	require.NoError(t, err)

	wf, err := store.Workflow().Read(workflowID)
	require.NoError(t, err)
	require.Equal(t, "refs/heads/dev", wf.Artifacts[0].Files[0].Ref)
	require.Equal(t, "compose.yml", wf.Artifacts[0].Files[0].Path)
	require.Equal(t, "new-hash", wf.Artifacts[0].Files[0].Hash)
	require.Equal(t, sourceID, wf.Artifacts[0].Files[0].SourceID)

	src, err := store.Source().Read(adminUserContext, sourceID)
	require.NoError(t, err)
	require.Equal(t, "new-user", src.Git.Authentication.Username)
	require.Equal(t, "new-pass", src.Git.Authentication.Password)
	require.True(t, src.Git.TLSSkipVerify)
}

// A plain redeploy (the stack_update_git_redeploy handler rebuilds cfg from the stack's own
// stored Source, so URL/auth/TLS come back unchanged) must succeed for a non-owner standard
// user with only read access to the Source: since nothing about the Source's config actually
// changes, this must not require write/owner access.
func TestSaveWorkflowGitConfig_NonOwnerRedeployWithUnchangedConfigSucceeds(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	standardUserContext := source.NewUserContext(&portainer.User{ID: 2, Role: portainer.StandardUserRole}, []portainer.TeamMembership{})

	var workflowID portainer.WorkflowID
	var sourceID portainer.SourceID
	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git: &gittypes.GitSource{
				URL: "https://github.com/example/repo",
				Authentication: &gittypes.GitAuthentication{
					Username: "user",
					Password: "pass",
				},
			},
			Public: true,
		}
		err := tx.Source().Create(adminUserContext, src)
		require.NoError(t, err)
		sourceID = src.ID

		wf := &portainer.Workflow{
			Artifacts: []portainer.Artifact{{
				StackID: 1,
				Files: []portainer.ArtifactFile{{
					SourceID: sourceID,
					Path:     "docker-compose.yml",
					Ref:      "refs/heads/main",
					Hash:     "old-hash",
				}},
			}},
		}
		err = tx.Workflow().Create(wf)
		require.NoError(t, err)
		workflowID = wf.ID

		return nil
	})
	require.NoError(t, err)

	// Same URL, auth and TLS setting as already stored: the shape loadGitConfigForStack
	// produces on every redeploy that doesn't change the repository config.
	redeployCfg := &gittypes.RepoConfig{
		URL: "https://github.com/example/repo",
		Authentication: &gittypes.GitAuthentication{
			Username: "user",
			Password: "pass",
		},
		ReferenceName: "refs/heads/main",
		ConfigHash:    "new-hash",
	}

	err = store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return SaveWorkflowGitConfig(tx, standardUserContext, workflowID, func(a portainer.Artifact) bool {
			return a.StackID == 1
		}, sourceID, redeployCfg)
	})
	require.NoError(t, err)

	wf, err := store.Workflow().Read(workflowID)
	require.NoError(t, err)
	require.Equal(t, "new-hash", wf.Artifacts[0].Files[0].Hash)
}

func TestSaveWorkflowGitConfig_CreatesNewSourceOnURLChange(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var workflowID portainer.WorkflowID
	var oldSourceID portainer.SourceID

	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git:  &gittypes.GitSource{URL: "https://github.com/example/old-repo"},
		}
		err := tx.Source().Create(adminUserContext, src)
		require.NoError(t, err)
		oldSourceID = src.ID

		wf := &portainer.Workflow{
			Artifacts: []portainer.Artifact{{
				StackID: 1,
				Files:   []portainer.ArtifactFile{{SourceID: oldSourceID}},
			}},
		}
		err = tx.Workflow().Create(wf)
		require.NoError(t, err)
		workflowID = wf.ID

		return nil
	})
	require.NoError(t, err)

	newCfg := &gittypes.RepoConfig{URL: "https://github.com/example/new-repo"}

	err = store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return SaveWorkflowGitConfig(tx, adminUserContext, workflowID, func(a portainer.Artifact) bool {
			return a.StackID == 1
		}, oldSourceID, newCfg)
	})
	require.NoError(t, err)

	wf, err := store.Workflow().Read(workflowID)
	require.NoError(t, err)
	newSourceID := wf.Artifacts[0].Files[0].SourceID
	require.NotEqual(t, oldSourceID, newSourceID)

	newSrc, err := store.Source().Read(adminUserContext, newSourceID)
	require.NoError(t, err)
	require.Equal(t, "https://github.com/example/new-repo", newSrc.Git.URL)
}

func TestSaveWorkflowGitConfig_ReusesExistingSourceOnURLChange(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var workflowID portainer.WorkflowID
	var oldSourceID, existingSourceID portainer.SourceID

	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		old := &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git:  &gittypes.GitSource{URL: "https://github.com/example/old-repo"},
		}
		err := tx.Source().Create(adminUserContext, old)
		require.NoError(t, err)
		oldSourceID = old.ID

		existing := &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git:  &gittypes.GitSource{URL: "https://github.com/example/shared-repo"},
		}
		err = tx.Source().Create(adminUserContext, existing)
		require.NoError(t, err)
		existingSourceID = existing.ID

		wf := &portainer.Workflow{
			Artifacts: []portainer.Artifact{{
				StackID: 1,
				Files:   []portainer.ArtifactFile{{SourceID: oldSourceID}},
			}},
		}
		err = tx.Workflow().Create(wf)
		require.NoError(t, err)
		workflowID = wf.ID

		return nil
	})
	require.NoError(t, err)

	newCfg := &gittypes.RepoConfig{URL: "https://github.com/example/shared-repo"}

	err = store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return SaveWorkflowGitConfig(tx, adminUserContext, workflowID, func(a portainer.Artifact) bool {
			return a.StackID == 1
		}, oldSourceID, newCfg)
	})
	require.NoError(t, err)

	wf, err := store.Workflow().Read(workflowID)
	require.NoError(t, err)
	require.Equal(t, existingSourceID, wf.Artifacts[0].Files[0].SourceID)

	sources, err := store.Source().ReadAll(adminUserContext)
	require.NoError(t, err)
	require.Len(t, sources, 2)
}

func TestSaveWorkflowGitConfig_OnlyMatchingArtifactUpdated(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var workflowID portainer.WorkflowID
	var sourceID portainer.SourceID

	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git:  &gittypes.GitSource{URL: "https://github.com/example/repo"},
		}
		err := tx.Source().Create(adminUserContext, src)
		require.NoError(t, err)
		sourceID = src.ID

		wf := &portainer.Workflow{
			Artifacts: []portainer.Artifact{
				{
					StackID: 1,
					Files:   []portainer.ArtifactFile{{SourceID: sourceID, Hash: "hash-1"}},
				},
				{
					StackID: 2,
					Files:   []portainer.ArtifactFile{{SourceID: sourceID, Hash: "hash-2"}},
				},
			},
		}
		err = tx.Workflow().Create(wf)
		require.NoError(t, err)
		workflowID = wf.ID

		return nil
	})
	require.NoError(t, err)

	err = store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return SaveWorkflowGitConfig(tx, adminUserContext, workflowID, func(a portainer.Artifact) bool {
			return a.StackID == 1
		}, sourceID, &gittypes.RepoConfig{
			URL:        "https://github.com/example/repo",
			ConfigHash: "updated-hash",
		})
	})
	require.NoError(t, err)

	wf, err := store.Workflow().Read(workflowID)
	require.NoError(t, err)
	require.Equal(t, "updated-hash", wf.Artifacts[0].Files[0].Hash)
	require.Equal(t, "hash-2", wf.Artifacts[1].Files[0].Hash)
}

func TestUpdateArtifactFileForStack_MultipleArtifactsOnlyMatchingUpdated(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var workflowID portainer.WorkflowID
	var srcID portainer.SourceID
	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{Type: portainer.SourceTypeGit, Git: &gittypes.GitSource{URL: "https://example.com"}}
		err := tx.Source().Create(adminUserContext, src)
		require.NoError(t, err)
		srcID = src.ID

		wf := &portainer.Workflow{
			Artifacts: []portainer.Artifact{
				{StackID: 10, Files: []portainer.ArtifactFile{{SourceID: srcID, Hash: "hash-10"}}},
				{StackID: 20, Files: []portainer.ArtifactFile{{SourceID: srcID, Hash: "hash-20"}}},
			},
		}
		err = tx.Workflow().Create(wf)
		require.NoError(t, err)
		workflowID = wf.ID

		return nil
	})
	require.NoError(t, err)

	err = store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return UpdateArtifactFileForStack(tx, workflowID, 10, srcID, func(a *portainer.ArtifactFile) {
			a.Hash = "updated-hash-10"
		})
	})
	require.NoError(t, err)

	wf, err := store.Workflow().Read(workflowID)
	require.NoError(t, err)
	require.Equal(t, "updated-hash-10", wf.Artifacts[0].Files[0].Hash)
	require.Equal(t, "hash-20", wf.Artifacts[1].Files[0].Hash)
}

func TestSaveWorkflowArtifact_SwitchesSourceWithoutMutatingIt(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var workflowID portainer.WorkflowID
	var oldSourceID, newSourceID portainer.SourceID

	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		// Two distinct sources sharing the same URL: the case where URL-based
		// resolution would fail to switch.
		old := &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git:  &gittypes.GitSource{URL: "https://github.com/example/repo"},
		}
		err := tx.Source().Create(adminUserContext, old)
		require.NoError(t, err)
		oldSourceID = old.ID

		selected := &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git: &gittypes.GitSource{
				URL: "https://github.com/example/repo",
				Authentication: &gittypes.GitAuthentication{
					Username: "selected-user",
					Password: "selected-pass",
				},
			},
		}
		err = tx.Source().Create(adminUserContext, selected)
		require.NoError(t, err)
		newSourceID = selected.ID

		wf := &portainer.Workflow{
			Artifacts: []portainer.Artifact{{
				StackID: 1,
				Files: []portainer.ArtifactFile{{
					SourceID: oldSourceID,
					Ref:      "refs/heads/main",
					Path:     "docker-compose.yml",
					Hash:     "old-hash",
				}},
			}},
		}
		err = tx.Workflow().Create(wf)
		require.NoError(t, err)
		workflowID = wf.ID

		return nil
	})
	require.NoError(t, err)

	err = store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return SaveWorkflowArtifact(tx, workflowID, func(a portainer.Artifact) bool {
			return a.StackID == 1
		}, oldSourceID, portainer.ArtifactFile{
			SourceID: newSourceID,
			Ref:      "refs/heads/dev",
			Path:     "compose.yml",
			Hash:     "new-hash",
		})
	})
	require.NoError(t, err)

	wf, err := store.Workflow().Read(workflowID)
	require.NoError(t, err)
	require.Equal(t, newSourceID, wf.Artifacts[0].Files[0].SourceID)
	require.Equal(t, "refs/heads/dev", wf.Artifacts[0].Files[0].Ref)
	require.Equal(t, "compose.yml", wf.Artifacts[0].Files[0].Path)
	require.Equal(t, "new-hash", wf.Artifacts[0].Files[0].Hash)

	// The selected source's git config must be left untouched.
	selected, err := store.Source().Read(adminUserContext, newSourceID)
	require.NoError(t, err)
	require.Equal(t, "https://github.com/example/repo", selected.Git.URL)
	require.Equal(t, "selected-user", selected.Git.Authentication.Username)
	require.Equal(t, "selected-pass", selected.Git.Authentication.Password)
}

func TestUpdateArtifactFileForEdgeStack_MultipleArtifactsOnlyMatchingUpdated(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var workflowID portainer.WorkflowID
	var srcID portainer.SourceID
	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{Type: portainer.SourceTypeGit, Git: &gittypes.GitSource{URL: "https://example.com"}}
		err := tx.Source().Create(adminUserContext, src)
		require.NoError(t, err)
		srcID = src.ID

		wf := &portainer.Workflow{
			Artifacts: []portainer.Artifact{
				{EdgeStackID: 10, Files: []portainer.ArtifactFile{{SourceID: srcID, Hash: "hash-10"}}},
				{EdgeStackID: 20, Files: []portainer.ArtifactFile{{SourceID: srcID, Hash: "hash-20"}}},
			},
		}
		err = tx.Workflow().Create(wf)
		require.NoError(t, err)
		workflowID = wf.ID

		return nil
	})
	require.NoError(t, err)

	err = store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return UpdateArtifactFileForEdgeStack(tx, workflowID, 10, srcID, func(a *portainer.ArtifactFile) {
			a.Hash = "updated-hash-10"
		})
	})
	require.NoError(t, err)

	wf, err := store.Workflow().Read(workflowID)
	require.NoError(t, err)
	require.Equal(t, "updated-hash-10", wf.Artifacts[0].Files[0].Hash)
	require.Equal(t, "hash-20", wf.Artifacts[1].Files[0].Hash)
}

func TestSaveWorkflowArtifact_SameSourceUpdatesArtifactOnly(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var workflowID portainer.WorkflowID
	var sourceID portainer.SourceID

	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git:  &gittypes.GitSource{URL: "https://github.com/example/repo"},
		}
		err := tx.Source().Create(adminUserContext, src)
		require.NoError(t, err)
		sourceID = src.ID

		wf := &portainer.Workflow{
			Artifacts: []portainer.Artifact{{
				StackID: 1,
				Files: []portainer.ArtifactFile{{
					SourceID: sourceID,
					Ref:      "refs/heads/main",
				}},
			}},
		}
		err = tx.Workflow().Create(wf)
		require.NoError(t, err)
		workflowID = wf.ID

		return nil
	})
	require.NoError(t, err)

	err = store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return SaveWorkflowArtifact(tx, workflowID, func(a portainer.Artifact) bool {
			return a.StackID == 1
		}, sourceID, portainer.ArtifactFile{
			SourceID: sourceID,
			Ref:      "refs/heads/dev",
			Path:     "compose.yml",
			Hash:     "new-hash",
		})
	})
	require.NoError(t, err)

	wf, err := store.Workflow().Read(workflowID)
	require.NoError(t, err)
	require.Len(t, wf.Artifacts[0].Files, 1)
	require.Equal(t, sourceID, wf.Artifacts[0].Files[0].SourceID)
	require.Equal(t, "refs/heads/dev", wf.Artifacts[0].Files[0].Ref)
	require.Equal(t, "compose.yml", wf.Artifacts[0].Files[0].Path)
	require.Equal(t, "new-hash", wf.Artifacts[0].Files[0].Hash)
}

func TestGitSourceAndArtifactForStack_MultipleArtifactsReturnsCorrectOne(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var workflowID portainer.WorkflowID
	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		gitSrc := &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git:  &gittypes.GitSource{URL: "https://github.com/example/shared-repo"},
		}
		err := tx.Source().Create(adminUserContext, gitSrc)
		require.NoError(t, err)

		wf := &portainer.Workflow{
			Artifacts: []portainer.Artifact{
				{StackID: 10, Files: []portainer.ArtifactFile{{SourceID: gitSrc.ID, Ref: "refs/heads/main", Hash: "hash-10"}}},
				{StackID: 20, Files: []portainer.ArtifactFile{{SourceID: gitSrc.ID, Ref: "refs/heads/dev", Hash: "hash-20"}}},
			},
		}
		err = tx.Workflow().Create(wf)
		require.NoError(t, err)
		workflowID = wf.ID

		return nil
	})
	require.NoError(t, err)

	var src *portainer.Source
	var file *portainer.ArtifactFile
	err = store.ViewTx(func(tx dataservices.DataStoreTx) error {
		var txErr error
		src, file, txErr = GitSourceAndArtifactForStack(tx, adminUserContext, workflowID, 20)
		return txErr
	})
	require.NoError(t, err)
	require.NotNil(t, src)
	require.NotNil(t, file)
	require.Equal(t, "refs/heads/dev", file.Ref)
	require.Equal(t, "hash-20", file.Hash)
}

func TestGitSourceAndArtifactForEdgeStack_MultipleArtifactsReturnsCorrectOne(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var workflowID portainer.WorkflowID
	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		gitSrc := &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git:  &gittypes.GitSource{URL: "https://github.com/example/shared-edge-repo"},
		}
		err := tx.Source().Create(adminUserContext, gitSrc)
		require.NoError(t, err)

		wf := &portainer.Workflow{
			Artifacts: []portainer.Artifact{
				{EdgeStackID: 10, Files: []portainer.ArtifactFile{{SourceID: gitSrc.ID, Ref: "refs/heads/main", Hash: "hash-10"}}},
				{EdgeStackID: 20, Files: []portainer.ArtifactFile{{SourceID: gitSrc.ID, Ref: "refs/heads/dev", Hash: "hash-20"}}},
			},
		}
		err = tx.Workflow().Create(wf)
		require.NoError(t, err)
		workflowID = wf.ID

		return nil
	})
	require.NoError(t, err)

	var src *portainer.Source
	var file *portainer.ArtifactFile
	err = store.ViewTx(func(tx dataservices.DataStoreTx) error {
		var txErr error
		src, file, txErr = GitSourceAndArtifactForEdgeStack(tx, adminUserContext, workflowID, 20)
		return txErr
	})
	require.NoError(t, err)
	require.NotNil(t, src)
	require.NotNil(t, file)
	require.Equal(t, "refs/heads/dev", file.Ref)
	require.Equal(t, "hash-20", file.Hash)
}

func TestMergeSourceAndFile_ConfigHashComesFromFileNotSource(t *testing.T) {
	t.Parallel()

	src := &portainer.Source{
		Git: &gittypes.GitSource{URL: "https://github.com/example/repo"},
	}
	file := &portainer.ArtifactFile{Hash: "artifact-hash"}

	cfg := MergeSourceAndFile(src, file)
	require.NotNil(t, cfg)
	require.Equal(t, "artifact-hash", cfg.ConfigHash)
}

func TestUpdateSourceSyncStatus_HealthyBumpsLastSyncAndClearsError(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var sourceID portainer.SourceID
	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{
			Type:        portainer.SourceTypeGit,
			Git:         &gittypes.GitSource{URL: "https://example.com"},
			Status:      portainer.SourceStatusError,
			StatusError: "previous failure",
		}
		err := tx.Source().Create(adminUserContext, src)
		require.NoError(t, err)
		sourceID = src.ID

		return nil
	})
	require.NoError(t, err)

	err = store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return UpdateSourceSyncStatus(tx, adminUserContext, sourceID, portainer.SourceStatusHealthy, "")
	})
	require.NoError(t, err)

	src, err := store.Source().Read(adminUserContext, sourceID)
	require.NoError(t, err)
	require.Equal(t, portainer.SourceStatusHealthy, src.Status)
	require.Empty(t, src.StatusError)
	require.NotZero(t, src.LastSync)
}

func TestUpdateSourceSyncStatus_ErrorPreservesPriorLastSync(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var sourceID portainer.SourceID
	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{
			Type:     portainer.SourceTypeGit,
			Git:      &gittypes.GitSource{URL: "https://example.com"},
			LastSync: 12345,
		}
		err := tx.Source().Create(adminUserContext, src)
		require.NoError(t, err)
		sourceID = src.ID

		return nil
	})
	require.NoError(t, err)

	err = store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return UpdateSourceSyncStatus(tx, adminUserContext, sourceID, portainer.SourceStatusError, "git fetch failed")
	})
	require.NoError(t, err)

	src, err := store.Source().Read(adminUserContext, sourceID)
	require.NoError(t, err)
	require.Equal(t, portainer.SourceStatusError, src.Status)
	require.Equal(t, "git fetch failed", src.StatusError)
	require.Equal(t, int64(12345), src.LastSync)
}

// A standard user deploying a stack from a Source they don't own must still be able to
// persist sync status, for both a public Source and a restricted one they were granted
// access to: syncing is a side effect of using the Source, not an edit of its config, and
// must not require ownership or admin rights.
func TestUpdateSourceSyncStatus_NonOwnerWithReadAccessCanUpdate(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	standardUserContext := source.NewUserContext(&portainer.User{ID: 2, Role: portainer.StandardUserRole}, []portainer.TeamMembership{})

	var publicSourceID, restrictedSourceID portainer.SourceID
	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		public := &portainer.Source{
			Type:   portainer.SourceTypeGit,
			Git:    &gittypes.GitSource{URL: "https://github.com/example/public-repo"},
			Public: true,
		}
		err := tx.Source().Create(adminUserContext, public)
		require.NoError(t, err)
		publicSourceID = public.ID

		restricted := &portainer.Source{
			Type:         portainer.SourceTypeGit,
			Git:          &gittypes.GitSource{URL: "https://github.com/example/restricted-repo"},
			UserAccesses: []portainer.UserID{2},
		}
		err = tx.Source().Create(adminUserContext, restricted)
		require.NoError(t, err)
		restrictedSourceID = restricted.ID

		return nil
	})
	require.NoError(t, err)

	err = store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return UpdateSourceSyncStatus(tx, standardUserContext, publicSourceID, portainer.SourceStatusHealthy, "")
	})
	require.NoError(t, err)

	err = store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return UpdateSourceSyncStatus(tx, standardUserContext, restrictedSourceID, portainer.SourceStatusHealthy, "")
	})
	require.NoError(t, err)

	public, err := store.Source().Read(adminUserContext, publicSourceID)
	require.NoError(t, err)
	require.Equal(t, portainer.SourceStatusHealthy, public.Status)

	restricted, err := store.Source().Read(adminUserContext, restrictedSourceID)
	require.NoError(t, err)
	require.Equal(t, portainer.SourceStatusHealthy, restricted.Status)
}

func TestUpdateSourceSyncStatus_UserWithoutReadAccessIsDenied(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	standardUserContext := source.NewUserContext(&portainer.User{ID: 2, Role: portainer.StandardUserRole}, []portainer.TeamMembership{})

	var sourceID portainer.SourceID
	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{
			Type:               portainer.SourceTypeGit,
			Git:                &gittypes.GitSource{URL: "https://github.com/example/admin-only-repo"},
			AdministratorsOnly: true,
		}
		err := tx.Source().Create(adminUserContext, src)
		require.NoError(t, err)
		sourceID = src.ID

		return nil
	})
	require.NoError(t, err)

	err = store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return UpdateSourceSyncStatus(tx, standardUserContext, sourceID, portainer.SourceStatusHealthy, "")
	})
	require.ErrorIs(t, err, source.ErrNotEnoughPermission)
}

func TestFindOrCreateGitSource_StripsEmbeddedCredentialsFromURL(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var src *portainer.Source
	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		var txErr error
		src, txErr = FindOrCreateGitSource(tx, adminUserContext, &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git: &gittypes.GitSource{
				URL: "https://user:secret@github.com/example/repo",
			},
		})
		return txErr
	})
	require.NoError(t, err)
	require.Equal(t, "https://github.com/example/repo", src.Git.URL)
}
