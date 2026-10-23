package kubernetes

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/portainer/portainer/pkg/libkubectl"
)

func TestDrainNodePayload_DrainOptions_AllFieldsOmittedPreservesDefaults(t *testing.T) {
	t.Parallel()

	var payload drainNodePayload

	assert.Equal(t, libkubectl.DefaultDrainOptions(), payload.drainOptions())
}

func TestDrainNodePayload_DrainOptions_ExplicitZeroGracePeriodIsHonored(t *testing.T) {
	t.Parallel()

	payload := drainNodePayload{
		GracePeriodSeconds: new(0),
	}

	opts := payload.drainOptions()

	// GracePeriodSeconds: 0 means "delete immediately" and must not be
	// silently replaced by the -1 default just because it's the Go
	// zero-value for int.
	assert.Equal(t, 0, opts.GracePeriodSeconds)
}

func TestDrainNodePayload_DrainOptions_ExplicitFalseBooleansAreHonored(t *testing.T) {
	t.Parallel()

	payload := drainNodePayload{
		IgnoreDaemonSets:   new(false),
		DeleteEmptyDirData: new(false),
	}

	opts := payload.drainOptions()

	assert.False(t, opts.IgnoreAllDaemonSets)
	assert.False(t, opts.DeleteEmptyDirData)
}

func TestDrainNodePayload_DrainOptions_PartialPayloadKeepsRemainingDefaults(t *testing.T) {
	t.Parallel()

	payload := drainNodePayload{
		Force: new(true),
	}

	opts := payload.drainOptions()
	defaults := libkubectl.DefaultDrainOptions()

	assert.True(t, opts.Force)
	assert.Equal(t, defaults.GracePeriodSeconds, opts.GracePeriodSeconds)
	assert.Equal(t, defaults.IgnoreAllDaemonSets, opts.IgnoreAllDaemonSets)
	assert.Equal(t, defaults.DeleteEmptyDirData, opts.DeleteEmptyDirData)
	assert.Equal(t, defaults.DisableEviction, opts.DisableEviction)
	assert.Equal(t, defaults.Timeout, opts.Timeout)
}

func TestDrainNodePayload_DrainOptions_TimeoutSecondsConvertedToDuration(t *testing.T) {
	t.Parallel()

	payload := drainNodePayload{
		TimeoutSeconds: new(120),
	}

	opts := payload.drainOptions()

	assert.Equal(t, 120*time.Second, opts.Timeout)
}

func TestDrainNodePayload_Validate(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name      string
		payload   drainNodePayload
		expectErr bool
	}{
		{
			name:    "nil fields are valid",
			payload: drainNodePayload{},
		},
		{
			name:      "negative timeout is invalid",
			payload:   drainNodePayload{TimeoutSeconds: new(-1)},
			expectErr: true,
		},
		{
			name:    "zero timeout is valid",
			payload: drainNodePayload{TimeoutSeconds: new(0)},
		},
		{
			name:    "grace period of -1 is valid",
			payload: drainNodePayload{GracePeriodSeconds: new(-1)},
		},
		{
			name:      "grace period less than -1 is invalid",
			payload:   drainNodePayload{GracePeriodSeconds: new(-2)},
			expectErr: true,
		},
		{
			name:    "grace period of zero is valid",
			payload: drainNodePayload{GracePeriodSeconds: new(0)},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			err := tt.payload.Validate(nil)
			if tt.expectErr {
				require.Error(t, err)
				return
			}
			require.NoError(t, err)
		})
	}
}
