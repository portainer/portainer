package utils

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestWriteAccessDeniedResponse(t *testing.T) {
	r, err := WriteAccessDeniedResponse()
	require.NoError(t, err)
	defer r.Body.Close()

	require.NotNil(t, r)
	require.Equal(t, "application/json", r.Header.Get("content-type"))
	require.Equal(t, http.StatusForbidden, r.StatusCode)
}
