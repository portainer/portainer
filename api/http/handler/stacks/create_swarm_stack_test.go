package stacks

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/stretchr/testify/assert"
)

func TestSwarmGitPayload_ValidateWithSourceID_URLNotRequired(t *testing.T) {
	t.Parallel()
	payload := &swarmStackFromGitRepositoryPayload{
		Name:     "myswarm",
		SwarmID:  "swarm-abc",
		SourceID: portainer.SourceID(1),
	}

	err := payload.Validate(nil)
	assert.NoError(t, err)
}

func TestSwarmGitPayload_ValidateWithoutSourceID_URLRequired(t *testing.T) {
	t.Parallel()
	payload := &swarmStackFromGitRepositoryPayload{
		Name:    "myswarm",
		SwarmID: "swarm-abc",
	}

	err := payload.Validate(nil)
	assert.Error(t, err)
}
