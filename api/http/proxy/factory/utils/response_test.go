package utils

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestWriteAccessDeniedResponse(t *testing.T) {
	t.Parallel()
	r, err := WriteAccessDeniedResponse()
	require.NoError(t, err)
	defer func() {
		err = r.Body.Close()
		require.NoError(t, err)
	}()

	require.NotNil(t, r)
	require.Equal(t, "application/json", r.Header.Get("content-type"))
	require.Equal(t, http.StatusForbidden, r.StatusCode)
}
