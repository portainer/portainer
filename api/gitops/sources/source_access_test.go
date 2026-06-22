package sources

import (
	"net/http"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestValidateSourceForStack_ValidGitSource_ReturnsNil(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, false)

	src := &portainer.Source{
		Type: portainer.SourceTypeGit,
		Git:  &gittypes.RepoConfig{URL: "https://github.com/org/repo"},
	}
	require.NoError(t, store.Source().Create(adminUserContext, src))

	_, httpErr := ValidateGitSourceAccess(store, adminUserContext, src.ID)
	assert.Nil(t, httpErr)
}

func TestValidateSourceForStack_SourceNotFound_Returns404(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, false)

	_, httpErr := ValidateGitSourceAccess(store, adminUserContext, portainer.SourceID(999))
	require.NotNil(t, httpErr)
	assert.Equal(t, http.StatusNotFound, httpErr.StatusCode)
}
