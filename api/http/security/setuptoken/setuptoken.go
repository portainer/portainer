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
	"github.com/rs/zerolog/log"
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

// LogToken prints the generated setup token on its own line, padded with blank
// lines, so operators can spot it and copy it cleanly from the startup logs.
// See https://linear.app/portainer/issue/R8S-1161.
func LogToken(token string) {
	banner := "=========================="
	log.Info().Msgf(
		"\n\n"+banner+"\n\n"+
			"setup_token=%s\n\n"+
			"Paste it into the setup screen, "+
			"or send it in the %s header.\n"+
			"Start with --no-setup-token to disable.\n\n"+
			banner,
		token, HeaderName,
	)
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
