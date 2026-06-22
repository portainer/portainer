// Package setuptoken provides a one-time setup token used to protect the
// public initialization endpoints (admin account creation and backup restore)
// on an uninitialized Portainer instance.
package setuptoken

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/hex"
	"errors"
	"net/http"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
)

// HeaderName is the HTTP header that carries the setup token.
const HeaderName = "X-Setup-Token"

// tokenByteLength is the number of random bytes before hex-encoding (256 bits).
const tokenByteLength = 32

var errInvalidSetupToken = errors.New("invalid or missing setup token")

// Generate returns a cryptographically random, hex-encoded setup token.
func Generate() (string, error) {
	b := make([]byte, tokenByteLength)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}

	return hex.EncodeToString(b), nil
}

// Validate checks that the request carries the expected setup token in the
// X-Setup-Token header. When expected is empty the gate is disabled and the
// request is always allowed. Comparison is constant-time.
func Validate(r *http.Request, expected string) *httperror.HandlerError {
	if expected == "" {
		return nil
	}

	provided := r.Header.Get(HeaderName)
	if subtle.ConstantTimeCompare([]byte(provided), []byte(expected)) != 1 {
		return httperror.Forbidden("Invalid or missing setup token. Provide the X-Setup-Token header with the token printed in the server logs at startup.", errInvalidSetupToken)
	}

	return nil
}
