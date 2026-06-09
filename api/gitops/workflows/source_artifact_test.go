package workflows

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
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
		Git: &gittypes.RepoConfig{
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
		Git: &gittypes.RepoConfig{
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
		src, file, txErr = GitSourceAndArtifactForStack(tx, 0, 1)
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
			Git:  &gittypes.RepoConfig{URL: "https://github.com/example/repo"},
		}
		err := tx.Source().Create(gitSrc)
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
		src, file, txErr = GitSourceAndArtifactForStack(tx, workflowID, 42)
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
			Git:  &gittypes.RepoConfig{URL: "https://github.com/example/repo"},
		}
		err := tx.Source().Create(src)
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
		src, file, txErr = GitSourceAndArtifactForStack(tx, workflowID, 99)
		return txErr
	})
	require.NoError(t, err)
	require.Nil(t, src)
	require.Nil(t, file)
}

func TestGitSourceAndArtifactForStack_NonGitSourceSkipped(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var workflowID portainer.WorkflowID
	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		nonGitSrc := &portainer.Source{Type: portainer.SourceType(99)}
		err := tx.Source().Create(nonGitSrc)
		require.NoError(t, err)

		wf := &portainer.Workflow{
			Artifacts: []portainer.Artifact{{
				StackID: 1,
				Files:   []portainer.ArtifactFile{{SourceID: nonGitSrc.ID}},
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
		src, file, txErr = GitSourceAndArtifactForStack(tx, workflowID, 1)
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
		src, file, txErr = GitSourceAndArtifactForEdgeStack(tx, 0, 1)
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
			Git:  &gittypes.RepoConfig{URL: "https://github.com/example/edge-repo"},
		}
		err := tx.Source().Create(gitSrc)
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
		src, file, txErr = GitSourceAndArtifactForEdgeStack(tx, workflowID, 5)
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
		src := &portainer.Source{Type: portainer.SourceTypeGit, Git: &gittypes.RepoConfig{URL: "https://example.com"}}
		err := tx.Source().Create(src)
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
		src := &portainer.Source{Type: portainer.SourceTypeGit, Git: &gittypes.RepoConfig{URL: "https://example.com"}}
		err := tx.Source().Create(src)
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
		src := &portainer.Source{Type: portainer.SourceTypeGit, Git: &gittypes.RepoConfig{URL: "https://example.com"}}
		err := tx.Source().Create(src)
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
		src, txErr = FindOrCreateGitSource(tx, &portainer.Source{
			Name: "my-repo",
			Type: portainer.SourceTypeGit,
			Git: &gittypes.RepoConfig{
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
		return FindOrCreateGitSource(tx, &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git: &gittypes.RepoConfig{
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

	sources, err := store.Source().ReadAll()
	require.NoError(t, err)
	require.Len(t, sources, 1)
}

func TestFindOrCreateGitSource_DifferentAuthCreatesNewSource(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		_, txErr := FindOrCreateGitSource(tx, &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git: &gittypes.RepoConfig{
				URL:            "https://github.com/example/repo",
				Authentication: &gittypes.GitAuthentication{Username: "alice", Password: "pass1"},
			},
		})
		return txErr
	})
	require.NoError(t, err)

	err = store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		_, txErr := FindOrCreateGitSource(tx, &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git: &gittypes.RepoConfig{
				URL:            "https://github.com/example/repo",
				Authentication: &gittypes.GitAuthentication{Username: "bob", Password: "pass2"},
			},
		})
		return txErr
	})
	require.NoError(t, err)

	sources, err := store.Source().ReadAll()
	require.NoError(t, err)
	require.Len(t, sources, 2)
}

func TestSaveWorkflowGitConfig_UpdatesFileAndSourceWhenURLUnchanged(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var workflowID portainer.WorkflowID
	var sourceID portainer.SourceID

	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git: &gittypes.RepoConfig{
				URL:           "https://github.com/example/repo",
				TLSSkipVerify: false,
				Authentication: &gittypes.GitAuthentication{
					Username: "old-user",
					Password: "old-pass",
				},
			},
		}
		err := tx.Source().Create(src)
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
		return SaveWorkflowGitConfig(tx, workflowID, func(a portainer.Artifact) bool {
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

	src, err := store.Source().Read(sourceID)
	require.NoError(t, err)
	require.Equal(t, "new-user", src.Git.Authentication.Username)
	require.Equal(t, "new-pass", src.Git.Authentication.Password)
	require.True(t, src.Git.TLSSkipVerify)
}

func TestSaveWorkflowGitConfig_CreatesNewSourceOnURLChange(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var workflowID portainer.WorkflowID
	var oldSourceID portainer.SourceID

	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git:  &gittypes.RepoConfig{URL: "https://github.com/example/old-repo"},
		}
		err := tx.Source().Create(src)
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
		return SaveWorkflowGitConfig(tx, workflowID, func(a portainer.Artifact) bool {
			return a.StackID == 1
		}, oldSourceID, newCfg)
	})
	require.NoError(t, err)

	wf, err := store.Workflow().Read(workflowID)
	require.NoError(t, err)
	newSourceID := wf.Artifacts[0].Files[0].SourceID
	require.NotEqual(t, oldSourceID, newSourceID)

	newSrc, err := store.Source().Read(newSourceID)
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
			Git:  &gittypes.RepoConfig{URL: "https://github.com/example/old-repo"},
		}
		err := tx.Source().Create(old)
		require.NoError(t, err)
		oldSourceID = old.ID

		existing := &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git:  &gittypes.RepoConfig{URL: "https://github.com/example/shared-repo"},
		}
		err = tx.Source().Create(existing)
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
		return SaveWorkflowGitConfig(tx, workflowID, func(a portainer.Artifact) bool {
			return a.StackID == 1
		}, oldSourceID, newCfg)
	})
	require.NoError(t, err)

	wf, err := store.Workflow().Read(workflowID)
	require.NoError(t, err)
	require.Equal(t, existingSourceID, wf.Artifacts[0].Files[0].SourceID)

	sources, err := store.Source().ReadAll()
	require.NoError(t, err)
	require.Len(t, sources, 2)
}

func TestSaveWorkflowGitConfig_NilGitConfigReturnsError(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var workflowID portainer.WorkflowID
	var sourceID portainer.SourceID

	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{Type: portainer.SourceTypeGit}
		err := tx.Source().Create(src)
		require.NoError(t, err)
		sourceID = src.ID

		wf := &portainer.Workflow{
			Artifacts: []portainer.Artifact{{
				StackID: 1,
				Files:   []portainer.ArtifactFile{{SourceID: sourceID}},
			}},
		}
		err = tx.Workflow().Create(wf)
		require.NoError(t, err)
		workflowID = wf.ID

		return nil
	})
	require.NoError(t, err)

	err = store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return SaveWorkflowGitConfig(tx, workflowID, func(a portainer.Artifact) bool {
			return a.StackID == 1
		}, sourceID, &gittypes.RepoConfig{URL: "https://github.com/example/repo"})
	})
	require.Error(t, err)
}

func TestSaveWorkflowGitConfig_OnlyMatchingArtifactUpdated(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var workflowID portainer.WorkflowID
	var sourceID portainer.SourceID

	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		src := &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git:  &gittypes.RepoConfig{URL: "https://github.com/example/repo"},
		}
		err := tx.Source().Create(src)
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
		return SaveWorkflowGitConfig(tx, workflowID, func(a portainer.Artifact) bool {
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

func TestFindOrCreateGitSource_StripsEmbeddedCredentialsFromURL(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	var src *portainer.Source
	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		var txErr error
		src, txErr = FindOrCreateGitSource(tx, &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git: &gittypes.RepoConfig{
				URL: "https://user:secret@github.com/example/repo",
			},
		})
		return txErr
	})
	require.NoError(t, err)
	require.Equal(t, "https://github.com/example/repo", src.Git.URL)
}
