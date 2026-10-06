package stackbuilders

import (
	"testing"

	portainer "github.com/portainer/portainer/api"

	"github.com/stretchr/testify/require"
)

func TestGitMethodStackBuilder_SetAutoUpdate_InvalidInterval(t *testing.T) {
	t.Parallel()

	payload := &StackPayload{AutoUpdate: &portainer.AutoUpdateSettings{Interval: "not-a-duration"}}

	b := &GitMethodStackBuilder{StackBuilder: StackBuilder{stack: &portainer.Stack{AutoUpdate: payload.AutoUpdate}}}

	b.SetAutoUpdate(payload)
	require.NotNil(t, b.err)
	require.Equal(t, 400, b.err.StatusCode)
	require.Empty(t, b.stack.AutoUpdate.JobID)
}
