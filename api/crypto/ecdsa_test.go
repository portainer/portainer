package crypto

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestCreateSignature(t *testing.T) {
	t.Parallel()
	var s = NewECDSAService("secret")

	privKey, pubKey, err := s.GenerateKeyPair()
	require.NoError(t, err)
	require.NotEmpty(t, privKey)
	require.NotEmpty(t, pubKey)

	m := "test message"
	r, err := s.CreateSignature(m)
	require.NoError(t, err)
	require.NotEqual(t, r, m)
	require.NotEmpty(t, r)
}
