package source

// var adminUserContext = InsecureNewAdminContext()

// func newSourceWithAuth(url, username, password string) *portainer.Source {
// 	return &portainer.Source{
// 		Type: portainer.SourceTypeGit,
// 		Git: &gittypes.RepoConfig{
// 			URL: url,
// 			Authentication: &gittypes.GitAuthentication{
// 				Username: username,
// 				Password: password,
// 			},
// 		},
// 	}
// }

// func newAuthlessSource(url string) *portainer.Source {
// 	return &portainer.Source{
// 		Type: portainer.SourceTypeGit,
// 		Git:  &gittypes.RepoConfig{URL: url},
// 	}
// }

// func validateUniqueSourceInStore(t *testing.T, tx ServiceTx, url, username, password string, sourceID portainer.SourceID) bool {
// 	t.Helper()

// 		var isUnique bool
// 		require.NoError(t, store.ViewTx(func(tx dataservices.DataStoreTx) error {
// 			var err error
// 			isUnique, err =// enforceUniqueGitSource(tx, url, username, password, sourceID)
// 			return err
// 		}))

// 	return isUnique
// }

// func TestValidateUniqueSource_SameURLAndCreds_IsDuplicate(t *testing.T) {
// 	t.Parallel()
// 	_, store := datastore.MustNewTestStore(t, false, true)

// 	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
// 		return tx.Source().Create(adminUserContext, newSourceWithAuth("https://github.com/org/repo.git", "alice", "secret"))
// 	}))

// 	require.False(t, validateUniqueSourceInStore(t, store, "https://github.com/org/repo.git", "alice", "secret", 0))
// }

// func TestValidateUniqueSource_SameURLDifferentCreds_IsUnique(t *testing.T) {
// 	t.Parallel()
// 	_, store := datastore.MustNewTestStore(t, false, true)

// 	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
// 		return tx.Source().Create(adminUserContext, newSourceWithAuth("https://github.com/org/repo.git", "alice", "secret"))
// 	}))

// 	require.True(t, validateUniqueSourceInStore(t, store, "https://github.com/org/repo.git", "bob", "other", 0))
// }

// func TestValidateUniqueSource_TwoAuthlessSameURL_IsDuplicate(t *testing.T) {
// 	t.Parallel()
// 	_, store := datastore.MustNewTestStore(t, false, true)

// 	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
// 		return tx.Source().Create(adminUserContext, newAuthlessSource("https://github.com/org/repo.git"))
// 	}))

// 	require.False(t, validateUniqueSourceInStore(t, store, "https://github.com/org/repo.git", "", "", 0))
// }

// func TestValidateUniqueSource_AuthlessVsAuthenticated_IsUnique(t *testing.T) {
// 	t.Parallel()
// 	_, store := datastore.MustNewTestStore(t, false, true)

// 	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
// 		return tx.Source().Create(adminUserContext, newAuthlessSource("https://github.com/org/repo.git"))
// 	}))

// 	require.True(t, validateUniqueSourceInStore(t, store, "https://github.com/org/repo.git", "alice", "secret", 0))
// }

// func TestValidateUniqueSource_ExcludesSelf(t *testing.T) {
// 	t.Parallel()
// 	_, store := datastore.MustNewTestStore(t, false, true)

// 	var srcID portainer.SourceID
// 	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
// 		src := newSourceWithAuth("https://github.com/org/repo.git", "alice", "secret")
// 		if err := tx.Source().Create(adminUserContext, src); err != nil {
// 			return err
// 		}
// 		srcID = src.ID
// 		return nil
// 	}))

// 	require.True(t, validateUniqueSourceInStore(t, store, "https://github.com/org/repo.git", "alice", "secret", srcID))
// }
