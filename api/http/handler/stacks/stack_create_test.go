package stacks

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/stretchr/testify/assert"
)

func Test_stackHandler_cloneAndSaveConfig_shouldCallGitCloneAndSaveConfigOnStack(t *testing.T) {
	handler := NewHandler(&security.RequestBouncer{})
	handler.GitService = testhelpers.NewGitService()

	url := "url"
	refName := "ref"
	configPath := "path"
	stack := &portainer.Stack{}
	err := handler.cloneAndSaveConfig(stack, "", url, refName, configPath, false, "", "")
	assert.NoError(t, err, "clone and save should not fail")

	assert.Equal(t, gittypes.RepoConfig{
		URL:            url,
		ReferenceName:  refName,
		ConfigFilePath: configPath,
	}, *stack.GitConfig)
}
