package sources

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/source"
	"github.com/portainer/portainer/api/datastore"
	gittypes "github.com/portainer/portainer/api/git/types"

	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/require"
)

// recordingGitService is a portainer.GitService that records the URL and credentials
// passed to ListRefs, so tests can assert whether a stored credential was forwarded
type recordingGitService struct {
	portainer.GitService

	lastURL  string
	lastAuth *gittypes.GitAuthentication
}

func (g *recordingGitService) ListRefs(_ context.Context, repositoryURL, username, password string, _, _ bool) ([]string, error) {
	g.lastURL = repositoryURL
	g.lastAuth = &gittypes.GitAuthentication{Username: username, Password: password}

	return nil, nil
}

// TestSourceTestConnection_OverridesRequireWriteAccess covers testing the connection
// of sources with stored credentials. A user who can only read a source (here through
// a Public source they don't own) may test its stored configuration but cannot
// override any of it, so the stored credentials never reach a URL or TLS setting the
// caller chose. Users with write access (an administrator or the owner) keep the
// stored credentials when overriding, the same as when they update the source
func TestSourceTestConnection_OverridesRequireWriteAccess(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	const ownerID portainer.UserID = 3

	storedAuth := &gittypes.GitAuthentication{Username: "victim", Password: "super-secret"}
	ownedAuth := &gittypes.GitAuthentication{Username: "owner", Password: "owner-secret"}

	var publicSrcID, ownedSrcID, adminOnlySrcID portainer.SourceID
	err := store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		publicSrc := &portainer.Source{
			Type:   portainer.SourceTypeGit,
			Public: true,
			Git: &gittypes.GitSource{
				URL:            "https://github.com/org/private-repo.git",
				Authentication: &gittypes.GitAuthentication{Username: "victim", Password: "super-secret"},
			},
		}
		if err := tx.Source().Create(adminUserContext, publicSrc); err != nil {
			return err
		}

		ownerContext := source.NewUserContext(&portainer.User{ID: ownerID, Role: portainer.StandardUserRole}, nil)
		ownedSrc := &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git: &gittypes.GitSource{
				URL:            "https://github.com/org/owned-repo.git",
				Authentication: &gittypes.GitAuthentication{Username: "owner", Password: "owner-secret"},
			},
		}
		if err := tx.Source().Create(ownerContext, ownedSrc); err != nil {
			return err
		}

		adminOnlySrc := &portainer.Source{
			Type: portainer.SourceTypeGit,
			Git: &gittypes.GitSource{
				URL:            "https://github.com/org/admin-repo.git",
				Authentication: &gittypes.GitAuthentication{Username: "admin", Password: "admin-secret"},
			},
		}
		if err := tx.Source().Create(adminUserContext, adminOnlySrc); err != nil {
			return err
		}

		publicSrcID = publicSrc.ID
		ownedSrcID = ownedSrc.ID
		adminOnlySrcID = adminOnlySrc.ID

		return nil
	})
	require.NoError(t, err)

	git := &recordingGitService{}
	h := newTestHandlerWithGit(t, store, git)

	const storedURL = "https://github.com/org/private-repo"
	const attackerURL = "http://attacker.tld/repo.git"
	const otherURL = "https://github.com/org/other-repo.git"

	f := func(userID portainer.UserID, role portainer.UserRole, srcID portainer.SourceID, payload *GitSourceUpdatePayload, wantStatus int, wantURL string, wantAuth *gittypes.GitAuthentication) {
		t.Helper()

		var body []byte
		if payload != nil {
			var err error
			body, err = json.Marshal(payload)
			require.NoError(t, err)
		}

		git.lastURL = ""
		git.lastAuth = nil

		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, buildSourceTestConnectionReq(t, userID, role, int(srcID), body))

		require.Equal(t, wantStatus, rr.Code, rr.Body.String())
		require.Equal(t, wantURL, git.lastURL)
		require.Equal(t, wantAuth, git.lastAuth)
	}

	// a user without read access to the source cannot test it at all
	f(2, portainer.StandardUserRole, adminOnlySrcID, nil, http.StatusForbidden, "", nil)

	// overrides that never reach the git request, like the name, are still a test of the stored configuration
	f(2, portainer.StandardUserRole, publicSrcID, &GitSourceUpdatePayload{Name: new("renamed"), Interval: new("5m")}, http.StatusOK, storedURL, storedAuth)

	// a read-only user testing the stored configuration sends the stored credentials to the stored URL
	f(2, portainer.StandardUserRole, publicSrcID, nil, http.StatusOK, storedURL, storedAuth)

	// an empty JSON object is still a test of the stored configuration
	f(2, portainer.StandardUserRole, publicSrcID, &GitSourceUpdatePayload{}, http.StatusOK, storedURL, storedAuth)

	// a read-only user cannot override the URL
	f(2, portainer.StandardUserRole, publicSrcID, &GitSourceUpdatePayload{URL: new(attackerURL)}, http.StatusForbidden, "", nil)

	// a read-only user cannot override the URL together with a partial authentication
	f(2, portainer.StandardUserRole, publicSrcID, &GitSourceUpdatePayload{
		URL:            new(attackerURL),
		Authentication: &GitAuthenticationUpdatePayload{Username: new("victim")},
	}, http.StatusForbidden, "", nil)

	// a read-only user cannot disable TLS verification for the stored credentials
	f(2, portainer.StandardUserRole, publicSrcID, &GitSourceUpdatePayload{TLSSkipVerify: new(true)}, http.StatusForbidden, "", nil)

	// an administrator overriding the URL keeps the stored credentials
	f(1, portainer.AdministratorRole, publicSrcID, &GitSourceUpdatePayload{URL: new(otherURL)}, http.StatusOK, otherURL, storedAuth)

	// the owner overriding the URL keeps the stored credentials, which the settings form relies on
	f(ownerID, portainer.StandardUserRole, ownedSrcID, &GitSourceUpdatePayload{URL: new(otherURL)}, http.StatusOK, otherURL, ownedAuth)
}
