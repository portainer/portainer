package setuptoken

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_Generate(t *testing.T) {
	token, err := Generate()
	require.NoError(t, err)
	assert.Len(t, token, 64, "hex-encoded 32 bytes should be 64 characters")

	token2, err := Generate()
	require.NoError(t, err)
	assert.NotEqual(t, token, token2, "two generated tokens should differ")
}

func Test_Validate_alwaysPassesWhenExpectedEmpty(t *testing.T) {
	r := httptest.NewRequest(http.MethodPost, "/", nil)
	assert.Nil(t, Validate(r, ""))
}

func Test_Validate_missingHeader(t *testing.T) {
	r := httptest.NewRequest(http.MethodPost, "/", nil)
	herr := Validate(r, "secret")
	require.NotNil(t, herr)
	assert.Equal(t, http.StatusForbidden, herr.StatusCode)
}

func Test_Validate_wrongToken(t *testing.T) {
	r := httptest.NewRequest(http.MethodPost, "/", nil)
	r.Header.Set(HeaderName, "wrong")
	herr := Validate(r, "secret")
	require.NotNil(t, herr)
	assert.Equal(t, http.StatusForbidden, herr.StatusCode)
}

func Test_Validate_correctToken(t *testing.T) {
	r := httptest.NewRequest(http.MethodPost, "/", nil)
	r.Header.Set(HeaderName, "secret")
	assert.Nil(t, Validate(r, "secret"))
}
