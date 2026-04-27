package workflows

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestParseStatus(t *testing.T) {
	t.Parallel()

	for _, valid := range []string{"healthy", "error", "syncing", "paused", "unknown"} {
		t.Run(valid, func(t *testing.T) {
			t.Parallel()
			s, err := ParseStatus(valid)
			require.NoError(t, err)
			assert.Equal(t, Status(valid), s)
		})
	}

	t.Run("invalid returns error", func(t *testing.T) {
		t.Parallel()
		_, err := ParseStatus("garbage")
		assert.Error(t, err)
	})
}

func TestParseType(t *testing.T) {
	t.Parallel()

	for _, valid := range []string{"stack", "edgeStack"} {
		t.Run(valid, func(t *testing.T) {
			t.Parallel()
			tp, err := ParseType(valid)
			require.NoError(t, err)
			assert.Equal(t, Type(valid), tp)
		})
	}

	t.Run("invalid returns error", func(t *testing.T) {
		t.Parallel()
		_, err := ParseType("garbage")
		assert.Error(t, err)
	})
}

func TestParsePlatform(t *testing.T) {
	t.Parallel()

	for _, valid := range []string{"dockerStandalone", "dockerSwarm", "kubernetes"} {
		t.Run(valid, func(t *testing.T) {
			t.Parallel()
			p, err := ParsePlatform(valid)
			require.NoError(t, err)
			assert.Equal(t, DeploymentPlatform(valid), p)
		})
	}

	t.Run("invalid returns error", func(t *testing.T) {
		t.Parallel()
		_, err := ParsePlatform("garbage")
		assert.Error(t, err)
	})
}
