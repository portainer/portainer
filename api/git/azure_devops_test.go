package git

import (
	"testing"

	"github.com/go-git/go-git/v5/plumbing/protocol/packp/capability"
	"github.com/go-git/go-git/v5/plumbing/transport"
	"github.com/stretchr/testify/assert"
)

// Azure DevOps rejects upload-pack with HTTP 400 if multi_ack is withheld
func TestMultiACKAllowedForAzureDevOps(t *testing.T) {
	assert.NotContains(t, transport.UnsupportedCapabilities, capability.MultiACK)
	assert.NotContains(t, transport.UnsupportedCapabilities, capability.MultiACKDetailed)
}
