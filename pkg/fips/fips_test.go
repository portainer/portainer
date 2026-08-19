package fips

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestInitFIPS(t *testing.T) {
	t.Parallel()
	InitFIPS(false)

	require.False(t, FIPSMode())

	require.True(t, CanTLSSkipVerify())
}
